// src/routes/contractRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const contractController = require('../controllers/contractController');

// Configurar multer para archivos en memoria
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const filename = file.originalname.toLowerCase();
        if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos .yaml o .yml'));
        }
    }
});

// GET - Listar todos los contratos
router.get('/', contractController.listContracts);

// POST - Subir un nuevo contrato (archivo)
router.post('/', upload.single('file'), contractController.uploadContractFile);

// POST - Subir contrato desde JSON (alternativa)
router.post('/json', contractController.uploadContract);

// GET - Obtener un contrato específico
router.get('/:filename', contractController.getContract);

// PUT - Actualizar un contrato
router.put('/:filename', contractController.updateContract);

// DELETE - Eliminar un contrato
router.delete('/:filename', contractController.deleteContract);

module.exports = router;
