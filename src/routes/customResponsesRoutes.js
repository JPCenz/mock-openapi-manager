// src/routes/customResponsesRoutes.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const customResponseController = require('../controllers/customResponseController');

// GET - Obtener todas las respuestas personalizadas de una configuración
router.get('/', customResponseController.getAll);

// POST - Crear una nueva respuesta personalizada
router.post('/:operationId', customResponseController.create);

// GET - Obtener una respuesta específica
router.get('/:operationId', customResponseController.getOne);

// PUT - Actualizar una respuesta personalizada
router.put('/:operationId', customResponseController.update);

// DELETE - Eliminar una respuesta personalizada
router.delete('/:operationId', customResponseController.delete);

module.exports = router;
