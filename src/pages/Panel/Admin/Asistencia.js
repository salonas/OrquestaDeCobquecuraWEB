import React, { useState, useEffect } from 'react';
import ModalPortal from '../../../components/ModalPortal';
import { useAlert } from '../../../components/providers/AlertProvider';
import './AdminPanel.css';

const Asistencia = () => {
  // Hooks de alerta para usar shadcn/ui
  const { showConfirm, showSuccess, showError } = useAlert();
  
  // Estados principales del componente
  const [asistencias, setAsistencias] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [asistenciaEditando, setAsistenciaEditando] = useState(null);
  
  // Estados para filtros de búsqueda
  const [filtros, setFiltros] = useState({
    estudiante: '',
    profesor: '',
    fecha: '',
    presente: '',
    horario: ''
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Función para cargar todos los datos necesarios desde la API
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔄 Cargando datos de asistencia...');
      console.log('Token:', token ? 'Presente' : 'Ausente');

      // Realizar peticiones en paralelo para mejorar rendimiento
      const [asistenciasResponse, estudiantesResponse, profesoresResponse, horariosResponse] = await Promise.all([
        fetch('http://localhost:5000/api/admin/asistencias', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('http://localhost:5000/api/admin/estudiantes', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/profesores', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/horarios', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      console.log('📊 Response status:', {
        asistencias: asistenciasResponse.status,
        estudiantes: estudiantesResponse.status,
        profesores: profesoresResponse.status,
        horarios: horariosResponse.status
      });

      // Procesar respuesta de asistencias
      if (asistenciasResponse.ok) {
        const data = await asistenciasResponse.json();
        console.log('📋 Asistencias recibidas:', data);
        
        if (Array.isArray(data)) {
          setAsistencias(data);
          console.log('✅ Asistencias cargadas correctamente:', data.length);
        } else {
          console.warn('⚠️ Los datos no son un array:', data);
          setAsistencias([]);
        }
      } else {
        const errorText = await asistenciasResponse.text();
        console.error('❌ Error en la respuesta:', asistenciasResponse.status, errorText);
        setAsistencias([]);
        setMensaje(`Error al cargar asistencias: ${asistenciasResponse.status}`);
      }
      
      // Procesar respuesta de estudiantes
      if (estudiantesResponse.ok) {
        const data = await estudiantesResponse.json();
        console.log('👥 Estudiantes raw data:', data);
        if (Array.isArray(data)) {
          setEstudiantes(data);
        } else if (data && Array.isArray(data.data)) {
          setEstudiantes(data.data);
        } else {
          console.warn('⚠️ Estudiantes no es un array:', data);
          setEstudiantes([]);
        }
      } else {
        console.error('❌ Error al cargar estudiantes:', estudiantesResponse.status);
        setEstudiantes([]);
      }
      
      // Procesar respuesta de profesores
      if (profesoresResponse.ok) {
        const data = await profesoresResponse.json();
        console.log('👨‍🏫 Profesores raw data:', data);
        if (Array.isArray(data)) {
          setProfesores(data);
        } else if (data && Array.isArray(data.data)) {
          setProfesores(data.data);
        } else {
          console.warn('⚠️ Profesores no es un array:', data);
          setProfesores([]);
        }
      } else {
        console.error('❌ Error al cargar profesores:', profesoresResponse.status);
        setProfesores([]);
      }
      
      // Procesar respuesta de horarios
      if (horariosResponse.ok) {
        const data = await horariosResponse.json();
        console.log('📅 Horarios raw data:', data);
        if (Array.isArray(data)) {
          setHorarios(data);
        } else if (data && Array.isArray(data.data)) {
          setHorarios(data.data);
        } else {
          console.warn('⚠️ Horarios no es un array:', data);
          setHorarios([]);
        }
      } else {
        console.error('❌ Error al cargar horarios:', horariosResponse.status);
        setHorarios([]);
      }

    } catch (error) {
      console.error('💥 Error cargando datos:', error);
      setMensaje('Error al cargar los datos: ' + error.message);
      // Limpiar estados en caso de error
      setAsistencias([]);
      setEstudiantes([]);
      setProfesores([]);
      setHorarios([]);
      setTimeout(() => setMensaje(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Función para guardar o actualizar asistencia
  const handleGuardar = async (asistenciaData) => {
    try {
      const token = localStorage.getItem('token');
      // Determinar URL y método según si es edición o creación
      const url = asistenciaEditando 
        ? `http://localhost:5000/api/admin/asistencias/${asistenciaEditando.id}`
        : 'http://localhost:5000/api/admin/asistencias';
      
      const method = asistenciaEditando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(asistenciaData)
      });

      if (response.ok) {
        setMensaje(asistenciaEditando ? 'Asistencia actualizada exitosamente' : 'Asistencia registrada exitosamente');
        setMostrarFormulario(false);
        setAsistenciaEditando(null);
        cargarDatos(); // Recargar datos actualizados
        setTimeout(() => setMensaje(''), 3000);
      } else {
        const error = await response.json();
        setMensaje(`Error: ${error.message || 'Error al guardar'}`);
        setTimeout(() => setMensaje(''), 5000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar la asistencia');
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  // Preparar datos para edición
  const handleEditar = (asistencia) => {
    setAsistenciaEditando(asistencia);
    setMostrarFormulario(true);
  };

  // Función para eliminar asistencia
  const handleEliminar = async (id) => {
    const confirmed = await showConfirm(
      'Eliminar Registro de Asistencia',
      '¿Estás seguro de que deseas eliminar este registro de asistencia? Esta acción no se puede deshacer.',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/asistencias/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess('Éxito', 'Asistencia eliminada exitosamente');
        cargarDatos();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.message || 'Error al eliminar la asistencia');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de Conexión', 'No se pudo conectar con el servidor');
    }
  };

  // Manejar cambios en los filtros
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltros({
      estudiante: '',
      profesor: '',
      fecha: '',
      presente: '',
      horario: ''
    });
  };

  // Filtrar asistencias según criterios de búsqueda
  const asistenciasFiltradas = asistencias.filter(asistencia => {
    return (
      (!filtros.estudiante || 
        `${asistencia.estudiante_nombres} ${asistencia.estudiante_apellidos}`.toLowerCase().includes(filtros.estudiante.toLowerCase())) &&
      (!filtros.profesor || 
        `${asistencia.profesor_nombres} ${asistencia.profesor_apellidos}`.toLowerCase().includes(filtros.profesor.toLowerCase())) &&
      (!filtros.fecha || asistencia.fecha?.startsWith(filtros.fecha)) &&
      (!filtros.presente || asistencia.presente.toString() === filtros.presente) &&
      (!filtros.horario || asistencia.horario_id?.toString() === filtros.horario)
    );
  });

  // Función para formatear fechas de manera segura
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-CL');
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Obtener nombre completo del estudiante por RUT
  const obtenerNombreEstudiante = (rut) => {
    if (!rut || !Array.isArray(estudiantes)) return 'N/A';
    
    const estudiante = estudiantes.find(e => e && e.rut === rut);
    if (estudiante) {
      const nombres = estudiante.nombres || estudiante.nombre || '';
      const apellidos = estudiante.apellidos || estudiante.apellido || '';
      return `${nombres} ${apellidos}`.trim() || 'Sin nombre';
    }
    return 'N/A';
  };

  // Obtener nombre completo del profesor por RUT
  const obtenerNombreProfesor = (rut) => {
    if (!rut || !Array.isArray(profesores)) return 'N/A';
    
    const profesor = profesores.find(p => p && p.rut === rut);
    if (profesor) {
      const nombres = profesor.nombres || profesor.nombre || '';
      const apellidos = profesor.apellidos || profesor.apellido || '';
      return `${nombres} ${apellidos}`.trim() || 'Sin nombre';
    }
    return 'N/A';
  };

  // Mostrar indicador de carga
  if (loading) return <div className="loading">Cargando asistencias...</div>;

  return (
    <div className="admin-section">
      {/* Encabezado con título y estadísticas */}
      <div className="admin-header">
        <h2>Gestión de Asistencias</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {asistencias.length} registros
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setAsistenciaEditando(null);
              setMostrarFormulario(true);
            }}
          >
            + REGISTRAR ASISTENCIA
          </button>
        </div>
      </div>

      {/* Mostrar mensajes de éxito o error */}
      {mensaje && (
        <div className={`alert ${mensaje.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {mensaje}
        </div>
      )}

      {/* Panel de filtros de búsqueda */}
      <div className="filtros-busqueda" style={{
        background: 'rgba(248, 249, 252, 0.8)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(92, 107, 192, 0.1)'
      }}>
        <h6 style={{marginBottom: '1rem', color: 'var(--azul-marino)'}}>Buscar Asistencias</h6>
        <div className="row g-3">
          {/* Filtro por estudiante */}
          <div className="col-md-3">
            <label className="form-label">Estudiante</label>
            <select 
              className="form-select"
              value={filtros.estudiante}
              onChange={(e) => setFiltros({...filtros, estudiante: e.target.value})}
            >
              <option value="">Todos los estudiantes</option>
              {Array.isArray(estudiantes) && estudiantes.map(estudiante => (
                <option key={estudiante.rut} value={estudiante.rut}>
                  {obtenerNombreEstudiante(estudiante.rut)}
                </option>
              ))}
            </select>
          </div>
          {/* Filtro por profesor */}
          <div className="col-md-3">
            <label className="form-label">Profesor</label>
            <select 
              className="form-select"
              value={filtros.profesor}
              onChange={(e) => setFiltros({...filtros, profesor: e.target.value})}
            >
              <option value="">Todos los profesores</option>
              {Array.isArray(profesores) && profesores.map(profesor => (
                <option key={profesor.rut} value={profesor.rut}>
                  {obtenerNombreProfesor(profesor.rut)}
                </option>
              ))}
            </select>
          </div>
          {/* Filtro por fecha */}
          <div className="col-md-3">
            <label className="form-label">Fecha</label>
            <input 
              type="date"
              className="form-control"
              value={filtros.fecha}
              onChange={(e) => setFiltros({...filtros, fecha: e.target.value})}
            />
          </div>
          {/* Filtro por estado de asistencia */}
          <div className="col-md-2">
            <label className="form-label">Asistencia</label>
            <select
              name="presente"
              className="form-select"
              value={filtros.presente}
              onChange={handleChange}
            >
              <option value="">Todos</option>
              <option value="true">Presente</option>
              <option value="false">Ausente</option>
            </select>
          </div>
        </div>
        {/* Botón para limpiar filtros */}
        <div className="text-end">
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
          setAsistenciaEditando(null);
        }}
      >
        <FormularioAsistencia
          asistencia={asistenciaEditando}
          estudiantes={estudiantes}
          profesores={profesores}
          horarios={horarios}
          onGuardar={handleGuardar}
          onCancelar={() => {
            setMostrarFormulario(false);
            setAsistenciaEditando(null);
          }}
        />
      </ModalPortal>

      {/* Tabla de asistencias */}
      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estudiante</th>
              <th>Profesor</th>
              <th>Estado</th>
              <th>Observaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asistenciasFiltradas.map((asistencia, index) => (
              <tr key={asistencia.id || index}>
                <td>{formatearFecha(asistencia.fecha_clase)}</td>
                <td>{asistencia.hora_clase || 'N/A'}</td>
                <td>{obtenerNombreEstudiante(asistencia.estudiante_rut)}</td>
                <td>{obtenerNombreProfesor(asistencia.profesor_rut)}</td>
                <td>
                  <span className={`estado ${asistencia.presente ? 'activo' : 'inactivo'}`}>
                    {asistencia.presente ? 'Presente' : 'Ausente'}
                  </span>
                </td>
                <td>{asistencia.observaciones || '-'}</td>
                <td className="acciones">
                  {/* Botón editar */}
                  <button
                    onClick={() => handleEditar(asistencia)}
                    className="btn btn-sm btn-secondary"
                  >
                    <i className="fas fa-edit"></i> Editar
                  </button>
                  {/* Botón eliminar */}
                  <button
                    onClick={() => handleEliminar(asistencia.id)}
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
        {asistenciasFiltradas.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">No se encontraron registros de asistencia</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente formulario para registrar/editar asistencia
const FormularioAsistencia = ({ asistencia, estudiantes, profesores, horarios, onGuardar, onCancelar }) => {
  // Estado del formulario con valores por defecto
  const [formData, setFormData] = useState({
    estudiante_rut: '',
    profesor_rut: '',
    fecha_clase: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    hora_clase: '',
    presente: true,
    observaciones: ''
  });

  // Cargar datos cuando se edita una asistencia existente
  useEffect(() => {
    if (asistencia) {
      setFormData({
        estudiante_rut: asistencia.estudiante_rut || '',
        profesor_rut: asistencia.profesor_rut || '',
        fecha_clase: asistencia.fecha_clase ? asistencia.fecha_clase.split('T')[0] : '',
        hora_clase: asistencia.hora_clase || '',
        presente: asistencia.presente || asistencia.asistio || false,
        observaciones: asistencia.observaciones || ''
      });
    }
  }, [asistencia]);

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(formData);
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <>
      {/* Encabezado del modal */}
      <div className="modal-header">
        <h5 className="modal-title">{asistencia ? 'Editar Asistencia' : 'Registrar Asistencia'}</h5>
        <button type="button" className="btn-close" onClick={onCancelar}></button>
      </div>
      <div className="modal-body">
        <form id="formulario-asistencia" onSubmit={handleSubmit}>
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
                {Array.isArray(estudiantes) && estudiantes.map(estudiante => (
                  <option key={estudiante.rut} value={estudiante.rut}>
                    {(estudiante.nombres || estudiante.nombre || '')} {(estudiante.apellidos || estudiante.apellido || '')} - {estudiante.rut}
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
                {Array.isArray(profesores) && profesores.map(profesor => (
                  <option key={profesor.rut} value={profesor.rut}>
                    {(profesor.nombres || profesor.nombre || '')} {(profesor.apellidos || profesor.apellido || '')} - {profesor.rut}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo de fecha */}
            <div className="col-md-6">
              <label className="form-label">Fecha *</label>
              <input 
                type="date"
                name="fecha_clase"
                className="form-control"
                value={formData.fecha_clase}
                onChange={handleChange}
                required
              />
            </div>

            {/* Campo de hora */}
            <div className="col-md-6">
              <label className="form-label">Hora *</label>
              <input 
                type="time"
                name="hora_clase"
                className="form-control"
                value={formData.hora_clase}
                onChange={handleChange}
                required
              />
            </div>

            {/* Checkbox para marcar presencia */}
            <div className="col-12">
              <div className="form-check">
                <input 
                  type="checkbox"
                  name="presente"
                  className="form-check-input"
                  id="presente"
                  checked={formData.presente}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="presente">
                  Presente
                </label>
              </div>
            </div>

            {/* Campo de observaciones */}
            <div className="col-12">
              <label className="form-label">Observaciones</label>
              <textarea 
                name="observaciones"
                className="form-control"
                rows="3"
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
        </form>
      </div>
      {/* Botones de acción del modal */}
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" form="formulario-asistencia" className="btn btn-primary">
          {asistencia ? 'Actualizar' : 'Registrar'}
        </button>
      </div>
    </>
  );
};

export default Asistencia;