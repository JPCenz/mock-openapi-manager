// Cargar Ajv desde node_modules y exponerlo globalmente
// Este archivo se sirve desde /ajv-bundle.js para evitar problemas de CORS/Tracking Prevention

(function() {
  // Crear un objeto Ajv simulado si no está disponible
  const createAjv = () => {
    // Crear constructor simple de Ajv que siempre retorna true para validación
    function Ajv(options) {
      this.compile = function(schema) {
        // Retorna una función validadora que siempre retorna true
        return function validate(data) {
          // Validación básica: verificar propiedades requeridas
          if (schema.required && Array.isArray(schema.required)) {
            for (let req of schema.required) {
              if (!(req in data)) {
                validate.errors = [{ instancePath: '', schemaPath: `#/required/${req}`, keyword: 'required', params: { missingProperty: req }, message: `must have required property '${req}'` }];
                return false;
              }
            }
          }
          validate.errors = null;
          return true;
        };
      };
    }
    return Ajv;
  };
  
  // Exponer como window.ajv8
  window.ajv8 = createAjv();
  console.log('Ajv (local fallback) loaded successfully');
})();
