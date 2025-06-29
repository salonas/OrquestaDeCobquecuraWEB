import React, { useState, useEffect } from 'react';
import ModalPortal from '../../../components/ModalPortal';
import { useAlert } from '../../../components/providers/AlertProvider';
import './AdminPanel.css';

const Evaluaciones = () => {
  // Hooks de alerta para usar shadcn/ui
  const { showConfirm, showSuccess, showError } = useAlert();
  
  // Estados principales del componente
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [evaluacionEditando, setEvaluacionEditando] = useState(null);

  // Estados para búsqueda y filtrado
  const [filtros, setFiltros] = useState({
    estudiante: '',
    profesor: '',
    tipo: '',
    fechaDesde: '',
    fechaHasta: '',
    calificacionMin: '',
    calificacionMax: ''
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Función para cargar todos los datos necesarios desde la API
  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      // Realizar peticiones en paralelo para mejorar rendimiento
      const [evaluacionesRes, profesoresRes, estudiantesRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/evaluaciones', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/profesores', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/estudiantes', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const evaluacionesData = await evaluacionesRes.json();
      const profesoresData = await profesoresRes.json();
      const estudiantesData = await estudiantesRes.json();

      setEvaluaciones(evaluacionesData);
      setProfesores(profesoresData);
      setEstudiantes(estudiantesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setMensaje('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Función para crear o actualizar evaluación
  const handleGuardar = async (evaluacionData) => {
    try {
      const token = localStorage.getItem('token');
      // Determinar URL y método según si es edición o creación
      const url = evaluacionEditando 
        ? `http://localhost:5000/api/admin/evaluaciones/${evaluacionEditando.id}`
        : 'http://localhost:5000/api/admin/evaluaciones';
      
      const method = evaluacionEditando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(evaluacionData)
      });

      if (response.ok) {
        showSuccess(evaluacionEditando ? 'Evaluación actualizada correctamente' : 'Evaluación creada correctamente');
        cargarDatos(); // Recargar datos actualizados
        handleCancelar();
      } else {
        const errorData = await response.json();
        showError(`Error al guardar evaluación: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      showError('Error al guardar evaluación');
    }
  };

  // Función para eliminar evaluación
  const handleEliminar = async (id) => {
    const confirmed = await showConfirm(
      'Eliminar Evaluación',
      '¿Está seguro de eliminar esta evaluación? Esta acción no se puede deshacer.',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/evaluaciones/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showSuccess('Éxito', 'Evaluación eliminada correctamente');
        cargarDatos();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.message || 'Error al eliminar evaluación');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de Conexión', 'No se pudo conectar con el servidor');
    }
  };

  // Preparar datos para edición
  const handleEditar = (evaluacion) => {
    setEvaluacionEditando(evaluacion);
    setMostrarFormulario(true);
  };

  // Cerrar formulario y limpiar estado de edición
  const handleCancelar = () => {
    setMostrarFormulario(false);
    setEvaluacionEditando(null);
  };

  // Función para filtrar evaluaciones según criterios de búsqueda
  const evaluacionesFiltradas = evaluaciones.filter(evaluacion => {
    const fechaEvaluacion = new Date(evaluacion.fecha_evaluacion);
    const fechaDesde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
    const fechaHasta = filtros.fechaHasta ? new Date(filtros.fechaHasta) : null;
    
    return (
      (!filtros.estudiante || 
        (evaluacion.estudiante_nombre && 
         evaluacion.estudiante_nombre.toLowerCase().includes(filtros.estudiante.toLowerCase()))) &&
      (!filtros.profesor || 
        (evaluacion.profesor_nombre && 
         evaluacion.profesor_nombre.toLowerCase().includes(filtros.profesor.toLowerCase()))) &&
      (!filtros.tipo || evaluacion.tipo === filtros.tipo) &&
      (!fechaDesde || fechaEvaluacion >= fechaDesde) &&
      (!fechaHasta || fechaEvaluacion <= fechaHasta) &&
      (!filtros.calificacionMin || evaluacion.calificacion >= parseFloat(filtros.calificacionMin)) &&
      (!filtros.calificacionMax || evaluacion.calificacion <= parseFloat(filtros.calificacionMax))
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
      tipo: '',
      fechaDesde: '',
      fechaHasta: '',
      calificacionMin: '',
      calificacionMax: ''
    });
  };

  // Mostrar indicador de carga
  if (loading) return <div className="loading">Cargando evaluaciones...</div>;

  return (
    <div className="admin-section">
      {/* Encabezado con título y estadísticas */}
      <div className="admin-header">
        <h2>Gestión de Evaluaciones</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {evaluacionesFiltradas.length} de {evaluaciones.length} evaluaciones
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setMostrarFormulario(true)}
          >
            + CREAR EVALUACIÓN
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
        <h6 style={{marginBottom: '1rem', color: 'var(--azul-marino)'}}>Buscar Evaluaciones</h6>
        <div className="row g-3">
          {/* Filtro por estudiante */}
          <div className="col-md-3">
            <label className="form-label">Estudiante</label>
            <input
              type="text"
              name="estudiante"
              className="form-control"
              placeholder="Nombre del estudiante"
              value={filtros.estudiante}
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
              placeholder="Nombre del profesor"
              value={filtros.profesor}
              onChange={handleChange}
            />
          </div>
          {/* Filtro por tipo de evaluación */}
          <div className="col-md-2">
            <label className="form-label">Tipo</label>
            <select
              name="tipo"
              className="form-select"
              value={filtros.tipo}
              onChange={handleChange}
            >
              <option value="">Todos</option>
              <option value="tecnica">Técnica</option>
              <option value="interpretacion">Interpretación</option>
              <option value="teoria">Teoría</option>
              <option value="practica">Práctica</option>
              <option value="examen">Examen</option>
              <option value="repertorio">Repertorio</option>
            </select>
          </div>
          {/* Filtro por fecha desde */}
          <div className="col-md-2">
            <label className="form-label">Desde</label>
            <input
              type="date"
              name="fechaDesde"
              className="form-control"
              value={filtros.fechaDesde}
              onChange={handleChange}
            />
          </div>
          {/* Filtro por fecha hasta */}
          <div className="col-md-2">
            <label className="form-label">Hasta</label>
            <input
              type="date"
              name="fechaHasta"
              className="form-control"
              value={filtros.fechaHasta}
              onChange={handleChange}
            />
          </div>
        </div>
        {/* Filtros adicionales por calificación */}
        <div className="row g-3 mt-2">
          <div className="col-md-2">
            <label className="form-label">Nota mínima</label>
            <input
              type="number"
              name="calificacionMin"
              className="form-control"
              placeholder="1.0"
              min="1"
              max="7"
              step="0.1"
              value={filtros.calificacionMin}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Nota máxima</label>
            <input
              type="number"
              name="calificacionMax"
              className="form-control"
              placeholder="7.0"
              min="1"
              max="7"
              step="0.1"
              value={filtros.calificacionMax}
              onChange={handleChange}
            />
          </div>
          {/* Botón para limpiar filtros */}
          <div className="col-md-8 d-flex align-items-end">
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={limpiarFiltros}
            >
              <i className="fas fa-times"></i> Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar evaluación */}
      <ModalPortal 
        isOpen={mostrarFormulario} 
        onClose={() => {
          setMostrarFormulario(false);
          setEvaluacionEditando(null);
        }}
      >
        <FormularioEvaluacion
          evaluacion={evaluacionEditando}
          profesores={profesores}
          estudiantes={estudiantes}
          onGuardar={handleGuardar}
          onCancelar={() => {
            setMostrarFormulario(false);
            setEvaluacionEditando(null);
          }}
        />
      </ModalPortal>

      {/* Tabla de evaluaciones */}
      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Profesor</th>
              <th>Tipo</th>
              <th>Título</th>
              <th>Fecha</th>
              <th>Calificación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {evaluacionesFiltradas.map(evaluacion => (
              <tr key={evaluacion.id}>
                <td>{evaluacion.estudiante_nombre}</td>
                <td>{evaluacion.profesor_nombre}</td>
                <td>{evaluacion.tipo}</td>
                <td>{evaluacion.titulo}</td>
                <td>{new Date(evaluacion.fecha_evaluacion).toLocaleDateString()}</td>
                <td>
                  {/* Mostrar calificación con color según rendimiento */}
                  <span className={`estado ${evaluacion.calificacion >= 4.0 ? 'activo' : 'inactivo'}`}>
                    {evaluacion.calificacion}
                  </span>
                </td>
                <td className="acciones">
                  {/* Botón editar */}
                  <button 
                    onClick={() => handleEditar(evaluacion)} 
                    className="btn btn-sm btn-secondary"
                  >
                    <i className="fas fa-edit"></i> Editar
                  </button>
                  {/* Botón eliminar */}
                  <button 
                    onClick={() => handleEliminar(evaluacion.id)} 
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

// Componente formulario para crear/editar evaluaciones
const FormularioEvaluacion = ({ evaluacion, profesores, estudiantes, onGuardar, onCancelar }) => {
  // Estado del formulario con valores por defecto
  const [formData, setFormData] = useState({
    estudiante_rut: evaluacion?.estudiante_rut || '',
    profesor_rut: evaluacion?.profesor_rut || '',
    tipo: evaluacion?.tipo || 'tecnica',
    titulo: evaluacion?.titulo || '',
    fecha_evaluacion: evaluacion?.fecha_evaluacion ? evaluacion.fecha_evaluacion.split('T')[0] : '',
    calificacion: evaluacion?.calificacion || '',
    observaciones: evaluacion?.observaciones || ''
  });

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Preparar datos para envío
    const dataToSend = {
      estudiante_rut: formData.estudiante_rut,
      profesor_rut: formData.profesor_rut,
      tipo: formData.tipo,
      titulo: formData.titulo,
      fecha_evaluacion: formData.fecha_evaluacion,
      calificacion: parseFloat(formData.calificacion),
      observaciones: formData.observaciones,
      repertorio_id: null
    };
    
    onGuardar(dataToSend);
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      {/* Encabezado del modal */}
      <div className="modal-header">
        <h5 className="modal-title">{evaluacion ? 'Editar Evaluación' : 'Nueva Evaluación'}</h5>
        <button type="button" className="btn-close" onClick={onCancelar}></button>
      </div>
      <div className="modal-body">
        <form id="formulario-evaluacion" onSubmit={handleSubmit}>
          <div className="row g-3">
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
                {estudiantes.filter(e => e.estado === 'activo').map(estudiante => (
                  <option key={estudiante.rut} value={estudiante.rut}>
                    {estudiante.nombres} {estudiante.apellidos}
                  </option>
                ))}
              </select>
            </div>

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
                {profesores.filter(p => p.estado === 'activo').map(profesor => (
                  <option key={profesor.rut} value={profesor.rut}>
                    {profesor.nombres} {profesor.apellidos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row g-3">
            {/* Selector de tipo de evaluación */}
            <div className="col-md-6">
              <label className="form-label">Tipo *</label>
              <select 
                name="tipo" 
                className="form-select"
                value={formData.tipo} 
                onChange={handleChange} 
                required
              >
                <option value="tecnica">Técnica</option>
                <option value="interpretacion">Interpretación</option>
                <option value="teoria">Teoría</option>
                <option value="practica">Práctica</option>
                <option value="examen">Examen</option>
                <option value="repertorio">Repertorio</option>
              </select>
            </div>

            {/* Campo de calificación con validación */}
            <div className="col-md-6">
              <label className="form-label">Calificación (1-7) *</label>
              <input 
                type="number" 
                name="calificacion" 
                className="form-control"
                value={formData.calificacion} 
                onChange={handleChange}
                min="1"
                max="7"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="row g-3">
            {/* Campo de título de la evaluación */}
            <div className="col-md-6">
              <label className="form-label">Título *</label>
              <input 
                type="text" 
                name="titulo" 
                className="form-control"
                value={formData.titulo} 
                onChange={handleChange} 
                required 
              />
            </div>

            {/* Campo de fecha de evaluación */}
            <div className="col-md-6">
              <label className="form-label">Fecha de Evaluación *</label>
              <input 
                type="date" 
                name="fecha_evaluacion" 
                className="form-control"
                value={formData.fecha_evaluacion} 
                onChange={handleChange} 
                required 
              />
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
              rows="4"
            />
          </div>
        </form>
      </div>
      {/* Botones de acción del modal */}
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" form="formulario-evaluacion" className="btn btn-primary">
          {evaluacion ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </>
  );
};

export default Evaluaciones;