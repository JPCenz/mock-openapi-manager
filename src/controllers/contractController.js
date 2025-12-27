const fileUtils = require('../utils/fileUtils');

// Obtener lista de todos los contratos
exports.listContracts = (req, res) => {
    try {
        const contracts = fileUtils.listContracts();
        res.json({
            success: true,
            count: contracts.length,
            contracts: contracts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Obtener un contrato específico
exports.getContract = (req, res) => {
    try {
        const { filename } = req.params;
        const content = fileUtils.readContract(filename);
        res.set('Content-Type', 'application/yaml');
        res.send(content);
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};

// Subir un nuevo contrato (archivo)
exports.uploadContractFile = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se subió ningún archivo'
            });
        }

        const filename = req.file.originalname;
        const content = req.file.buffer.toString('utf-8');

        if (!filename.endsWith('.yaml') && !filename.endsWith('.yml')) {
            return res.status(400).json({
                success: false,
                error: 'El archivo debe ser .yaml o .yml'
            });
        }

        fileUtils.saveContract(filename, content);
        res.status(201).json({
            success: true,
            message: `Contrato ${filename} subido exitosamente`,
            filename: filename,
            size: req.file.size
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Subir un contrato desde JSON (alternativa)
exports.uploadContract = (req, res) => {
    try {
        const { filename, content } = req.body;
        
        if (!filename || !content) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren filename y content'
            });
        }
        
        if (!filename.endsWith('.yaml') && !filename.endsWith('.yml')) {
            return res.status(400).json({
                success: false,
                error: 'El archivo debe ser .yaml o .yml'
            });
        }
        
        fileUtils.saveContract(filename, content);
        res.status(201).json({
            success: true,
            message: `Contrato ${filename} subido exitosamente`,
            filename: filename
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Actualizar un contrato existente
exports.updateContract = (req, res) => {
    try {
        const { filename } = req.params;
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere content'
            });
        }
        
        fileUtils.updateContract(filename, content);
        res.json({
            success: true,
            message: `Contrato ${filename} actualizado exitosamente`,
            filename: filename
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};

// Eliminar un contrato
exports.deleteContract = (req, res) => {
    try {
        const { filename } = req.params;
        fileUtils.deleteContract(filename);
        res.json({
            success: true,
            message: `Contrato ${filename} eliminado exitosamente`,
            filename: filename
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};
