let serverInstance = null;

// Registrar la instancia del servidor
function registerServer(server) {
    serverInstance = server;
}

// Reiniciar el servidor
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
                console.log('\n⚠️ REINICIANDO SERVIDOR...\n');
                serverInstance.close(() => {
                    console.log('Servidor cerrado. Reiniciando en 2 segundos...');
                    
                    setTimeout(() => {
                        // El servidor se reinicia usando nodemon o pm2
                        // O puedes usar process.exit(0) para que nodemon lo reinicie
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
