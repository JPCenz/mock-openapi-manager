const fs = require('fs');
const path = require('path');
const configUtils = require('./configUtils');

function getContractsDir() {
    const { CONTRACTS_DIR } = configUtils.getStoragePaths();
    return CONTRACTS_DIR;
}

// Asegurar que el directorio de contratos existe
function ensureContractsDir() {
    const dir = getContractsDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Guardar un archivo de contrato
function saveContract(filename, content) {
    ensureContractsDir();
    const filePath = path.join(getContractsDir(), filename);
    fs.writeFileSync(filePath, content);
    return filePath;
}

// Leer un contrato específico
function readContract(filename) {
    const filePath = path.join(getContractsDir(), filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Contrato no encontrado: ${filename}`);
    }
    return fs.readFileSync(filePath, 'utf-8');
}

// Listar todos los contratos
function listContracts() {
    ensureContractsDir();
    const files = fs.readdirSync(getContractsDir());
    return files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
}

// Eliminar un contrato
function deleteContract(filename) {
    const filePath = path.join(getContractsDir(), filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Contrato no encontrado: ${filename}`);
    }
    fs.unlinkSync(filePath);
}

// Actualizar un contrato
function updateContract(filename, content) {
    const filePath = path.join(getContractsDir(), filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Contrato no encontrado: ${filename}`);
    }
    fs.writeFileSync(filePath, content);
    return filePath;
}

module.exports = {
    saveContract,
    readContract,
    listContracts,
    deleteContract,
    updateContract,
    getContractsDir
};
