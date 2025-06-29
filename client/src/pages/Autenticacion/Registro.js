import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../../components/providers/AlertProvider';
import { LogoColor, OrquestaLogreg } from '../../utils/images';
import { isValidEmail, getEmailValidationMessage, validatePassword, validateName, filterValidEmailCharacters } from '../../utils/validation';
import './Autenticacion.css';

// Componente de registro de usuarios
const Registro = () => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    userType: 'estudiante',
    rut: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    especialidad: '',
    anosExperiencia: '',
    tokenRegistro: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useAlert();

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Filtrar caracteres inválidos para email
    if (name === 'email') {
      processedValue = filterValidEmailCharacters(value);
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    // Validación en tiempo real para email
    if (name === 'email') {
      // Limpiar cualquier timeout previo
      if (window.emailValidationTimeout) {
        clearTimeout(window.emailValidationTimeout);
      }
      
      const trimmedValue = processedValue.trim();
      
      if (trimmedValue === '') {
        // Campo vacío - limpiar error
        setErrors(prev => ({
          ...prev,
          email: ''
        }));
        return;
      }
      
      // Validaciones inmediatas para errores obvios
      if (!trimmedValue.includes('@')) {
        setErrors(prev => ({
          ...prev,
          email: 'El email debe contener el símbolo @'
        }));
        return;
      }
      
      const atCount = (trimmedValue.match(/@/g) || []).length;
      if (atCount > 1) {
        setErrors(prev => ({
          ...prev,
          email: 'El email solo puede contener un símbolo @'
        }));
        return;
      }
      
      const [localPart, domainPart] = trimmedValue.split('@');
      
      if (!localPart) {
        setErrors(prev => ({
          ...prev,
          email: 'Debe ingresar texto antes del símbolo @'
        }));
        return;
      }
      
      if (!domainPart) {
        setErrors(prev => ({
          ...prev,
          email: 'Debe ingresar un dominio después del símbolo @'
        }));
        return;
      }
      
      // Validación completa con delay para mejor UX
      window.emailValidationTimeout = setTimeout(() => {
        if (!isValidEmail(trimmedValue)) {
          setErrors(prev => ({
            ...prev,
            email: getEmailValidationMessage(trimmedValue)
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            email: ''
          }));
        }
      }, 500);
    }

    // Validar confirmación de contraseña en tiempo real
    if (name === 'confirmPassword' && value.trim() !== '') {
      setTimeout(() => {
        if (formData.password !== value) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: 'Las contraseñas no coinciden'
          }));
        }
      }, 300);
    }
  };

  // Validar formulario completo
  const validateForm = () => {
    const newErrors = {};

    // Validar campos requeridos
    if (!formData.rut.trim()) {
      newErrors.rut = 'El RUT es requerido';
    }

    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos';
    } else {
      const nameValidation = validateName(formData.nombres);
      if (!nameValidation.isValid) {
        newErrors.nombres = nameValidation.message;
      }
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos';
    } else {
      const lastNameValidation = validateName(formData.apellidos);
      if (!lastNameValidation.isValid) {
        newErrors.apellidos = lastNameValidation.message;
      }
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = getEmailValidationMessage(formData.email);
    }

    // Validar teléfono
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }

    // Validar contraseña
    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validar token de registro
    if (!formData.tokenRegistro.trim()) {
      newErrors.tokenRegistro = 'El token de registro es requerido';
    }

    // Validaciones específicas para profesor
    if (formData.userType === 'profesor') {
      if (!formData.especialidad.trim()) {
        newErrors.especialidad = 'La especialidad es requerida';
      }
      if (!formData.anosExperiencia.trim()) {
        newErrors.anosExperiencia = 'Los años de experiencia son requeridos';
      }
    }

    console.log('Validando formulario de registro:', { formData, newErrors });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Procesar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulario antes de enviar
    if (!validateForm()) {
      showWarning('Formulario incompleto', 'Por favor, corrige los errores en el formulario');
      return;
    }

    try {
      const dataToSend = {
        userType: formData.userType,
        rut: formData.rut,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email,
        telefono: formData.telefono,
        password: formData.password,
        tokenRegistro: formData.tokenRegistro
      };

      // Agregar campos específicos para profesor
      if (formData.userType === 'profesor') {
        dataToSend.especialidad = formData.especialidad;
        dataToSend.anosExperiencia = formData.anosExperiencia;
      }

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Error al registrar usuario');
      }

      showSuccess('Registro exitoso', 'Usuario registrado correctamente. Serás redirigido al inicio de sesión');
      
      setTimeout(() => {
        navigate('/iniciar-sesion');
      }, 2000);
    } catch (error) {
      showError('Error de registro', error.message);
    }
  };

  return (
    <div 
      className="auth-background"
      style={{
        backgroundImage: `url(${OrquestaLogreg})`
      }}
    >
      <div className="auth-overlay"></div>
      
      <Container className="auth-container">
        <Row className="w-100 justify-content-center">
          <Col lg={6} md={8} sm={10} xs={11}>
            <Card className="auth-card">
              <Card.Body className="p-5">
                {/* Header del formulario */}
                <div className="auth-header">
                  <img 
                    src={LogoColor} 
                    alt="Logo Orquesta" 
                    className="auth-logo"
                  />
                  <h2 className="auth-title">Registro</h2>
                  <p className="auth-subtitle">Orquesta Juvenil de Cobquecura</p>
                </div>

                <Form onSubmit={handleSubmit}>
                  {/* Token de registro */}
                  <div className="auth-form-group">
                    <label className="auth-label">
                      <i className="fas fa-key me-2"></i>
                      Token de Registro
                    </label>
                    <Form.Control
                      type="text"
                      name="tokenRegistro"
                      value={formData.tokenRegistro}
                      onChange={handleChange}
                      placeholder="Ingresa el token proporcionado por el administrador"
                      required
                      className={`auth-input ${errors.tokenRegistro ? 'is-invalid' : ''}`}
                    />
                    {errors.tokenRegistro && (
                      <div className="invalid-feedback">
                        {errors.tokenRegistro}
                      </div>
                    )}
                    <small className="text-muted">
                      Solicita este token al administrador de la orquesta
                    </small>
                  </div>

                  {/* Tipo de usuario */}
                  <div className="auth-form-group">
                    <label className="auth-label">Tipo de Usuario</label>
                    <Form.Select
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      className="auth-select"
                    >
                      <option value="estudiante">Estudiante</option>
                      <option value="profesor">Profesor</option>
                    </Form.Select>
                  </div>

                  {/* RUT y Teléfono */}
                  <Row>
                    <Col md={6}>
                      <div className="auth-form-group">
                        <label className="auth-label">RUT</label>
                        <Form.Control
                          type="text"
                          name="rut"
                          value={formData.rut}
                          onChange={handleChange}
                          placeholder="12.345.678-9"
                          required
                          className={`auth-input ${errors.rut ? 'is-invalid' : ''}`}
                        />
                        {errors.rut && (
                          <div className="invalid-feedback">
                            {errors.rut}
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="auth-form-group">
                        <label className="auth-label">Teléfono</label>
                        <Form.Control
                          type="tel"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          placeholder="+56 9 1234 5678"
                          required
                          className={`auth-input ${errors.telefono ? 'is-invalid' : ''}`}
                        />
                        {errors.telefono && (
                          <div className="invalid-feedback">
                            {errors.telefono}
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>

                  {/* Nombres y Apellidos */}
                  <Row>
                    <Col md={6}>
                      <div className="auth-form-group">
                        <label className="auth-label">Nombres</label>
                        <Form.Control
                          type="text"
                          name="nombres"
                          value={formData.nombres}
                          onChange={handleChange}
                          required
                          className={`auth-input ${errors.nombres ? 'is-invalid' : ''}`}
                        />
                        {errors.nombres && (
                          <div className="invalid-feedback">
                            {errors.nombres}
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="auth-form-group">
                        <label className="auth-label">Apellidos</label>
                        <Form.Control
                          type="text"
                          name="apellidos"
                          value={formData.apellidos}
                          onChange={handleChange}
                          required
                          className={`auth-input ${errors.apellidos ? 'is-invalid' : ''}`}
                        />
                        {errors.apellidos && (
                          <div className="invalid-feedback">
                            {errors.apellidos}
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>

                  {/* Email */}
                  <div className="auth-form-group">
                    <label className="auth-label">Email</label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      required
                      className={`auth-input ${errors.email ? 'is-invalid' : ''}`}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">
                        {errors.email}
                      </div>
                    )}
                  </div>

                  {/* Campos específicos para profesor */}
                  {formData.userType === 'profesor' && (
                    <>
                      <div className="auth-form-group">
                        <label className="auth-label">Especialidad</label>
                        <Form.Control
                          type="text"
                          name="especialidad"
                          value={formData.especialidad}
                          onChange={handleChange}
                          placeholder="Ej: Violín, Piano, etc."
                          required
                          className={`auth-input ${errors.especialidad ? 'is-invalid' : ''}`}
                        />
                        {errors.especialidad && (
                          <div className="invalid-feedback">
                            {errors.especialidad}
                          </div>
                        )}
                      </div>
                      <div className="auth-form-group">
                        <label className="auth-label">Años de Experiencia</label>
                        <Form.Control
                          type="number"
                          name="anosExperiencia"
                          value={formData.anosExperiencia}
                          onChange={handleChange}
                          min="0"
                          placeholder="0"
                          className={`auth-input ${errors.anosExperiencia ? 'is-invalid' : ''}`}
                        />
                        {errors.anosExperiencia && (
                          <div className="invalid-feedback">
                            {errors.anosExperiencia}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Contraseñas */}
                  <Row>
                    <Col md={6}>
                      <div className="auth-form-group">
                        <label className="auth-label">Contraseña</label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          className={`auth-input ${errors.password ? 'is-invalid' : ''}`}
                        />
                        {errors.password && (
                          <div className="invalid-feedback">
                            {errors.password}
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="auth-form-group">
                        <label className="auth-label">Confirmar Contraseña</label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          className={`auth-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        />
                        {errors.confirmPassword && (
                          <div className="invalid-feedback">
                            {errors.confirmPassword}
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>

                  {/* Botón de registro */}
                  <Button
                    type="submit"
                    className="auth-btn-primary"
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    Registrarse
                  </Button>

                  {/* Enlaces de navegación */}
                  <div className="auth-links text-center">
                    <Button
                      variant="link"
                      onClick={() => navigate('/iniciar-sesion')}
                      className="auth-link p-0 border-0 bg-transparent d-inline-block mb-2"
                    >
                      ¿Ya tienes cuenta? Inicia sesión aquí
                    </Button>
                    <br />
                    <Button
                      variant="link"
                      onClick={() => navigate('/')}
                      className="auth-link-secondary p-0 border-0 bg-transparent d-inline-block"
                    >
                      ← Volver al inicio
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Registro;