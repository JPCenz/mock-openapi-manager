const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../config/mocks-config.json');
const CUSTOM_RESPONSES_DIR = path.join(__dirname, '../config/custom-responses');

// Asegurar que el directorio de custom responses existe
function ensureCustomResponsesDir() {
    if (!fs.existsSync(CUSTOM_RESPONSES_DIR)) {
        fs.mkdirSync(CUSTOM_RESPONSES_DIR, { recursive: true });
    }
}

// Crear archivo de respuestas personalizadas vacío
function createCustomResponseFile(configName) {
    ensureCustomResponsesDir();
    const filePath = path.join(CUSTOM_RESPONSES_DIR, `${configName}-responses.json`);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 4));
    }
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
    
    configs.push(newConfig);
    saveConfig(configs);
    
    // Crear archivo de custom responses asociado
    createCustomResponseFile(newConfig.name);
    
    return newConfig;
}

// Actualizar una configuración
function updateConfig(name, updates) {
    const configs = readConfig();
    const index = configs.findIndex(c => c.name === name);
    
    if (index === -1) {
        throw new Error(`Configuración "${name}" no encontrada`);
    }
    
    // Si el nombre cambia, renombrar el archivo de custom responses
    const oldName = configs[index].name;
    const newName = updates.name || oldName;
    
    if (oldName !== newName && configs.find(c => c.name === newName)) {
        throw new Error(`La configuración con nombre "${newName}" ya existe`);
    }
    
    // Mantener campos no modificables y actualizar los nuevos
    const updatedConfig = {
        ...configs[index],
        ...updates,
        name: oldName // El nombre se puede cambiar pero lo manejamos manualmente
    };
    
    // Si el nombre cambió, actualizar el nombre en el config
    if (newName !== oldName) {
        updatedConfig.name = newName;
        renameCustomResponseFile(oldName, newName);
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
    renameCustomResponseFile
};
