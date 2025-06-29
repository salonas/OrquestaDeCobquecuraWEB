import React, { useState, useEffect } from 'react';
import ModalPortal from '../../../components/ModalPortal';
import { useAlert } from '../../../components/providers/AlertProvider';
import './AdminPanel.css';

const Asignaciones = () => {
  // Hooks de alerta para usar shadcn/ui
  const { showConfirm, showSuccess, showError } = useAlert();
  
  // Estados principales del componente
  const [asignaciones, setAsignaciones] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [asignacionEditando, setAsignacionEditando] = useState(null);

  // Estados para búsqueda y filtrado
  const [filtros, setFiltros] = useState({
    estudiante: '',
    profesor: '',
    instrumento: '',
    estado: '',
    fechaInicio: ''
  });

  // Lista de instrumentos disponibles en la orquesta
  const instrumentos = [
    'Violín', 'Viola', 'Violonchelo', 'Contrabajo', 'Flauta', 'Clarinete', 
    'Oboe', 'Fagot', 'Trompeta', 'Trombón', 'Trompa', 'Tuba', 'Percusión',
    'Piano', 'Guitarra', 'Saxofón'
  ];

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Función para cargar asignaciones, profesores y estudiantes desde la API
  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Cargar datos en paralelo para mejorar rendimiento
      const [asignacionesRes, profesoresRes, estudiantesRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/asignaciones', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/profesores', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/estudiantes', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const asignacionesData = await asignacionesRes.json();
      const profesoresData = await profesoresRes.json();
      const estudiantesData = await estudiantesRes.json();

      console.log('Asignaciones recibidas:', asignacionesData);
      console.log('Profesores recibidos:', profesoresData);
      console.log('Estudiantes recibidos:', estudiantesData);

      // Actualizar estados con los datos recibidos
      setAsignaciones(asignacionesData);
      setProfesores(profesoresData);
      setEstudiantes(estudiantesData);
    } catch (error) {
      setMensaje('Error al cargar datos');
      console.error('Error:', error);
      setTimeout(() => setMensaje(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Función para crear o actualizar una asignación
  const handleGuardar = async (asignacionData) => {
    try {
      const token = localStorage.getItem('token');
      // Determinar URL y método según si es edición o creación
      const url = asignacionEditando 
        ? `http://localhost:5000/api/admin/asignaciones/${asignacionEditando.id}`
        : 'http://localhost:5000/api/admin/asignaciones';
      
      const method = asignacionEditando ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(asignacionData)
      });

      if (response.ok) {
        setMensaje('Asignación guardada exitosamente');
        setTimeout(() => setMensaje(''), 3000);
        handleCancelar();
        cargarDatos(); // Recargar datos actualizados
      } else {
        const errorData = await response.json();
        setMensaje(`Error: ${errorData.error}`);
        setTimeout(() => setMensaje(''), 5000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar asignación');
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  // Función para eliminar una asignación
  const handleEliminar = async (id) => {
    const confirmed = await showConfirm(
      'Eliminar Asignación',
      '¿Estás seguro de que quieres eliminar esta asignación? Esta acción no se puede deshacer.',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/asignaciones/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showSuccess('Éxito', 'Asignación eliminada exitosamente');
        cargarDatos();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.message || 'Error al eliminar asignación');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de Conexión', 'No se pudo conectar con el servidor');
    }
  };

  // Preparar datos para edición
  const handleEditar = (asignacion) => {
    setAsignacionEditando(asignacion);
    setMostrarFormulario(true);
  };

  // Cerrar formulario y limpiar estado de edición
  const handleCancelar = () => {
    setMostrarFormulario(false);
    setAsignacionEditando(null);
  };

  // Función para filtrar asignaciones según criterios de búsqueda
  const asignacionesFiltradas = asignaciones.filter(asignacion => {
    return (
      (!filtros.estudiante || 
        `${asignacion.estudiante_nombres} ${asignacion.estudiante_apellidos}`.toLowerCase().includes(filtros.estudiante.toLowerCase())) &&
      (!filtros.profesor || 
        `${asignacion.profesor_nombres} ${asignacion.profesor_apellidos}`.toLowerCase().includes(filtros.profesor.toLowerCase())) &&
      (!filtros.instrumento || asignacion.instrumento_nombre?.toLowerCase().includes(filtros.instrumento.toLowerCase())) &&
      (!filtros.estado || asignacion.estado?.toLowerCase() === filtros.estado.toLowerCase()) &&
      (!filtros.fechaInicio || asignacion.fecha_inicio?.startsWith(filtros.fechaInicio))
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
      estudiante: '',
      profesor: '',
      instrumento: '',
      estado: '',
      fechaInicio: ''
    });
  };

  // Mostrar indicador de carga
  if (loading) return <div className="loading">Cargando asignaciones...</div>;

  return (
    <div className="admin-section">
      {/* Encabezado con título y estadísticas */}
      <div className="admin-header">
        <h2>Gestión de Asignaciones</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {asignacionesFiltradas.length} de {asignaciones.length} asignaciones
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setMostrarFormulario(true)}
          >
            + CREAR ASIGNACIÓN
          </button>
        </div>
      </div>

      {/* Mostrar mensajes de éxito o error */}
      {mensaje && (
        <div className={`alert ${mensaje.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {mensaje}
        </div>
      )}

      {/* Panel de filtros y búsqueda */}
      <div className="filtros-busqueda" style={{
  background: 'rgba(248, 249, 252, 0.8)',
  padding: '1.5rem',
  borderRadius: '12px',
  marginBottom: '1.5rem',
  border: '1px solid rgba(92, 107, 192, 0.1)'
}}>
        <h6 style={{marginBottom: '1rem', color: 'var(--azul-marino)'}}>Buscar Asignaciones</h6>
        <div className="row g-3">
          {/* Filtro por ID */}
          <div className="col-md-2">
            <label className="form-label">ID</label>
            <input
              type="text"
              name="id"
              className="form-control"
              placeholder="ID de asignación"
              value={filtros.id}
              onChange={handleChange}
            />
          </div>
          {/* Filtro por profesor */}
          <div className="col-md-3">
            <label className="form-label">Profesor</label>
            <input
              type="text"
              name="profesor"
              className="form-control"
              placeholder="Nombre o RUT del profesor"
              value={filtros.profesor}
              onChange={handleChange}
            />
          </div>
          {/* Filtro por estudiante */}
          <div className="col-md-3">
            <label className="form-label">Estudiante</label>
            <input
              type="text"
              name="estudiante"
              className="form-control"
              placeholder="Nombre o RUT del estudiante"
              value={filtros.estudiante}
              onChange={handleChange}
            />
          </div>
          {/* Filtro por instrumento */}
          <div className="col-md-2">
            <label className="form-label">Instrumento</label>
            <select
              name="instrumento"
              className="form-select"
              value={filtros.instrumento}
              onChange={handleChange}
            >
              <option value="">Todos</option>
              {instrumentos.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
          {/* Filtro por estado */}
          <div className="col-md-3">
            <label className="form-label">Estado</label>
            <select
              name="estado"
              className="form-select"
              value={filtros.estado}
              onChange={handleChange}
            >
              <option value="">Todos</option>
              <option value="activa">Activa</option>
              <option value="finalizada">Finalizada</option>
              <option value="suspendida">Suspendida</option>
            </select>
          </div>
        </div>
        {/* Filtros adicionales por fecha */}
        <div className="row g-3 mt-2">
          <div className="col-md-3">
            <label className="form-label">Fecha Desde</label>
            <input
              type="date"
              name="fechaDesde"
              className="form-control"
              value={filtros.fechaDesde}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Fecha Hasta</label>
            <input
              type="date"
              name="fechaHasta"
              className="form-control"
              value={filtros.fechaHasta}
              onChange={handleChange}
            />
          </div>
        </div>
        {/* Botón para limpiar filtros */}
        <div className="filtros-actions">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={limpiarFiltros}
          >
            <i className="fas fa-times"></i> Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Modal para formulario de crear/editar */}
      <ModalPortal 
        isOpen={mostrarFormulario} 
        onClose={() => {
          setMostrarFormulario(false);
          setAsignacionEditando(null);
        }}
      >
        <FormularioAsignacion
          asignacion={asignacionEditando}
          profesores={profesores}
          estudiantes={estudiantes}
          instrumentos={instrumentos}
          onGuardar={handleGuardar}
          onCancelar={() => {
            setMostrarFormulario(false);
            setAsignacionEditando(null);
          }}
        />
      </ModalPortal>

      {/* Tabla de asignaciones */}
      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>ID</th>
              <th>Profesor</th>
              <th>Estudiante</th>
              <th>Instrumento</th>
              <th>Fecha Asignación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asignacionesFiltradas.map(asignacion => (
              <tr key={asignacion.id}>
                <td>{asignacion.id}</td>
                <td>{asignacion.profesor_nombre || 'Profesor no encontrado'}</td>
                <td>{asignacion.estudiante_nombre || 'Estudiante no encontrado'}</td>
                <td>{asignacion.instrumento}</td>
                <td>{new Date(asignacion.fecha_asignacion).toLocaleDateString('es-CL')}</td>
                <td>
                  <span className={`estado ${asignacion.estado?.toLowerCase()}`}>
                    {asignacion.estado}
                  </span>
                </td>
                <td className="acciones">
                  {/* Botón editar */}
                  <button
                    onClick={() => handleEditar(asignacion)}
                    className="btn btn-sm btn-secondary"
                  >
                    <i className="fas fa-edit"></i> Editar
                  </button>
                  {/* Botón eliminar */}
                  <button
                    onClick={() => handleEliminar(asignacion.id)}
                    className="btn btn-sm btn-danger"
                  >
                    <i className="fas fa-trash"></i> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mensaje cuando no hay resultados */}
        {asignacionesFiltradas.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">No se encontraron asignaciones</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente formulario para crear/editar asignaciones
const FormularioAsignacion = ({ asignacion, profesores, estudiantes, instrumentos, onGuardar, onCancelar }) => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    profesor_rut: '',
    estudiante_rut: '',
    instrumento: '',
    estado: 'activa',
    observaciones: ''
  });

  // Cargar datos cuando se edita una asignación existente
  useEffect(() => {
    if (asignacion) {
      setFormData({
        profesor_rut: asignacion.profesor_rut || '',
        estudiante_rut: asignacion.estudiante_rut || '',
        instrumento: asignacion.instrumento || '',
        estado: asignacion.estado || 'activa',
        observaciones: asignacion.observaciones || ''
      });
    }
  }, [asignacion]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(formData);
  };

  // Filtrar solo profesores y estudiantes activos para asignación
  const profesoresActivos = Array.isArray(profesores) ? profesores.filter(profesor => {
    if (!profesor || typeof profesor.rut === 'undefined') return false;
    return profesor.estado === 'activo';
  }) : [];

  const estudiantesActivos = Array.isArray(estudiantes) ? estudiantes.filter(estudiante => {
    if (!estudiante || typeof estudiante.rut === 'undefined') return false;
    return estudiante.estado === 'activo';
  }) : [];

  return (
    <>
      {/* Encabezado del modal */}
      <div className="modal-header">
        <h5 className="modal-title">{asignacion ? 'Editar Asignación' : 'Nueva Asignación'}</h5>
        <button type="button" className="btn-close" onClick={onCancelar}></button>
      </div>
      <div className="modal-body">
        <form id="formulario-asignacion" onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Selector de profesor */}
            <div className="col-md-6">
              <label className="form-label">Profesor *</label>
              <select 
                name="profesor_rut" 
                className="form-select"
                value={formData.profesor_rut} 
                onChange={handleChange} 
                required
              >
                <option value="">Seleccionar profesor</option>
                {profesoresActivos.map(profesor => (
                  <option key={profesor.rut} value={profesor.rut}>
                    {profesor.nombres} {profesor.apellidos} ({profesor.rut})
                  </option>
                ))}
              </select>
              {/* Advertencia si no hay profesores activos */}
              {profesoresActivos.length === 0 && (
                <small className="text-warning">
                  <i className="fas fa-exclamation-triangle"></i> No hay profesores activos disponibles
                </small>
              )}
              {/* Información sobre filtrado */}
              {Array.isArray(profesores) && profesores.length > 0 && profesoresActivos.length < profesores.length && (
                <small className="text-muted d-block mt-1">
                  <i className="fas fa-info-circle"></i> Solo se muestran profesores con estado "activo"
                </small>
              )}
            </div>

            {/* Selector de estudiante */}
            <div className="col-md-6">
              <label className="form-label">Estudiante *</label>
              <select 
                name="estudiante_rut" 
                className="form-select"
                value={formData.estudiante_rut} 
                onChange={handleChange} 
                required
              >
                <option value="">Seleccionar estudiante</option>
                {estudiantesActivos.map(estudiante => (
                  <option key={estudiante.rut} value={estudiante.rut}>
                    {estudiante.nombres} {estudiante.apellidos} ({estudiante.rut})
                  </option>
                ))}
              </select>
              {/* Advertencia si no hay estudiantes activos */}
              {estudiantesActivos.length === 0 && (
                <small className="text-warning">
                  <i className="fas fa-exclamation-triangle"></i> No hay estudiantes activos disponibles
                </small>
              )}
              {/* Información sobre filtrado */}
              {Array.isArray(estudiantes) && estudiantes.length > 0 && estudiantesActivos.length < estudiantes.length && (
                <small className="text-muted d-block mt-1">
                  <i className="fas fa-info-circle"></i> Solo se muestran estudiantes con estado "activo"
                </small>
              )}
            </div>
          </div>

          <div className="row g-3">
            {/* Selector de instrumento */}
            <div className="col-md-6">
              <label className="form-label">Instrumento *</label>
              <select 
                name="instrumento" 
                className="form-select"
                value={formData.instrumento} 
                onChange={handleChange} 
                required
              >
                <option value="">Seleccionar instrumento</option>
                {instrumentos.map(instrumento => (
                  <option key={instrumento} value={instrumento}>
                    {instrumento}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de estado */}
            <div className="col-md-6">
              <label className="form-label">Estado</label>
              <select 
                name="estado" 
                className="form-select"
                value={formData.estado} 
                onChange={handleChange} 
                required
              >
                <option value="activa">Activa</option>
                <option value="finalizada">Finalizada</option>
                <option value="suspendida">Suspendida</option>
              </select>
            </div>
          </div>

          {/* Campo de observaciones */}
          <div className="col-12">
            <label className="form-label">Observaciones</label>
            <textarea 
              name="observaciones" 
              className="form-control"
              value={formData.observaciones} 
              onChange={handleChange}
              rows="3"
            />
          </div>

          {/* Panel informativo sobre criterios */}
          <div className="col-12 mt-3">
            <div className="alert alert-info">
              <h6 className="mb-2"><i className="fas fa-info-circle"></i> Criterios de Elegibilidad:</h6>
              <ul className="mb-2">
                <li><strong>Estudiantes:</strong> Solo estudiantes con estado "activo"</li>
                <li><strong>Profesores:</strong> Solo profesores con estado "activo"</li>
                <li><strong>Importante:</strong> Las asignaciones existentes se mantienen aunque el estudiante/profesor se inactive posteriormente</li>
              </ul>
              <div className="mt-2">
                <small className="text-muted">
                  📊 <strong>Disponibles:</strong> {estudiantesActivos.length} estudiantes, {profesoresActivos.length} profesores
                </small>
              </div>
            </div>
          </div>
        </form>
      </div>
      {/* Botones de acción del modal */}
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
        <button 
          type="submit" 
          form="formulario-asignacion" 
          className="btn btn-primary"
          disabled={estudiantesActivos.length === 0 || profesoresActivos.length === 0}
        >
          {asignacion ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </>
  );
};

export default Asignaciones;