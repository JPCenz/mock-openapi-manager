const configUtils = require('../utils/configUtils');

// GET - Obtener todas las configuraciones
exports.getAllConfigs = (req, res) => {
    try {
        const configs = configUtils.getAllConfigs();
        res.json({
            success: true,
            count: configs.length,
            data: configs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET - Obtener una configuración específica
exports.getConfig = (req, res) => {
    try {
        const { name } = req.params;
        const config = configUtils.getConfigByName(name);
        
        if (!config) {
            return res.status(404).json({
                success: false,
                error: `Configuración "${name}" no encontrada`
            });
        }
        
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST - Crear una nueva configuración
exports.createConfig = (req, res) => {
    try {
        const newConfig = req.body;
        
        // Validaciones básicas
        if (!newConfig.name) {
            return res.status(400).json({
                success: false,
                error: 'El campo "name" es requerido'
            });
        }
        
        const config = configUtils.createConfig(newConfig);
        res.status(201).json({
            success: true,
            message: `Configuración "${newConfig.name}" creada exitosamente (archivo de custom responses también creado)`,
            data: config
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// PUT - Actualizar una configuración
exports.updateConfig = (req, res) => {
    try {
        const { name } = req.params;
        const updates = req.body;
        
        const config = configUtils.updateConfig(name, updates);
        const message = updates.name && updates.name !== name 
            ? `Configuración renombrada de "${name}" a "${updates.name}" (archivo de custom responses también renombrado)`
            : `Configuración "${name}" actualizada exitosamente`;
        
        res.json({
            success: true,
            message: message,
            data: config
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// DELETE - Eliminar una configuración
exports.deleteConfig = (req, res) => {
    try {
        const { name } = req.params;
        const deleted = configUtils.deleteConfig(name); //(archivo de custom responses también eliminado)
        
        res.json({
            success: true,
            message: `Configuración "${name}" eliminada exitosamente`,
            data: deleted
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
