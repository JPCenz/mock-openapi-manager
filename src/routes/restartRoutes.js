// src/routes/restartRoutes.js

const express = require('express');
const router = express.Router();
const restartController = require('../controllers/restartController');

// POST - Reiniciar el servidor
router.post('/', restartController.restart);

// GET - Reiniciar el servidor (alternativa)
router.get('/', restartController.restart);

module.exports = router;
module.exports.registerServer = restartController.registerServer;
