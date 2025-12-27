const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../config/mocks-config.json');
const CUSTOM_RESPONSES_DIR = path.join(__dirname, '../config/custom-responses');
const CUSTOM_RESPONSES_RELATIVE_PATH = './config/custom-responses';

// Helper para construir la ruta relativa de un archivo de custom responses
function getCustomResponsePath(configName) {
    return `${CUSTOM_RESPONSES_RELATIVE_PATH}/${configName}-responses.json`;
}

// Asegurar que el directorio de custom responses existe
function ensureCustomResponsesDir() {
    if (!fs.existsSync(CUSTOM_RESPONSES_DIR)) {
        fs.mkdirSync(CUSTOM_RESPONSES_DIR, { recursive: true });
    }
}

// Crear archivo de respuestas personalizadas vacío y devolver la ruta
function createCustomResponseFile(configName) {
    ensureCustomResponsesDir();
    const filePath = path.join(CUSTOM_RESPONSES_DIR, `${configName}-responses.json`);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 4));
    }
    // Devolver la ruta relativa usando la constante
    return getCustomResponsePath(configName);
}

// Eliminar archivo de respuestas personalizadas
function deleteCustomResponseFile(configName) {
    const filePath = path.join(CUSTOM_RESPONSES_DIR, `${configName}-responses.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

// Renombrar archivo de respuestas personalizadas
function renameCustomResponseFile(oldName, newName) {
    const oldPath = path.join(CUSTOM_RESPONSES_DIR, `${oldName}-responses.json`);
    const newPath = path.join(CUSTOM_RESPONSES_DIR, `${newName}-responses.json`);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
    }
}

// Leer la configuración actual
function readConfig() {
    if (!fs.existsSync(CONFIG_FILE)) {
        return [];
    }
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
}

// Guardar la configuración
function saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
}

// Obtener todas las configuraciones
function getAllConfigs() {
    return readConfig();
}

// Limpiar objeto de actualizacion: solo incluir valores válidos
function cleanUpdates(updates) {
    const cleaned = {};
    for (const [key, value] of Object.entries(updates)) {
        // Solo incluir si no es null, undefined o string vacío
        if (value !== null && value !== undefined && value !== '') {
            cleaned[key] = value;
        }
    }
    return cleaned;
}

// Obtener una configuración por nombre
function getConfigByName(name) {
    const configs = readConfig();
    return configs.find(c => c.name === name);
}

// Crear una nueva configuración
function createConfig(newConfig) {
    const configs = readConfig();
    
    // Validar que el nombre sea único
    if (configs.find(c => c.name === newConfig.name)) {
        throw new Error(`La configuración con nombre "${newConfig.name}" ya existe`);
    }
    
    // Validar campos requeridos
    if (!newConfig.name) throw new Error('El campo "name" es requerido');
    if (!newConfig.contract) throw new Error('El campo "contract" es requerido');
    if (!newConfig.port) throw new Error('El campo "port" es requerido');
    if (!newConfig.basePath) throw new Error('El campo "basePath" es requerido');
    
    // Crear archivo de custom responses asociado y obtener su ruta
    const customResponsesPath = createCustomResponseFile(newConfig.name);
    
    // Agregar la ruta al config si no está especificada
    newConfig.customResponses = newConfig.customResponses || customResponsesPath;
    
    configs.push(newConfig);
    saveConfig(configs);
    
    return newConfig;
}

// Actualizar una configuración (partial update - solo campos válidos)
function updateConfig(name, updates) {
    const configs = readConfig();
    const index = configs.findIndex(c => c.name === name);
    
    if (index === -1) {
        throw new Error(`Configuración "${name}" no encontrada`);
    }
    
    // Limpiar updates: solo campos válidos (no null, undefined o vacíos)
    const cleanedUpdates = cleanUpdates(updates);
    
    // Si no hay campos válidos para actualizar
    if (Object.keys(cleanedUpdates).length === 0) {
        return configs[index];
    }
    
    // Si el nombre cambia, validar que no exista ya
    const oldName = configs[index].name;
    const newName = cleanedUpdates.name || oldName;
    
    if (oldName !== newName && configs.find(c => c.name === newName)) {
        throw new Error(`La configuración con nombre "${newName}" ya existe`);
    }
    
    // Mezclar: mantener antiguo, sobrescribir solo con nuevos válidos
    const updatedConfig = {
        ...configs[index],
        ...cleanedUpdates
    };
    
    // Si cambió el nombre, renombrar archivo de custom responses
    if (newName !== oldName) {
        renameCustomResponseFile(oldName, newName);
        // Actualizar también la ruta del archivo de custom responses
        updatedConfig.customResponses = getCustomResponsePath(newName);
    }
    
    configs[index] = updatedConfig;
    saveConfig(configs);
    return updatedConfig;
}

// Eliminar una configuración
function deleteConfig(name) {
    const configs = readConfig();
    const index = configs.findIndex(c => c.name === name);
    
    if (index === -1) {
        throw new Error(`Configuración "${name}" no encontrada`);
    }
    
    const deleted = configs.splice(index, 1)[0];
    saveConfig(configs);
    
    // Eliminar archivo de custom responses asociado
    deleteCustomResponseFile(name);
    
    return deleted;
}

module.exports = {
    getAllConfigs,
    getConfigByName,
    createConfig,
    updateConfig,
    deleteConfig,
    readConfig,
    saveConfig,
    createCustomResponseFile,
    deleteCustomResponseFile,
    renameCustomResponseFile,
    getCustomResponsePath,
    CUSTOM_RESPONSES_RELATIVE_PATH,
    cleanUpdates
};
