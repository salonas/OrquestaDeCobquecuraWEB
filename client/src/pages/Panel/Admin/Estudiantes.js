import React, { useState, useEffect } from 'react';
import ModalPortal from '../../../components/ModalPortal';
import { useAlert } from '../../../components/providers/AlertProvider';
import './AdminPanel.css';

const Estudiantes = () => {
  // Hooks de alerta para usar shadcn/ui
  const { showConfirm, showSuccess, showError, showWarning } = useAlert();
  
  // Estados principales del componente
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [estudianteEditando, setEstudianteEditando] = useState(null);

  // Estados para búsqueda y filtrado
  const [filtros, setFiltros] = useState({
    rut: '',
    nombre: '',
    email: '',
    estado: '',
    fechaIngreso: ''
  });

  // Cargar estudiantes al montar el componente
  useEffect(() => {
    fetchEstudiantes();
  }, []);

  // Función para cargar estudiantes desde la API
  const fetchEstudiantes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/estudiantes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEstudiantes(data);
      } else {
        setMensaje('Error al cargar estudiantes');
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Función para guardar (crear o actualizar) estudiante
  const handleGuardar = async (estudianteData) => {
    try {
      const token = localStorage.getItem('token');
      // Determinar URL y método según si es edición o creación
      const url = estudianteEditando 
        ? `http://localhost:5000/api/admin/estudiantes/${estudianteEditando.rut}`
        : 'http://localhost:5000/api/admin/estudiantes';
      
      const method = estudianteEditando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(estudianteData)
      });

      const responseData = await response.json();

      if (response.ok) {
        showSuccess('Éxito', responseData.message || (estudianteEditando ? 'Estudiante actualizado correctamente' : 'Estudiante creado correctamente'));
        fetchEstudiantes();
        handleCancelar();
      } else {
        // Mostrar errores del servidor
        console.error('Error del servidor:', responseData);
        showError('Error', responseData.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setMensaje('Error de conexión con el servidor');
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  // Preparar datos para edición
  const handleEditar = (estudiante) => {
    setEstudianteEditando(estudiante);
    setMostrarFormulario(true);
  };

  // Cerrar formulario y limpiar estado de edición
  const handleCancelar = () => {
    setMostrarFormulario(false);
    setEstudianteEditando(null);
  };

  // Función para eliminar estudiante
  const eliminarEstudiante = async (rut) => {
    const confirmed = await showConfirm(
      'Eliminar Estudiante',
      '¿Está seguro de eliminar este estudiante? Esta acción no se puede deshacer.',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/estudiantes/${rut}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showSuccess('Éxito', 'Estudiante eliminado correctamente');
        fetchEstudiantes();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.message || 'Error al eliminar estudiante');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de Conexión', 'No se pudo conectar con el servidor');
    }
  };

  // Función para cambiar estado del estudiante
  const cambiarEstado = async (rut, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/estudiantes/${rut}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        setMensaje('Estado actualizado correctamente');
        fetchEstudiantes();
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setMensaje('Error al actualizar estado');
        setTimeout(() => setMensaje(''), 5000);
      }
    } catch (error) {
      setMensaje('Error al actualizar estado');
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  // Función para filtrar estudiantes según criterios de búsqueda
  const estudiantesFiltrados = estudiantes.filter(estudiante => {
    return (
      (!filtros.rut || estudiante.rut.toLowerCase().includes(filtros.rut.toLowerCase())) &&
      (!filtros.nombre || 
        `${estudiante.nombres} ${estudiante.apellidos}`.toLowerCase().includes(filtros.nombre.toLowerCase())) &&
      (!filtros.email || (estudiante.email && estudiante.email.toLowerCase().includes(filtros.email.toLowerCase()))) &&
      (!filtros.estado || estudiante.estado === filtros.estado) &&
      (!filtros.fechaIngreso || 
        new Date(estudiante.fecha_ingreso).toISOString().split('T')[0] === filtros.fechaIngreso)
    );
  });

  // Manejar cambios en los campos de filtro
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Limpiar todos los filtros de búsqueda
  const limpiarFiltros = () => {
    setFiltros({
      rut: '',
      nombre: '',
      email: '',
      estado: '',
      fechaIngreso: ''
    });
  };

  // Mostrar indicador de carga
  if (loading) return <div className="loading">Cargando estudiantes...</div>;

  return (
    <div className="admin-section">
      {/* Encabezado con título y estadísticas */}
      <div className="admin-header">
        <h2>Gestión de Estudiantes</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {estudiantesFiltrados.length} de {estudiantes.length} | 
            Activos: {estudiantesFiltrados.filter(e => e.estado === 'activo').length}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setMostrarFormulario(true)}
          >
            + Crear Estudiante
          </button>
        </div>
      </div>

      {/* Mostrar mensajes de éxito o error */}
      {mensaje && (
        <div className={`alert ${mensaje.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {mensaje}
        </div>
      )}

      {/* Panel de búsqueda y filtros */}
      <div className="filtros-busqueda" style={{
        background: 'rgba(248, 249, 252, 0.8)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(92, 107, 192, 0.1)'
      }}>
        <h6 style={{marginBottom: '1rem', color: 'var(--azul-marino)'}}>Buscar Estudiantes</h6>
        <div className="row g-3">
          {/* Filtro por RUT */}
          <div className="col-md-3">
            <label className="form-label">RUT</label>
            <input
              type="text"
              name="rut"
              className="form-control"
              placeholder="Ej: 12.345.678-9"
              value={filtros.rut}
              onChange={handleChange}
            />
          </div>
          {/* Filtro por nombre */}
          <div className="col-md-3">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              name="nombre"
              className="form-control"
              placeholder="Nombre o apellido"
              value={filtros.nombre}
              onChange={handleChange}
            />
          </div>
          {/* Filtro por email */}
          <div className="col-md-2">
            <label className="form-label">Email</label>
            <input
              type="text"
              name="email"
              className="form-control"
              placeholder="email@ejemplo.com"
              value={filtros.email}
              onChange={handleChange}
            />
          </div>
          {/* Filtro por estado */}
          <div className="col-md-2">
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
              <option value="egresado">Egresado</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>
          {/* Filtro por fecha de ingreso */}
          <div className="col-md-2">
            <label className="form-label">Fecha Ingreso</label>
            <input
              type="date"
              name="fechaIngreso"
              className="form-control"
              value={filtros.fechaIngreso}
              onChange={handleChange}
            />
          </div>
        </div>
        {/* Botón para limpiar filtros */}
        <div style={{marginTop: '1rem'}}>
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={limpiarFiltros}
          >
            <i className="fas fa-times"></i> Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Modal para crear/editar estudiante */}
      <ModalPortal 
        isOpen={mostrarFormulario} 
        onClose={() => {
          setMostrarFormulario(false);
          setEstudianteEditando(null);
        }}
      >
        <FormularioEstudiante
          estudiante={estudianteEditando}
          onGuardar={handleGuardar}
          onCancelar={() => {
            setMostrarFormulario(false);
            setEstudianteEditando(null);
          }}
        />
      </ModalPortal>

      {/* Tabla de estudiantes */}
      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>RUT</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Email</th>
              <th>Fecha Ingreso</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {estudiantesFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '2rem', fontStyle: 'italic'}}>
                  No se encontraron estudiantes con los filtros aplicados
                </td>
              </tr>
            ) : (
              estudiantesFiltrados.map(estudiante => (
                <tr key={estudiante.rut}>
                  <td>{estudiante.rut}</td>
                  <td>{estudiante.nombres}</td>
                  <td>{estudiante.apellidos}</td>
                  <td>{estudiante.email || 'Sin email'}</td>
                  <td>
                    {estudiante.fecha_ingreso 
                      ? new Date(estudiante.fecha_ingreso).toLocaleDateString('es-CL')
                      : 'Sin fecha'
                    }
                  </td>
                  <td>
                    <span className={`estado ${estudiante.estado}`}>
                      {estudiante.estado}
                    </span>
                  </td>
                  <td className="acciones" style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                    {/* Botón editar */}
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEditar(estudiante)}
                    >
                      <i className="fas fa-edit"></i> Editar
                    </button>
                    {/* Selector de estado */}
                    <select 
                      value={estudiante.estado}
                      onChange={(e) => cambiarEstado(estudiante.rut, e.target.value)}
                      className="select-estado"
                      style={{minWidth: '100px'}}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="egresado">Egresado</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                    {/* Botón eliminar */}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => eliminarEstudiante(estudiante.rut)}
                    >
                      <i className="fas fa-trash"></i> Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente formulario para crear/editar estudiantes
const FormularioEstudiante = ({ estudiante, onGuardar, onCancelar }) => {
  // Estado del formulario con valores por defecto
  const [formData, setFormData] = useState({
    rut: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
    fecha_ingreso: '', // Campo fecha_ingreso
    notas_adicionales: '',
    estado: 'activo',
    crear_cuenta: false,
    username: '',
    password: '',
    confirm_password: ''
  });

  const [errores, setErrores] = useState({});

  // Cargar datos cuando se edita un estudiante existente
  useEffect(() => {
    if (estudiante) {
      // Mapeo completo de datos del estudiante
      setFormData({
        rut: estudiante.rut || '',
        nombres: estudiante.nombres || '',
        apellidos: estudiante.apellidos || '',
        email: estudiante.email || '',
        telefono: estudiante.telefono || '',
        fecha_nacimiento: estudiante.fecha_nacimiento 
          ? new Date(estudiante.fecha_nacimiento).toISOString().split('T')[0] 
          : '',
        fecha_ingreso: estudiante.fecha_ingreso 
          ? new Date(estudiante.fecha_ingreso).toISOString().split('T')[0]
          : '',
        notas_adicionales: estudiante.notas_adicionales || '',
        estado: estudiante.estado || 'activo',
        crear_cuenta: false,
        username: '',
        password: '',
        confirm_password: ''
      });
    } else {
      // Fecha de ingreso por defecto para nuevos estudiantes
      const fechaHoy = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        fecha_ingreso: fechaHoy
      }));
    }
  }, [estudiante]);

  // Función para generar email predictivo basado en nombres y apellidos
  const generarEmailPredictivo = (nombres, apellidos) => {
    if (!nombres || !apellidos) return '';
    const nombreLimpio = nombres.toLowerCase().replace(/[^a-z\s]/g, '').split(' ')[0];
    const apellidoLimpio = apellidos.toLowerCase().replace(/[^a-z\s]/g, '').split(' ')[0];
    return `${nombreLimpio}.${apellidoLimpio}@estudiante.cl`;
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Debugging para el checkbox
    if (name === 'crear_cuenta') {
      console.log('🔍 Checkbox crear_cuenta cambió a:', checked);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Auto-generar email y username para nuevos estudiantes
    if (!estudiante && name === 'apellidos' && formData.nombres) {
      const emailSugerido = generarEmailPredictivo(formData.nombres, value);
      setFormData(prev => ({
        ...prev,
        email: prev.email || emailSugerido,
        username: prev.username || emailSugerido
      }));
    }
    if (!estudiante && name === 'nombres' && formData.apellidos) {
      const emailSugerido = generarEmailPredictivo(value, formData.apellidos);
      setFormData(prev => ({
        ...prev,
        email: prev.email || emailSugerido,
        username: prev.username || emailSugerido
      }));
    }
  };

  // Función para validar todos los campos del formulario
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validaciones obligatorias
    if (!formData.rut.trim()) {
      nuevosErrores.rut = 'El RUT es obligatorio';
    }
    if (!formData.nombres.trim()) {
      nuevosErrores.nombres = 'Los nombres son obligatorios';
    }
    if (!formData.apellidos.trim()) {
      nuevosErrores.apellidos = 'Los apellidos son obligatorios';
    }
    if (!formData.fecha_ingreso) {
      nuevosErrores.fecha_ingreso = 'La fecha de ingreso es obligatoria';
    }

    // Validar email si está presente
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nuevosErrores.email = 'Email inválido';
    }

    // Validaciones para cuenta de usuario (solo para nuevos estudiantes)
    if (formData.crear_cuenta && !estudiante) {
      if (!formData.username.trim()) {
        nuevosErrores.username = 'El username es obligatorio';
      }
      if (!formData.password || formData.password.length < 6) {
        nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      if (formData.password !== formData.confirm_password) {
        nuevosErrores.confirm_password = 'Las contraseñas no coinciden';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    // Preparar datos para envío
    const datosParaEnviar = { ...formData };
    
    // Debugging: Mostrar los datos que se van a enviar
    console.log('🔍 Datos del formulario antes de procesar:', datosParaEnviar);
    console.log('🔍 ¿Crear cuenta?', datosParaEnviar.crear_cuenta);
    console.log('🔍 Username:', datosParaEnviar.username);
    console.log('🔍 Password length:', datosParaEnviar.password ? datosParaEnviar.password.length : 0);
    
    // Remover campos de confirmación
    delete datosParaEnviar.confirm_password;
    
    // Mantener campos de cuenta SIEMPRE si crear_cuenta es true
    if (!datosParaEnviar.crear_cuenta) {
      delete datosParaEnviar.username;
      delete datosParaEnviar.password;
    }

    console.log('✅ Datos finales a enviar:', datosParaEnviar);
    onGuardar(datosParaEnviar);
  };

  return (
    <>
      {/* Encabezado del modal */}
      <div className="modal-header">
        <h5 className="modal-title">
          {estudiante ? 'Editar Estudiante' : 'Nuevo Estudiante'}
        </h5>
        <button type="button" className="btn-close" onClick={onCancelar}></button>
      </div>
      <div className="modal-body">
        <form id="formulario-estudiante" onSubmit={handleSubmit}>
          {/* Información básica */}
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">RUT *</label>
              <input
                type="text"
                name="rut"
                className={`form-control ${errores.rut ? 'is-invalid' : ''}`}
                value={formData.rut}
                onChange={handleChange}
                disabled={!!estudiante}
                placeholder="12.345.678-9"
              />
              {errores.rut && <div className="invalid-feedback">{errores.rut}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Estado</label>
              <select
                name="estado"
                className="form-select"
                value={formData.estado}
                onChange={handleChange}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="egresado">Egresado</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombres *</label>
              <input
                type="text"
                name="nombres"
                className={`form-control ${errores.nombres ? 'is-invalid' : ''}`}
                value={formData.nombres}
                onChange={handleChange}
                placeholder="Ej: María José"
              />
              {errores.nombres && <div className="invalid-feedback">{errores.nombres}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Apellidos *</label>
              <input
                type="text"
                name="apellidos"
                className={`form-control ${errores.apellidos ? 'is-invalid' : ''}`}
                value={formData.apellidos}
                onChange={handleChange}
                placeholder="Ej: García López"
              />
              {errores.apellidos && <div className="invalid-feedback">{errores.apellidos}</div>}
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className={`form-control ${errores.email ? 'is-invalid' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="estudiante@email.com"
              />
              {errores.email && <div className="invalid-feedback">{errores.email}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                className="form-control"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          {/* Fechas importantes */}
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Fecha de Nacimiento</label>
              <input
                type="date"
                name="fecha_nacimiento"
                className="form-control"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Fecha de Ingreso *</label>
              <input
                type="date"
                name="fecha_ingreso"
                className={`form-control ${errores.fecha_ingreso ? 'is-invalid' : ''}`}
                value={formData.fecha_ingreso}
                onChange={handleChange}
              />
              {errores.fecha_ingreso && <div className="invalid-feedback">{errores.fecha_ingreso}</div>}
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">Notas Adicionales</label>
            <textarea
              name="notas_adicionales"
              className="form-control"
              value={formData.notas_adicionales}
              onChange={handleChange}
              rows="3"
              placeholder="Información adicional sobre el estudiante..."
            />
          </div>

          {/* Sección de cuenta de usuario - solo para nuevos estudiantes */}
          {!estudiante && (
            <div className="col-12 mt-4" style={{borderTop: '1px solid #dee2e6', paddingTop: '20px'}}>
              <h6 className="text-primary mb-3">
                <i className="fas fa-user-plus"></i> Cuenta de Usuario
              </h6>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="crear_cuenta"
                  id="crear_cuenta"
                  checked={formData.crear_cuenta}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="crear_cuenta">
                  Crear cuenta de acceso al sistema
                </label>
              </div>

              {formData.crear_cuenta && (
                <>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Username *</label>
                      <input
                        type="text"
                        name="username"
                        className={`form-control ${errores.username ? 'is-invalid' : ''}`}
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="usuario@estudiante.cl"
                      />
                      {errores.username && <div className="invalid-feedback">{errores.username}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contraseña *</label>
                      <input
                        type="password"
                        name="password"
                        className={`form-control ${errores.password ? 'is-invalid' : ''}`}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                      />
                      {errores.password && <div className="invalid-feedback">{errores.password}</div>}
                    </div>
                  </div>
                  <div className="row g-3 mt-2">
                    <div className="col-md-6">
                      <label className="form-label">Confirmar Contraseña *</label>
                      <input
                        type="password"
                        name="confirm_password"
                        className={`form-control ${errores.confirm_password ? 'is-invalid' : ''}`}
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="Repetir contraseña"
                      />
                      {errores.confirm_password && <div className="invalid-feedback">{errores.confirm_password}</div>}
                    </div>
                  </div>
                  <small className="text-muted">
                    <i className="fas fa-info-circle"></i> La cuenta permitirá al estudiante acceder al sistema con estos datos de inicio de sesión.
                  </small>
                </>
              )}
            </div>
          )}
        </form>
      </div>
      {/* Botones de acción del modal */}
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
        <button 
          type="submit" 
          form="formulario-estudiante" 
          className="btn btn-primary"
        >
          {estudiante ? 'Guardar' : 'Guardar'}
        </button>
      </div>
    </>
  );
};

export default Estudiantes;