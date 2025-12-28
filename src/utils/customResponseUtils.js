const fs = require('fs');
const path = require('path');
const configUtils = require('./configUtils');

function getCustomResponsesDir() {
    const { CUSTOM_RESPONSES_DIR } = configUtils.getStoragePaths();
    return CUSTOM_RESPONSES_DIR;
}

// Asegurar que el directorio existe
function ensureCustomResponsesDir() {
    const dir = getCustomResponsesDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Obtener el archivo de respuestas personalizadas para una configuración
function getCustomResponseFile(configName) {
    ensureCustomResponsesDir();
    return path.join(getCustomResponsesDir(), `${configName}-responses.json`);
}

// Leer respuestas personalizadas de una configuración
function readCustomResponses(configName) {
    const config = configUtils.getConfigByName(configName);
    if (!config) {
        throw new Error(`Configuración "${configName}" no encontrada`);
    }
    
    const filePath = getCustomResponseFile(configName);
    if (!fs.existsSync(filePath)) {
        return {};
    }
    
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

// Guardar respuestas personalizadas
function saveCustomResponses(configName, responses) {
    ensureCustomResponsesDir();
    const filePath = getCustomResponseFile(configName);
    fs.writeFileSync(filePath, JSON.stringify(responses, null, 4));
}

// Obtener una respuesta específica
function getCustomResponse(configName, operationId) {
    const responses = readCustomResponses(configName);
    if (!responses[operationId]) {
        throw new Error(`Respuesta personalizada "${operationId}" no encontrada en "${configName}"`);
    }
    return responses[operationId];
}

// Crear o actualizar una respuesta personalizada
function upsertCustomResponse(configName, operationId, responseData) {
    const responses = readCustomResponses(configName);
    responses[operationId] = responseData;
    saveCustomResponses(configName, responses);
    return responseData;
}

// Eliminar una respuesta personalizada
function deleteCustomResponse(configName, operationId) {
    const responses = readCustomResponses(configName);
    if (!responses[operationId]) {
        throw new Error(`Respuesta personalizada "${operationId}" no encontrada`);
    }
    const deleted = responses[operationId];
    delete responses[operationId];
    saveCustomResponses(configName, responses);
    return deleted;
}

// Obtener todas las respuestas
function getAllCustomResponses(configName) {
    return readCustomResponses(configName);
}

module.exports = {
    readCustomResponses,
    saveCustomResponses,
    getCustomResponse,
    upsertCustomResponse,
    deleteCustomResponse,
    getAllCustomResponses,
    getCustomResponseFile
};
