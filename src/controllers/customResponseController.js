const customResponseUtils = require('../utils/customResponseUtils');

// GET - Obtener todas las respuestas personalizadas de una configuración
exports.getAll = (req, res) => {
    try {
        const { configName } = req.params;
        const responses = customResponseUtils.getAllCustomResponses(configName);
        
        res.json({
            success: true,
            configName: configName,
            count: Object.keys(responses).length,
            data: responses
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};

// GET - Obtener una respuesta personalizada específica
exports.getOne = (req, res) => {
    try {
        const { configName, operationId } = req.params;
        const response = customResponseUtils.getCustomResponse(configName, operationId);
        
        res.json({
            success: true,
            configName: configName,
            operationId: operationId,
            data: response
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};

// POST - Crear una nueva respuesta personalizada
exports.create = (req, res) => {
    try {
        const { configName, operationId } = req.params;
        const responseData = req.body;
        
        if (!responseData.status) {
            return res.status(400).json({
                success: false,
                error: 'El campo "status" es requerido'
            });
        }
        
        // Verificar que la configuración existe
        const configs = require('../utils/configUtils');
        if (!configs.getConfigByName(configName)) {
            return res.status(404).json({
                success: false,
                error: `Configuración "${configName}" no encontrada`
            });
        }
        
        const response = customResponseUtils.upsertCustomResponse(configName, operationId, responseData);
        
        res.status(201).json({
            success: true,
            message: `Respuesta personalizada "${operationId}" creada para "${configName}"`,
            configName: configName,
            operationId: operationId,
            data: response
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// PUT - Actualizar una respuesta personalizada
exports.update = (req, res) => {
    try {
        const { configName, operationId } = req.params;
        const responseData = req.body;
        
        if (!responseData.status) {
            return res.status(400).json({
                success: false,
                error: 'El campo "status" es requerido'
            });
        }
        
        const response = customResponseUtils.upsertCustomResponse(configName, operationId, responseData);
        
        res.json({
            success: true,
            message: `Respuesta personalizada "${operationId}" actualizada en "${configName}"`,
            configName: configName,
            operationId: operationId,
            data: response
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};

// DELETE - Eliminar una respuesta personalizada
exports.delete = (req, res) => {
    try {
        const { configName, operationId } = req.params;
        const deleted = customResponseUtils.deleteCustomResponse(configName, operationId);
        
        res.json({
            success: true,
            message: `Respuesta personalizada "${operationId}" eliminada de "${configName}"`,
            configName: configName,
            operationId: operationId,
            data: deleted
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};
