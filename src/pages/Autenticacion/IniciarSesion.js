import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useAlert } from '../../components/providers/AlertProvider';
import { LogoColor, OrquestaLogreg } from '../../utils/images';
import { isValidEmail, getEmailValidationMessage, validatePassword, filterValidEmailCharacters } from '../../utils/validation';
import './Autenticacion.css';

// Componente de inicio de sesión
const IniciarSesion = () => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'estudiante'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login } = useUser();
  const { showSuccess, showError, showWarning } = useAlert();
  const navigate = useNavigate();

  // Manejar cambios en los campos
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

    // Validación en tiempo real para email - más estricta
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
  };

  // Validar formulario antes del envío
  const validateForm = () => {
    const newErrors = {};

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = getEmailValidationMessage(formData.email);
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

    console.log('Validando formulario:', { formData, newErrors });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función auxiliar para obtener la ruta de redirección
  const getRedirectPath = (userType) => {
    switch (userType) {
      case 'administrador':
        return '/panel/admin/inicio';
      case 'profesor':
        return '/panel/profesor/inicio';
      case 'estudiante':
        return '/panel/estudiante/inicio';
      default:
        return '/';
    }
  };

  // Enviar formulario de login
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario antes de enviar
    if (!validateForm()) {
      showWarning('Formulario incompleto', 'Por favor, corrige los errores en el formulario');
      return;
    }

    setLoading(true);

    try {
      console.log('Enviando formulario de login...');
      const result = await login(formData.email, formData.password, formData.userType);
      
      if (result.success) {
        console.log('Login exitoso, redirigiendo...');
        
        showSuccess('Inicio de sesión exitoso', 'Serás redirigido a tu panel');
        
        // Redirección con prefijo /panel/
        const redirectPath = getRedirectPath(formData.userType);
        console.log('Redirigiendo a:', redirectPath);
        
        // Pequeño delay para que se vea la alerta antes de redirigir
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 1000);
        
      } else {
        console.log('Error en login:', result.error);
        showError('Error de inicio de sesión', result.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      showError('Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
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
          <Col lg={4} md={6} sm={8} xs={11}>
            <Card className="auth-card">
              <Card.Body className="p-5">
                <div className="auth-header">
                  <img 
                    src={LogoColor} 
                    alt="Logo Orquesta" 
                    className="auth-logo"
                  />
                  <h2 className="auth-title">Iniciar Sesión</h2>
                  <p className="auth-subtitle">Orquesta Juvenil de Cobquecura</p>
                </div>

                <Form onSubmit={handleSubmit}>
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
                      <option value="administrador">Administrador</option>
                    </Form.Select>
                  </div>

                  <div className="auth-form-group">
                    <label className="auth-label">Email</label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="usuario@dominio.com"
                      required
                      className={`auth-input ${errors.email ? 'is-invalid' : ''}`}
                      pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                      title="Por favor ingrese un email válido"
                      autoComplete="email"
                    />
                    {errors.email && (
                      <div className="invalid-feedback">
                        {errors.email}
                      </div>
                    )}
                  </div>

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

                  <Button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={loading}
                  >
                    <i className="fas fa-sign-in-alt me-2"></i>
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>

                  <div className="auth-links text-center">
                    <Button
                      variant="link"
                      onClick={() => navigate('/registro')}
                      className="auth-link p-0 border-0 bg-transparent d-inline-block mb-2"
                    >
                      ¿No tienes cuenta? Regístrate aquí
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

export default IniciarSesion;