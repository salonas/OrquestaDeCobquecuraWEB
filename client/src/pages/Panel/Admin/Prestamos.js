import React, { useState, useEffect } from 'react';
import ModalPortal from '../../../components/ModalPortal';
import { useAlert } from '../../../components/providers/AlertProvider';
import './AdminPanel.css';

const Prestamos = () => {
  // Hooks de alerta para usar shadcn/ui
  const { showConfirm, showSuccess, showError } = useAlert();
  
  // Estados principales
  const [prestamos, setPrestamos] = useState([]);
  const [instrumentos, setInstrumentos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [prestamoEditando, setPrestamoEditando] = useState(null);

  // Estados para filtros de búsqueda
  const [filtros, setFiltros] = useState({
    id: '',
    estudiante: '',
    profesor: '',
    instrumento: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cargar todos los datos necesarios
  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      const [prestamosRes, instrumentosRes, estudiantesRes, profesoresRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/prestamos', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/instrumentos', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/estudiantes', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/profesores', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const prestamosData = await prestamosRes.json();
      const instrumentosData = await instrumentosRes.json();
      const estudiantesData = await estudiantesRes.json();
      const profesoresData = await profesoresRes.json();

      setPrestamos(Array.isArray(prestamosData) ? prestamosData : []);
      setInstrumentos(Array.isArray(instrumentosData) ? instrumentosData : []);
      setEstudiantes(Array.isArray(estudiantesData) ? estudiantesData : []);
      setProfesores(Array.isArray(profesoresData) ? profesoresData : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setMensaje('Error al cargar datos');
      setPrestamos([]);
      setInstrumentos([]);
      setEstudiantes([]);
      setProfesores([]);
    } finally {
      setLoading(false);
    }
  };

  // Guardar préstamo (crear o editar)
  const handleGuardar = async (prestamoData) => {
    try {
      const token = localStorage.getItem('token');
      const url = prestamoEditando
        ? `http://localhost:5000/api/admin/prestamos/${prestamoEditando.id}`
        : 'http://localhost:5000/api/admin/prestamos';

      const method = prestamoEditando ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prestamoData)
      });

      if (response.ok) {
        showSuccess(prestamoEditando ? 'Préstamo actualizado correctamente' : 'Préstamo creado correctamente');
        cargarDatos();
        handleCancelar();
      } else {
        showError('Error al guardar préstamo');
      }
    } catch (error) {
      showError('Error al guardar préstamo');
    }
  };

  // Eliminar préstamo
  const handleEliminar = async (id) => {
    const confirmed = await showConfirm(
      'Eliminar Préstamo',
      '¿Está seguro de eliminar este préstamo? Esta acción no se puede deshacer.',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/prestamos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showSuccess('Éxito', 'Préstamo eliminado correctamente');
        cargarDatos();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.message || 'Error al eliminar préstamo');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de Conexión', 'No se pudo conectar con el servidor');
    }
  };

  // Cambiar estado del préstamo
  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/prestamos/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        showSuccess('Estado actualizado correctamente');
        cargarDatos();
      } else {
        showError('Error al actualizar estado');
      }
    } catch (error) {
      showError('Error al actualizar estado');
    }
  };

  const handleEditar = (prestamo) => {
    setPrestamoEditando(prestamo);
    setMostrarFormulario(true);
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setPrestamoEditando(null);
  };

  // Filtrar préstamos según criterios de búsqueda
  const prestamosFiltrados = prestamos.filter(prestamo => {
    const fechaPrestamo = new Date(prestamo.fecha_prestamo);
    const fechaDesde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
    const fechaHasta = filtros.fechaHasta ? new Date(filtros.fechaHasta) : null;

    return (
      (!filtros.id || prestamo.id.toString().includes(filtros.id)) &&
      (!filtros.estudiante ||
        `${prestamo.estudiante_nombres} ${prestamo.estudiante_apellidos}`.toLowerCase().includes(filtros.estudiante.toLowerCase())) &&
      (!filtros.profesor ||
        `${prestamo.profesor_nombres} ${prestamo.profesor_apellidos}`.toLowerCase().includes(filtros.profesor.toLowerCase())) &&
      (!filtros.instrumento ||
        prestamo.instrumento_nombre.toLowerCase().includes(filtros.instrumento.toLowerCase())) &&
      (!filtros.estado || prestamo.estado === filtros.estado) &&
      (!fechaDesde || fechaPrestamo >= fechaDesde) &&
      (!fechaHasta || fechaPrestamo <= fechaHasta)
    );
  });

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
      id: '',
      estudiante: '',
      profesor: '',
      instrumento: '',
      estado: '',
      fechaDesde: '',
      fechaHasta: ''
    });
  };

  // Marcar préstamo como devuelto
  const handleDevolver = async (prestamoId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/prestamos/${prestamoId}/devolver`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fecha_devolucion: new Date().toISOString().split('T')[0],
          estado: 'devuelto'
        })
      });

      if (response.ok) {
        showSuccess('Préstamo devuelto correctamente');
        cargarDatos();
      } else {
        const errorData = await response.json();
        showError(`Error: ${errorData.message || 'Error al devolver préstamo'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de conexión al devolver préstamo');
    }
  };

  if (loading) return <div className="loading">Cargando préstamos...</div>;

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h2>Gestión de Préstamos</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {prestamosFiltrados.length} de {prestamos.length} |
            Activos: {prestamosFiltrados.filter(p => p.estado === 'activo').length} |
            Devueltos: {prestamosFiltrados.filter(p => p.estado === 'devuelto').length}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setMostrarFormulario(true)}
          >
            + CREAR PRÉSTAMO
          </button>
        </div>
      </div>

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
        <h6 style={{ marginBottom: '1rem', color: 'var(--azul-marino)' }}>Buscar Préstamos</h6>
        <div className="row g-3">
          <div className="col-md-1">
            <label className="form-label">ID</label>
            <input
              type="number"
              name="id"
              className="form-control"
              placeholder="ID"
              value={filtros.id}
              onChange={handleChange}
            />
          </div>
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
          <div className="col-md-2">
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
          <div className="col-md-2">
            <label className="form-label">Instrumento</label>
            <input
              type="text"
              name="instrumento"
              className="form-control"
              placeholder="Instrumento"
              value={filtros.instrumento}
              onChange={handleChange}
            />
          </div>
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
              <option value="devuelto">Devuelto</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
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
        </div>
        <div className="row g-3 mt-2">
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
          <div className="col-md-10 d-flex align-items-end">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={limpiarFiltros}
            >
              <i className="fas fa-times"></i> Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar préstamo */}
      <ModalPortal
        isOpen={mostrarFormulario}
        onClose={() => {
          setMostrarFormulario(false);
          setPrestamoEditando(null);
        }}
      >
        <FormularioPrestamo
          prestamo={prestamoEditando}
          instrumentos={instrumentos}
          estudiantes={estudiantes}
          profesores={profesores}
          onGuardar={handleGuardar}
          onCancelar={() => {
            setMostrarFormulario(false);
            setPrestamoEditando(null);
          }}
        />
      </ModalPortal>

      {/* Tabla de préstamos */}
      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>ID</th>
              <th>Instrumento</th>
              <th>Estudiante</th>
              <th>Profesor</th>
              <th>Fecha Préstamo</th>
              <th>Fecha Devolución</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prestamosFiltrados.map(prestamo => (
              <tr key={prestamo.id}>
                <td>{prestamo.id}</td>
                <td>{prestamo.instrumento_nombre} ({prestamo.instrumento_tipo})</td>
                <td>{prestamo.estudiante_nombres} {prestamo.estudiante_apellidos}</td>
                <td>{prestamo.profesor_nombres} {prestamo.profesor_apellidos}</td>
                <td>{new Date(prestamo.fecha_prestamo).toLocaleDateString()}</td>
                <td>
                  {prestamo.fecha_devolucion_real
                    ? new Date(prestamo.fecha_devolucion_real).toLocaleDateString()
                    : 'Pendiente'
                  }
                </td>
                <td>
                  <span className={`estado ${prestamo.estado}`}>
                    {prestamo.estado}
                  </span>
                </td>
                <td className="acciones">
                  <button
                    onClick={() => handleEditar(prestamo)}
                    className="btn btn-sm btn-secondary"
                  >
                    <i className="fas fa-edit"></i> Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(prestamo.id)}
                    className="btn btn-sm btn-danger"
                  >
                    <i className="fas fa-trash"></i> Eliminar
                  </button>
                  <button
                    onClick={async () => {
                      const confirmed = await showConfirm(
                        'Confirmar Devolución',
                        '¿Confirmar devolución del instrumento?',
                        {
                          confirmText: 'Confirmar',
                          cancelText: 'Cancelar'
                        }
                      );
                      
                      if (confirmed) {
                        handleDevolver(prestamo.id);
                      }
                    }}
                    className="btn btn-sm btn-success"
                    disabled={prestamo.estado === 'devuelto'}
                  >
                    <i className="fas fa-undo"></i>
                    {prestamo.estado === 'devuelto' ? 'Devuelto' : 'Devolver'}
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

// Formulario para crear/editar préstamos
const FormularioPrestamo = ({ prestamo, instrumentos, estudiantes, profesores, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    instrumento_id: '',
    estudiante_rut: '',
    profesor_rut: '',
    fecha_prestamo: '',
    fecha_devolucion_programada: '',
    observaciones_prestamo: ''
  });

  // Inicializar formulario
  useEffect(() => {
    if (prestamo) {
      setFormData({
        instrumento_id: prestamo.instrumento_id || '',
        estudiante_rut: prestamo.estudiante_rut || '',
        profesor_rut: prestamo.profesor_rut || '',
        fecha_prestamo: prestamo.fecha_prestamo ? prestamo.fecha_prestamo.split('T')[0] : '',
        fecha_devolucion_programada: prestamo.fecha_devolucion_programada ? prestamo.fecha_devolucion_programada.split('T')[0] : '',
        observaciones_prestamo: prestamo.observaciones_prestamo || ''
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        fecha_prestamo: today
      }));
    }
  }, [prestamo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(formData);
  };

  // Filtrar instrumentos disponibles
  const instrumentosDisponibles = Array.isArray(instrumentos) ? instrumentos.filter(instrumento => {
    if (!instrumento || typeof instrumento.id === 'undefined') return false;

    // Si estamos editando, incluir el instrumento actual
    if (prestamo && instrumento.id === prestamo.instrumento_id) {
      return true;
    }

    // Para nuevos préstamos, solo mostrar disponibles
    return instrumento.disponible === true || instrumento.disponible === 1;
  }) : [];

  // Filtrar estudiantes activos
  const estudiantesElegibles = Array.isArray(estudiantes) ? estudiantes.filter(estudiante => {
    if (!estudiante || typeof estudiante.rut === 'undefined') return false;
    return estudiante.estado === 'activo';
  }) : [];

  // Filtrar profesores activos
  const profesoresActivos = Array.isArray(profesores) ? profesores.filter(profesor => {
    if (!profesor || typeof profesor.rut === 'undefined') return false;
    return profesor.estado === 'activo';
  }) : [];

  return (
    <>
      <div className="modal-header">
        <h5 className="modal-title">{prestamo ? 'Editar Préstamo' : 'Nuevo Préstamo'}</h5>
        <button type="button" className="btn-close" onClick={onCancelar}></button>
      </div>
      <div className="modal-body">
        <form id="formulario-prestamo" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Instrumento *</label>
              <select
                name="instrumento_id"
                className="form-select"
                value={formData.instrumento_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar instrumento</option>
                {instrumentosDisponibles.map(instrumento => (
                  <option key={instrumento.id} value={instrumento.id}>
                    {instrumento.nombre} - {instrumento.tipo} ({instrumento.marca || 'Sin marca'})
                    {(!instrumento.disponible || instrumento.disponible === 0) && prestamo && instrumento.id === prestamo.instrumento_id
                      ? ' - (En préstamo actual)'
                      : ''
                    }
                  </option>
                ))}
              </select>
              {instrumentosDisponibles.length === 0 && (
                <small className="text-warning">
                  <i className="fas fa-exclamation-triangle"></i> No hay instrumentos disponibles para préstamo
                </small>
              )}
            </div>

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
                {estudiantesElegibles.map(estudiante => (
                  <option key={estudiante.rut} value={estudiante.rut}>
                    {estudiante.nombres} {estudiante.apellidos} ({estudiante.rut})
                  </option>
                ))}
              </select>
              {estudiantesElegibles.length === 0 && (
                <small className="text-warning">
                  <i className="fas fa-exclamation-triangle"></i> No hay estudiantes activos disponibles
                </small>
              )}
              {Array.isArray(estudiantes) && estudiantes.length > 0 && estudiantesElegibles.length < estudiantes.length && (
                <small className="text-muted d-block mt-1">
                  <i className="fas fa-info-circle"></i> Solo se muestran estudiantes con estado "activo"
                </small>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label">Profesor Responsable *</label>
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
              {profesoresActivos.length === 0 && (
                <small className="text-warning">
                  <i className="fas fa-exclamation-triangle"></i> No hay profesores activos disponibles
                </small>
              )}
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Fecha de Préstamo *</label>
              <input
                type="date"
                name="fecha_prestamo"
                className="form-control"
                value={formData.fecha_prestamo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Fecha de Devolución Programada</label>
              <input
                type="date"
                name="fecha_devolucion_programada"
                className="form-control"
                value={formData.fecha_devolucion_programada}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">Observaciones</label>
            <textarea
              name="observaciones_prestamo"
              className="form-control"
              value={formData.observaciones_prestamo}
              onChange={handleChange}
              rows="3"
            />
          </div>

          {/* Información de ayuda */}
          <div className="col-12 mt-3">
            <div className="alert alert-info">
              <h6 className="mb-2"><i className="fas fa-info-circle"></i> Criterios de Elegibilidad:</h6>
              <ul className="mb-2">
                <li><strong>Instrumentos:</strong> Solo instrumentos marcados como "disponibles"</li>
                <li><strong>Estudiantes:</strong> Solo estudiantes con estado "activo"</li>
                <li><strong>Profesores:</strong> Solo profesores con estado "activo"</li>
              </ul>
              <div className="mt-2">
                <small className="text-muted">
                  📊 <strong>Disponibles:</strong> {instrumentosDisponibles.length} instrumentos, {estudiantesElegibles.length} estudiantes, {profesoresActivos.length} profesores
                </small>
              </div>
            </div>
          </div>
        </form>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
        <button
          type="submit"
          form="formulario-prestamo"
          className="btn btn-primary"
          disabled={instrumentosDisponibles.length === 0 || estudiantesElegibles.length === 0 || profesoresActivos.length === 0}
        >
          {prestamo ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </>
  );
};

export default Prestamos;