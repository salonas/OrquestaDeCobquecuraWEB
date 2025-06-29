/**
 * Utilidades de validación para formularios
 * Orquesta Juvenil de Cobquecura
 */

/**
 * Valida si un email tiene un formato correcto
 * @param {string} email - El email a validar
 * @returns {boolean} - true si el email es válido, false en caso contrario
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();
  
  // Verificaciones básicas primero
  if (trimmedEmail.length === 0) {
    return false;
  }
  
  // Debe contener exactamente un @
  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    return false;
  }
  
  // Dividir en partes local y dominio
  const [localPart, domainPart] = trimmedEmail.split('@');
  
  // Verificar que ambas partes existan
  if (!localPart || !domainPart) {
    return false;
  }
  
  // Verificar longitudes
  if (localPart.length === 0 || localPart.length > 64) {
    return false;
  }
  
  if (domainPart.length === 0 || domainPart.length > 255) {
    return false;
  }
  
  // Verificar que el dominio tenga al menos un punto
  if (!domainPart.includes('.')) {
    return false;
  }
  
  // Verificar que no haya puntos consecutivos
  if (domainPart.includes('..')) {
    return false;
  }
  
  // Verificar que no empiece o termine con punto
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return false;
  }
  
  // Verificar que la parte local no empiece o termine con punto
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }
  
  // Verificar que no haya puntos consecutivos en la parte local
  if (localPart.includes('..')) {
    return false;
  }
  
  // Regex más estricto para email - solo permite caracteres alfanuméricos, puntos, guiones y algunos especiales
  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }
  
  // Verificar que la extensión final tenga al menos 2 caracteres
  const domainParts = domainPart.split('.');
  const lastPart = domainParts[domainParts.length - 1];
  if (lastPart.length < 2) {
    return false;
  }
  
  return true;
};

/**
 * Valida si los caracteres ingresados son válidos para un email
 * @param {string} value - El valor a validar
 * @returns {boolean} - true si solo contiene caracteres válidos
 */
export const hasValidEmailCharacters = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  // Regex que permite solo caracteres válidos para email
  const validCharsRegex = /^[a-zA-Z0-9@._-]*$/;
  return validCharsRegex.test(value);
};

/**
 * Filtra caracteres no válidos de un email
 * @param {string} value - El valor a filtrar
 * @returns {string} - El valor con solo caracteres válidos
 */
export const filterValidEmailCharacters = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  // Mantener solo caracteres válidos para email
  return value.replace(/[^a-zA-Z0-9@._-]/g, '');
};

/**
 * Obtiene un mensaje de error específico para validación de email
 * @param {string} email - El email que falló la validación
 * @returns {string} - Mensaje de error apropiado
 */
export const getEmailValidationMessage = (email) => {
  if (!email || email.trim() === '') {
    return 'El email es requerido';
  }
  
  const trimmedEmail = email.trim();
  
  // Verificaciones específicas para mensajes más claros
  if (!trimmedEmail.includes('@')) {
    return 'El email debe contener el símbolo @';
  }
  
  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount > 1) {
    return 'El email solo puede contener un símbolo @';
  }
  
  if (atCount === 0) {
    return 'El email debe contener el símbolo @';
  }
  
  const [localPart, domainPart] = trimmedEmail.split('@');
  
  if (!localPart || localPart.length === 0) {
    return 'Debe ingresar texto antes del símbolo @ (ej: usuario@dominio.com)';
  }
  
  if (!domainPart || domainPart.length === 0) {
    return 'Debe ingresar un dominio después del símbolo @ (ej: usuario@dominio.com)';
  }
  
  if (!domainPart.includes('.')) {
    return 'El dominio debe contener al menos un punto (ej: @dominio.com)';
  }
  
  if (domainPart.includes('..')) {
    return 'El dominio no puede tener puntos consecutivos';
  }
  
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return 'El dominio no puede empezar o terminar con punto';
  }
  
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return 'La parte antes del @ no puede empezar o terminar con punto';
  }
  
  if (localPart.includes('..')) {
    return 'No se permiten puntos consecutivos antes del @';
  }
  
  const domainParts = domainPart.split('.');
  if (domainParts.some(part => part.length === 0)) {
    return 'El dominio no puede tener puntos consecutivos';
  }
  
  const lastPart = domainParts[domainParts.length - 1];
  if (lastPart.length < 2) {
    return 'La extensión del dominio debe tener al menos 2 caracteres (ej: .com, .cl)';
  }
  
  // Verificar caracteres válidos
  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return 'El email contiene caracteres no válidos. Use solo letras, números, puntos, guiones y guiones bajos';
  }
  
  return 'Por favor, ingresa un email válido (ej: usuario@dominio.com)';
};

/**
 * Valida si una contraseña cumple con los requisitos mínimos
 * @param {string} password - La contraseña a validar
 * @returns {object} - Objeto con isValid y mensaje de error
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'La contraseña es requerida'
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: 'La contraseña debe tener al menos 6 caracteres'
    };
  }

  return {
    isValid: true,
    message: ''
  };
};

/**
 * Valida si un nombre es válido (solo letras y espacios)
 * @param {string} name - El nombre a validar
 * @returns {object} - Objeto con isValid y mensaje de error
 */
export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      message: 'El nombre es requerido'
    };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'El nombre debe tener al menos 2 caracteres'
    };
  }

  // Solo letras, espacios y algunos caracteres especiales para nombres
  const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/;
  
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      message: 'El nombre solo puede contener letras y espacios'
    };
  }

  return {
    isValid: true,
    message: ''
  };
};

/**
 * Valida si un campo es requerido y no está vacío
 * @param {string} value - El valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @returns {object} - Objeto con isValid y mensaje de error
 */
export const validateRequired = (value, fieldName = 'Campo') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      isValid: false,
      message: `${fieldName} es requerido`
    };
  }

  return {
    isValid: true,
    message: ''
  };
};

/**
 * Valida múltiples campos de un formulario
 * @param {object} formData - Datos del formulario
 * @param {object} validationRules - Reglas de validación
 * @returns {object} - Objeto con errores y si el formulario es válido
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];

    // Validar campo requerido
    if (rules.required) {
      const validation = validateRequired(value, rules.label || field);
      if (!validation.isValid) {
        errors[field] = validation.message;
        isValid = false;
        return; // No continuar con otras validaciones si es requerido y está vacío
      }
    }

    // Validar email
    if (rules.type === 'email' && value) {
      if (!isValidEmail(value)) {
        errors[field] = getEmailValidationMessage(value);
        isValid = false;
      }
    }

    // Validar contraseña
    if (rules.type === 'password' && value) {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        errors[field] = validation.message;
        isValid = false;
      }
    }

    // Validar nombre
    if (rules.type === 'name' && value) {
      const validation = validateName(value);
      if (!validation.isValid) {
        errors[field] = validation.message;
        isValid = false;
      }
    }

    // Validación personalizada
    if (rules.custom && typeof rules.custom === 'function') {
      const customValidation = rules.custom(value, formData);
      if (!customValidation.isValid) {
        errors[field] = customValidation.message;
        isValid = false;
      }
    }
  });

  return {
    isValid,
    errors
  };
};
