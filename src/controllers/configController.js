const fs = require('fs');
const path = require('path');
const configUtils = require('../utils/configUtils');

// Normaliza el campo "contract":
// - Si se provee una ruta válida fuera de contractsDir, copia el archivo al directorio de contratos configurado
// - Si ya existe en contractsDir, usa ese
// - Devuelve siempre solo el nombre de archivo
function normalizeContractField(contract) {
    if (!contract) return contract;

    const { CONTRACTS_DIR } = configUtils.getStoragePaths();
    const filename = path.basename(contract);
    const destPath = path.join(CONTRACTS_DIR, filename);

    // Candidato A: ruta relativa/absoluta respecto a src/
    const candidateA = path.resolve(__dirname, '../', contract);
    if (fs.existsSync(candidateA)) {
        if (!fs.existsSync(destPath)) {
            const dir = path.dirname(destPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.copyFileSync(candidateA, destPath);
        }
        return filename;
    }

    // Candidato B: ya existe en el directorio de contratos
    if (fs.existsSync(destPath)) {
        return filename;
    }

    // Candidato C: ruta absoluta fuera de src
    if (path.isAbsolute(contract) && fs.existsSync(contract)) {
        if (!fs.existsSync(destPath)) {
            const dir = path.dirname(destPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.copyFileSync(contract, destPath);
        }
        return filename;
    }

    // No existe el archivo en ninguna ruta conocida
    throw new Error(`Archivo de contrato no encontrado: ${contract}. Colócalo en la carpeta de contratos o proporciona una ruta válida.`);
}

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
        
        // Normalizar contrato
        newConfig.contract = normalizeContractField(newConfig.contract);

        const config = configUtils.createConfig(newConfig);
        res.status(201).json({
            success: true,
            message: `Configuración "${newConfig.name}" creada exitosamente (archivo de custom responses también creado)`,
            data: config
        });
    } catch (error) {
        // Diferenciar errores de puerto duplicado (409 Conflict)
        const statusCode = error.message.includes('puerto') ? 409 : 400;
        res.status(statusCode).json({
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

        // Normalizar contrato si viene en la actualización
        if (updates && updates.contract) {
            updates.contract = normalizeContractField(updates.contract);
        }
        
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
        // Diferenciar errores de puerto duplicado (409 Conflict)
        const statusCode = error.message.includes('puerto') ? 409 : 400;
        res.status(statusCode).json({
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
