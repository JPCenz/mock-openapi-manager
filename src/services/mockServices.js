const fs = require('fs');
const path = require('path');
const express = require('express');
const YAML = require('js-yaml');
const OpenAPIBackend = require('openapi-backend').default;
const configUtils = require('../utils/configUtils');
const customResponseUtils = require('../utils/customResponseUtils');

// Almacenar las instancias de servidores mock
const mockServers = new Map();
const mockApps = new Map();

/**
 * Leer y parsear un contrato YAML
 */
function parseContract(contractPath) {
    try {
        let absolutePath;
        // Si es ruta absoluta o relativa existente respecto a src/
        const candidateA = path.resolve(__dirname, '../', contractPath);
        if (fs.existsSync(candidateA)) {
            absolutePath = candidateA;
        } else {
            // Probar en el directorio de contratos configurado
            const { CONTRACTS_DIR } = configUtils.getStoragePaths();
            const candidateB = path.join(CONTRACTS_DIR, path.basename(contractPath));
            if (fs.existsSync(candidateB)) {
                absolutePath = candidateB;
            } else {
                throw new Error(`Archivo de contrato no encontrado: ${contractPath}`);
            }
        }

        const fileContent = fs.readFileSync(absolutePath, 'utf8');
        const spec = YAML.load(fileContent);
        return spec;
    } catch (error) {
        throw new Error(`Error al parsear contrato ${contractPath}: ${error.message}`);
    }
}

/**
 * Crear un manejador para un endpoint basado en respuestas personalizadas
 */
function createEndpointHandler(configName, operationId) {
    return (c, req, res) => {
        try {
            // Obtener todas las respuestas personalizadas
            const customResponses = customResponseUtils.getAllCustomResponses(configName);
            const customResponse = customResponses[operationId];
            
            if (customResponse && customResponse.body) {
                const statusCode = customResponse.status || 200;
                const headers = customResponse.headers || {};
                
                res.status(statusCode);
                Object.entries(headers).forEach(([key, value]) => {
                    res.set(key, value);
                });
                
                return res.json(customResponse.body);
            }
            
            return c.api.handlers.notImplemented(c, req, res);
        } catch (error) {
            console.error(`Error en handler para ${operationId}:`, error);
            return res.status(500).json({ error: error.message });
        }
    };
}

/**
 * Obtener todos los puertos en uso en servidores ya inicializados
 */
function getUsedPorts() {
    const usedPorts = new Set();
    for (const [configName, server] of mockServers) {
        const config = configUtils.getConfigByName(configName);
        if (config) {
            usedPorts.add(config.port);
        }
    }
    return usedPorts;
}

/**
 * Validar que el puerto no esté ya en uso por otra configuración
 */
function validatePortAvailability(configName, port) {
    const configs = configUtils.getAllConfigs();
    for (const config of configs) {
        // Saltar la configuración actual
        if (config.name === configName) continue;
        
        // Verificar si el puerto ya está en uso
        if (config.port === port) {
            return {
                valid: false,
                message: `Puerto ${port} ya está siendo usado por la configuración "${config.name}"`
            };
        }
    }
    return { valid: true };
}

/**
 * Inicializar un servidor mock para una configuración
 */
async function initializeMockServer(configName) {
    try {
        const config = configUtils.getConfigByName(configName);
        
        if (!config) {
            throw new Error(`Configuración "${configName}" no encontrada`);
        }
        
        // Validar disponibilidad del puerto
        const portValidation = validatePortAvailability(configName, config.port);
        if (!portValidation.valid) {
            throw new Error(portValidation.message);
        }
        
        // Parsear el contrato YAML
        const spec = parseContract(config.contract);
        
        if (!spec || !spec.paths) {
            throw new Error(`Especificación OpenAPI inválida para ${configName}`);
        }
        
        // Crear instancia de OpenAPIBackend
        const api = new OpenAPIBackend({ definition: spec });
        
        // Registrar handlers para todos los paths y métodos
        if (config.enableCustomResponses) {
            console.log(`⚙️  Habilitadas respuestas personalizadas para mock "${configName}"`);
            Object.entries(spec.paths).forEach(([path, pathItem]) => {
                Object.entries(pathItem).forEach(([method, operation]) => {
                    // Saltar si no es un método HTTP válido
                    if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
                        return;
                    }
                    
                    const operationId = operation.operationId || `${method.toUpperCase()} ${path}`;
                    
                    // Registrar el handler
                    api.register(operationId, createEndpointHandler(configName, operationId));
                });
        });
        }

        
        // Registrar handler para operaciones no implementadas
        api.register('notImplemented', (c, req, res) => {
            const {status,mock} = c.api.mockResponseForOperation(c.operation.operationId);
            if (mock) {
                res.status(status).json(mock);
            } else {
                res.status(501).json({ error: `Operación "${c.operation.operationId}" no implementada en mock "${configName}"` });
            }
        });
        
        // Registrar handler para errores de validación
        api.register('validationFail', (c, req, res) => {
            res.status(400).json({
                error: 'Validación fallida',
                details: c.validation.errors || 'Error en la validación de la petición'
            });
        });
        
        // Inicializar la API
        api.init();
        
        // Crear app Express para este mock
        const mockApp = express();
        mockApp.use(express.json());
        
        // Agregar CORS
        mockApp.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }
            next();
        });
        
        // Usar basePath de la configuración
        const basePath = config.basePath || '/';
        
        // Registrar middleware de OpenAPI
        mockApp.use(basePath, (req, res, next) => {
            api.handleRequest(req, req, res).catch(next);
        });
        
        // Manejador de errores
        mockApp.use((err, req, res, next) => {
            console.error(`Error en ${configName}:`, err);
            res.status(err.status || 500).json({
                error: err.message || 'Error interno del servidor'
            });
        });
        
        // Guardar la app
        mockApps.set(configName, mockApp);
        
        // Iniciar servidor si está habilitado
        if (config.enableMock !== false) {
            const server = mockApp.listen(config.port, () => {
                console.log(`✅ Mock server "${configName}" escuchando en puerto ${config.port}`);
                console.log(`   Rutas base: ${basePath}`);
                logMockRoutes(configName, spec);
            });
            
            mockServers.set(configName, server);
        }
        
        return { success: true, config: configName };
    } catch (error) {
        console.error(`❌ Error inicializando mock "${configName}":`, error.message);
        return { success: false, error: error.message, config: configName };
    }
}

/**
 * Reiniciar un servidor mock
 */
async function restartMockServer(configName) {
    try {
        // Detener servidor anterior
        await stopMockServer(configName);
        
        // Reiniciar
        return await initializeMockServer(configName);
    } catch (error) {
        console.error(`Error reiniciando mock "${configName}":`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Detener un servidor mock
 */
async function stopMockServer(configName) {
    return new Promise((resolve) => {
        const server = mockServers.get(configName);
        
        if (server) {
            server.close(() => {
                mockServers.delete(configName);
                mockApps.delete(configName);
                console.log(`⛔ Mock server "${configName}" detenido`);
                resolve();
            });
        } else {
            resolve();
        }
    });
}

/**
 * Inicializar todos los mocks desde la configuración
 */
async function initializeAllMocks() {
    try {
        const configs = configUtils.getAllConfigs();
        
        if (configs.length === 0) {
            console.log('ℹ️ No hay configuraciones de mocks definidas');
            return { success: true, initialized: 0, failed: 0 };
        }
        
        console.log('\n🚀 Inicializando servidores mock...\n');
        
        const results = [];
        for (const config of configs) {
            const result = await initializeMockServer(config.name);
            results.push(result);
        }
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`\n✅ Mocks inicializados: ${successful}/${results.length}`);
        
        return { success: true, initialized: successful, failed: failed, results };
    } catch (error) {
        console.error('Error inicializando mocks:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Detener todos los mocks
 */
async function stopAllMocks() {
    const configs = configUtils.getAllConfigs();
    
    for (const config of configs) {
        await stopMockServer(config.name);
    }
}

/**
 * Obtener información de un mock
 */
function getMockInfo(configName) {
    const config = configUtils.getConfigByName(configName);
    const server = mockServers.get(configName);
    
    if (!config) {
        return null;
    }
    
    return {
        name: config.name,
        port: config.port,
        basePath: config.basePath,
        contract: config.contract,
        running: !!server,
        customResponsesFile: `${configName}-responses.json`
    };
}

/**
 * Loguear rutas de un mock
 */
function logMockRoutes(configName, spec) {
    if (!spec.paths) return;
    
    console.log(`   Rutas disponibles:`);
    Object.entries(spec.paths).forEach(([path, methods]) => {
        Object.keys(methods).forEach(method => {
            if (!['parameters', 'servers'].includes(method)) {
                console.log(`   - ${method.toUpperCase()} ${path}`);
            }
        });
    });
}

module.exports = {
    initializeMockServer,
    restartMockServer,
    stopMockServer,
    initializeAllMocks,
    stopAllMocks,
    getMockInfo,
    parseContract,
    mockServers,
    mockApps
};
