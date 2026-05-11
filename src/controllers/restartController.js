let serverInstance = null;
const mockServices = require('../services/mockServices');

// Registrar la instancia del servidor
function registerServer(server) {
    serverInstance = server;
}

// Reiniciar un mock específico
exports.restartMock = async (req, res) => {
    try {
        const { configName } = req.params;
        
        const result = await mockServices.restartMockServer(configName);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Mock server "${configName}" reiniciado exitosamente`,
                config: configName
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Error reiniciando mock',
                config: configName
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Reiniciar todos los mocks
exports.restartAllMocks = async (req, res) => {
    try {
        // Detener todos los mocks
        await mockServices.stopAllMocks();
        console.log('\n⚠️ REINICIANDO TODOS LOS MOCK SERVERS...\n');
        
        
        // Reiniciar todos
        const result = await mockServices.initializeAllMocks();
        
        res.json({
            success: result.success,
            message: 'Todos los mock servers reiniciados exitosamente',
            initialized: result.initialized,
            failed: result.failed
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Reiniciar el servidor principal
exports.restart = (req, res) => {
    try {
        // Enviar respuesta antes de reiniciar
        res.json({
            success: true,
            message: 'Servidor reiniciándose...',
            timestamp: new Date().toISOString()
        });

        // Dar tiempo para que se envíe la respuesta antes de cerrar
        setTimeout(() => {
            if (serverInstance) {
                console.log('\n⚠️ REINICIANDO SERVIDOR PRINCIPAL...\n');
                serverInstance.close(() => {
                    console.log('Servidor cerrado. Reiniciando en 2 segundos...');
                    
                    setTimeout(() => {
                        // El servidor se reinicia usando nodemon o pm2
                        process.exit(0);
                    }, 2000);
                });
            }
        }, 500);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports.registerServer = registerServer;

