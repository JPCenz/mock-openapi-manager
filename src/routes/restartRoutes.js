// src/routes/restartRoutes.js

const express = require('express');
const router = express.Router();
const restartController = require('../controllers/restartController');

// POST - Reiniciar el servidor principal
router.post('/', restartController.restart);

// GET - Reiniciar el servidor principal (alternativa)
router.get('/', restartController.restart);

// POST - Reiniciar un mock específico
router.post('/mock/:configName', restartController.restartMock);

// POST - Reiniciar todos los mocks
router.post('/mocks/all', restartController.restartAllMocks);

module.exports = router;
module.exports.registerServer = restartController.registerServer;
