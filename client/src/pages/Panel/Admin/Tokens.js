import React, { useState, useEffect } from 'react';
import ModalPortal from '../../../components/ModalPortal';
import { useAlert } from '../../../components/providers/AlertProvider';
import './AdminPanel.css';

const Tokens = () => {
  // Hooks de alerta para usar shadcn/ui
  const { showConfirm, showSuccess, showError } = useAlert();
  
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tokenEditando, setTokenEditando] = useState(null);

  // Estados para búsqueda
  const [filtros, setFiltros] = useState({
    token: '',
    tipo_usuario: '',
    estado: '',
    fechaExpiracion: ''
  });

  useEffect(() => {
    cargarTokens();
  }, []);

  const cargarTokens = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/tokens', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTokens(data);
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Error al cargar tokens');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de Conexión', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async (tokenData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tokenData)
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess('Éxito', 'Token creado correctamente');
        cargarTokens();
        handleCancelar();
      } else {
        showError('Error', data.error || 'Error al crear token');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de Conexión', 'No se pudo conectar con el servidor');
    }
  };

  const handleCambiarEstado = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/tokens/${id}/desactivar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showSuccess('Éxito', 'Estado del token actualizado');
        cargarTokens();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de Conexión', 'No se pudo conectar con el servidor');
    }
  };

  const handleEliminar = async (id) => {
    const confirmed = await showConfirm(
      'Eliminar Token',
      '¿Está seguro de eliminar este token? Esta acción no se puede deshacer.',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/tokens/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showSuccess('Éxito', 'Token eliminado correctamente');
        cargarTokens();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Error al eliminar token');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de Conexión', 'No se pudo conectar con el servidor');
    }
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
  };

  // Filtrar tokens según criterios
  const tokensFiltrados = tokens.filter(token => {
    const fechaExpiracion = new Date(token.fecha_expiracion);
    const fechaFiltro = filtros.fechaExpiracion ? new Date(filtros.fechaExpiracion) : null;
    
    return (
      (!filtros.token || token.token.toLowerCase().includes(filtros.token.toLowerCase())) &&
      (!filtros.tipo_usuario || token.tipo_usuario === filtros.tipo_usuario) &&
      (!filtros.estado || 
        (filtros.estado === 'activo' && token.activo) ||
        (filtros.estado === 'inactivo' && !token.activo) ||
        (filtros.estado === 'expirado' && fechaExpiracion < new Date()) ||
        (filtros.estado === 'disponible' && token.usos_actuales < token.usos_maximos && token.activo)) &&
      (!fechaFiltro || 
        fechaExpiracion.toISOString().split('T')[0] === filtros.fechaExpiracion)
    );
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      token: '',
      tipo_usuario: '',
      estado: '',
      fechaExpiracion: ''
    });
  };

  if (loading) return <div className="loading">Cargando tokens...</div>;

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h2>Gestión de Tokens de Registro</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {tokensFiltrados.length} de {tokens.length} tokens
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setMostrarFormulario(true)}
          >
            + CREAR TOKEN
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`alert ${mensaje.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {mensaje}
        </div>
      )}

      {/* Panel de búsqueda */}
      <div className="filtros-busqueda" style={{
        background: 'rgba(248, 249, 252, 0.8)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(92, 107, 192, 0.1)'
      }}>
        <h6 style={{marginBottom: '1rem', color: 'var(--azul-marino)'}}>Buscar Tokens</h6>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Token</label>
            <input
              type="text"
              name="token"
              className="form-control"
              placeholder="ORC-XXXXX"
              value={filtros.token}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Tipo Usuario</label>
            <select
              name="tipo_usuario"
              className="form-select"
              value={filtros.tipo_usuario}
              onChange={handleChange}
            >
              <option value="">Todos</option>
              <option value="estudiante">Estudiante</option>
              <option value="profesor">Profesor</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Estado</label>
            <select
              name="estado"
              className="form-select"
              value={filtros.estado}
              onChange={handleChange}
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="expirado">Expirado</option>
              <option value="disponible">Disponible para uso</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Fecha Expiración</label>
            <input
              type="date"
              name="fechaExpiracion"
              className="form-control"
              value={filtros.fechaExpiracion}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="filtros-actions">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={limpiarFiltros}
          >
            <i className="fas fa-times"></i> Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Modal para crear/editar token */}
      <ModalPortal 
        isOpen={mostrarFormulario} 
        onClose={() => {
          setMostrarFormulario(false);
          setTokenEditando(null);
        }}
      >
        <FormularioToken
          token={tokenEditando}
          onGuardar={handleGuardar}
          onCancelar={() => {
            setMostrarFormulario(false);
            setTokenEditando(null);
          }}
        />
      </ModalPortal>

      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>Token</th>
              <th>Tipo Usuario</th>
              <th>Usos Máximos</th>
              <th>Usos Actuales</th>
              <th>Fecha Expiración</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tokensFiltrados.map(token => (
              <tr key={token.id}>
                <td>
                  <code className="token-value">{token.token}</code>
                </td>
                <td>
                  <span className={`estado ${token.tipo_usuario}`}>
                    {token.tipo_usuario.charAt(0).toUpperCase() + token.tipo_usuario.slice(1)}
                  </span>
                </td>
                <td>{token.usos_maximos}</td>
                <td>{token.usos_actuales}</td>
                <td>{new Date(token.fecha_expiracion).toLocaleDateString('es-CL')}</td>
                <td>
                  <span className={`estado ${token.activo ? 'activo' : 'inactivo'}`}>
                    {token.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="acciones">
                  <button 
                    onClick={() => handleCambiarEstado(token.id)}
                    className={`btn btn-sm ${token.activo ? 'btn-warning' : 'btn-success'}`}
                  >
                    <i className={`fas ${token.activo ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                    {token.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button 
                    onClick={() => handleEliminar(token.id)}
                    className="btn btn-sm btn-danger"
                  >
                    <i className="fas fa-trash"></i> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FormularioToken = ({ token, onGuardar, onCancelar }) => {
  const { showError } = useAlert();
  const [formData, setFormData] = useState({
    token: '',
    tipo_usuario: 'estudiante',
    usos_maximos: 1,
    fecha_expiracion: ''
  });

  // Estado para controlar si el token es editable
  const [tokenEditable, setTokenEditable] = useState(true);
  const [tokenGeneradoAuto, setTokenGeneradoAuto] = useState(false);

  useEffect(() => {
    if (token) {
      // Editando token existente
      setFormData({
        token: token.token,
        tipo_usuario: token.tipo_usuario,
        usos_maximos: token.usos_maximos,
        fecha_expiracion: new Date(token.fecha_expiracion).toISOString().split('T')[0]
      });
      setTokenEditable(false);
    } else {
      // Creando nuevo token - generar uno automáticamente
      generarTokenAutomatico();
      
      // Establecer fecha de expiración por defecto (1 año)
      const fechaExpiracion = new Date();
      fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 1);
      setFormData(prev => ({
        ...prev,
        fecha_expiracion: fechaExpiracion.toISOString().split('T')[0]
      }));
    }
  }, [token]);

  const generarTokenAutomatico = () => {
    // Generar tokens más variados y legibles
    const prefijos = ['orquestacobquecura', 'cobquecura', 'orc', 'musica', 'clasico'];
    const años = ['2024', '2025'];
    const sufijos = ['estudiante', 'profesor', 'musico', 'arte'];
    
    const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)];
    const año = años[Math.floor(Math.random() * años.length)];
    const sufijo = sufijos[Math.floor(Math.random() * sufijos.length)];
    const numero = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    const nuevoToken = `${prefijo}${año}${sufijo}${numero}`;
    
    setFormData(prev => ({ ...prev, token: nuevoToken }));
    setTokenGeneradoAuto(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Si edita el token manualmente, ya no es auto-generado
    if (name === 'token') {
      setTokenGeneradoAuto(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones mejoradas
    if (!formData.token.trim()) {
      showError('Error de Validación', 'El token no puede estar vacío');
      return;
    }
    
    if (formData.token.trim().length < 6) {
      showError('Error de Validación', 'El token debe tener al menos 6 caracteres');
      return;
    }
    
    // Validar que no contenga espacios
    if (formData.token.includes(' ')) {
      showError('Error de Validación', 'El token no puede contener espacios');
      return;
    }
    
    // Validar fecha
    const fechaSeleccionada = new Date(formData.fecha_expiracion);
    const fechaActual = new Date();
    if (fechaSeleccionada <= fechaActual) {
      showError('Error de Validación', 'La fecha de expiración debe ser futura');
      return;
    }
    
    onGuardar(formData);
  };

  // Alternar editabilidad del token
  const toggleTokenEditable = () => {
    setTokenEditable(!tokenEditable);
  };

  // Generar token completamente personalizado
  const generarTokenPersonalizado = () => {
    const opciones = [
      'orquestacobquecura2025',
      'cobquecura2024musica',
      'orc2025estudiante',
      'musicacobquecura',
      'sinfonia2025',
      'estudiante2024orc',
      'profesor2025musica',
      'clasico2024cobquecura'
    ];
    
    const tokenSeleccionado = opciones[Math.floor(Math.random() * opciones.length)];
    const numero = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    setFormData(prev => ({ 
      ...prev, 
      token: `${tokenSeleccionado}${numero}` 
    }));
    setTokenGeneradoAuto(true);
  };

  return (
    <>
      <div className="modal-header">
        <h5 className="modal-title">
          <i className="fas fa-key me-2"></i>
          {token ? 'Editar Token' : 'Nuevo Token'}
        </h5>
        <button type="button" className="btn-close" onClick={onCancelar}></button>
      </div>
      <div className="modal-body">
        <form id="formulario-token" onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Campo Token con controles */}
            <div className="col-12">
              <label className="form-label">
                <i className="fas fa-key me-1"></i>
                Token de Registro *
              </label>
              <div className="input-group">
                <input 
                  type="text" 
                  name="token" 
                  className="form-control"
                  value={formData.token} 
                  onChange={handleChange}
                  required
                  readOnly={!tokenEditable}
                  placeholder="Ingrese un token personalizado"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    fontWeight: tokenGeneradoAuto ? '600' : '400',
                    backgroundColor: tokenEditable ? '#fff' : '#f8f9fa'
                  }}
                />
                <button 
                  type="button" 
                  onClick={toggleTokenEditable}
                  className={`btn ${tokenEditable ? 'btn-warning' : 'btn-outline-secondary'}`}
                  title={tokenEditable ? 'Bloquear edición' : 'Permitir edición'}
                >
                  <i className={`fas ${tokenEditable ? 'fa-lock-open' : 'fa-lock'}`}></i>
                </button>
                <button 
                  type="button" 
                  onClick={generarTokenAutomatico}
                  className="btn btn-outline-primary"
                  title="Generar token simple"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
                <button 
                  type="button" 
                  onClick={generarTokenPersonalizado}
                  className="btn btn-outline-success"
                  title="Generar token personalizado"
                >
                  <i className="fas fa-magic"></i>
                </button>
              </div>
              <small className="form-text text-muted">
                {tokenEditable ? 
                  'Puedes escribir un token personalizado (mínimo 6 caracteres, sin espacios)' : 
                  'Click en el candado para editar manualmente'
                }
                {tokenGeneradoAuto && <span className="text-success ms-2"><i className="fas fa-check"></i> Token generado automáticamente</span>}
              </small>
            </div>

            {/* Tipo de Usuario */}
            <div className="col-md-6">
              <label className="form-label">
                <i className="fas fa-user-tag me-1"></i>
                Tipo de Usuario *
              </label>
              <select 
                name="tipo_usuario" 
                className="form-select"
                value={formData.tipo_usuario} 
                onChange={handleChange} 
                required
              >
                <option value="estudiante">👨‍🎓 Estudiante</option>
                <option value="profesor">👨‍🏫 Profesor</option>
              </select>
            </div>

            {/* Usos Máximos */}
            <div className="col-md-6">
              <label className="form-label">
                <i className="fas fa-hashtag me-1"></i>
                Usos Máximos *
              </label>
              <input 
                type="number" 
                name="usos_maximos" 
                className="form-control"
                value={formData.usos_maximos} 
                onChange={handleChange}
                min="1"
                max="999"
                required
              />
              <small className="form-text text-muted">
                Cantidad de veces que se puede usar este token
              </small>
            </div>

            {/* Fecha de Expiración */}
            <div className="col-12">
              <label className="form-label">
                <i className="fas fa-calendar-alt me-1"></i>
                Fecha de Expiración *
              </label>
              <input 
                type="date" 
                name="fecha_expiracion" 
                className="form-control"
                value={formData.fecha_expiracion} 
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <small className="form-text text-muted">
                El token será válido hasta esta fecha
              </small>
            </div>

            {/* Vista previa del token */}
            <div className="col-12">
              <div className="alert alert-info">
                <h6><i className="fas fa-eye me-2"></i>Vista previa del token:</h6>
                <code className="token-preview" style={{
                  fontSize: '1.1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}>
                  {formData.token || 'token-vacio'}
                </code>
              </div>
            </div>
          </div>
        </form>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>
          <i className="fas fa-times me-1"></i>
          Cancelar
        </button>
        <button type="submit" form="formulario-token" className="btn btn-primary">
          <i className={`fas ${token ? 'fa-save' : 'fa-plus'} me-1`}></i>
          {token ? 'Actualizar Token' : 'Crear Token'}
        </button>
      </div>
    </>
  );
};

export default Tokens;