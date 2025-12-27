const express = require('express');
const app = express();
const path = require('path');
const config = require('./config/mocks-config.json');
const serverConfig = require('./config/server-config.json');

// Import routing modules from index.js
const routes = require('./routes');

// Import mock services
const mockServices = require('./services/mockServices');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Permitir peticiones desde el frontend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const API_PATH = '/api/';

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.redirect('/admin'));
// Ensure /admin and /admin/ both serve the admin.html
app.get(['/admin', '/admin/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Use the modules in the application
app.use(API_PATH + 'config/:configName/custom-responses', routes.customResponsesRoutes);
app.use(API_PATH + 'config', routes.configRoutes);
app.use(API_PATH + 'contract', routes.contractRoutes);
app.use(API_PATH + 'restart', routes.restartRoutes);

const PORT = process.env.PORT || serverConfig.port || 5000;

// Función para imprimir todos los paths registrados
function printAllRoutes(app) {
    console.log('\n=== RUTAS REGISTRADAS ===\n');
    const routes = [];
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            // Rutas directo en app
            const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
            routes.push(`${methods} ${middleware.route.path}`);
        } else if (middleware.name === 'router' && middleware.regexp) {
            // Router middleware (nuestras rutas)
            const basePath = middleware.regexp.source
                .replace(/\\/g, '')
                .replace(/\?.*/, '')
                .replace(/\(/g, '')
                .replace(/\)/g, '')
                .replace(/\^/g, '')
                .replace(/\//g, '/');
            
            middleware.handle.stack.forEach(handler => {
                const route = handler.route;
                if (route) {
                    const methods = Object.keys(route.methods).map(m => m.toUpperCase()).join(', ');
                    const fullPath = basePath + (route.path === '/' ? '' : route.path);
                    routes.push(`${methods} ${fullPath}`);
                }
            });
        }
    });
    
    routes.forEach(route => console.log(route));
    console.log('\n======================\n');
}

const server = app.listen(PORT, async () => {
    console.log("app listening on port: " + PORT);
    printAllRoutes(app);
    
    // Inicializar todos los mocks
    await mockServices.initializeAllMocks();
});

// Registrar la instancia del servidor en el controlador de restart
routes.restartRoutes.registerServer(server);
