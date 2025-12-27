// src/routes/configRoutes.js

const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// GET - Obtener todas las configuraciones de mocks
router.get('/', configController.getAllConfigs);

// POST - Crear una nueva configuración de mock
router.post('/', configController.createConfig);

// GET - Obtener una configuración específica
router.get('/:name', configController.getConfig);

// PUT - Actualizar una configuración
router.put('/:name', configController.updateConfig);

// DELETE - Eliminar una configuración
router.delete('/:name', configController.deleteConfig);

module.exports = router;
