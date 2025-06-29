import React, { useState, useEffect } from 'react';
import ModalPortal from '../../../components/ModalPortal';
import { useAlert } from '../../../components/providers/AlertProvider';
import './AdminPanel.css';

const Profesores = () => {
  // Hooks de alerta para usar shadcn/ui
  const { showConfirm, showSuccess, showError, showWarning } = useAlert();
  
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [profesorEditando, setProfesorEditando] = useState(null);

  // Estados para búsqueda
  const [filtros, setFiltros] = useState({
    rut: '',
    nombre: '',
    especialidad: '',
    estado: ''
  });

  useEffect(() => {
    fetchProfesores();
  }, []);

  const fetchProfesores = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/profesores', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProfesores(data);
      } else {
        setMensaje('Error al cargar profesores');
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async (profesorData) => {
    try {
      const token = localStorage.getItem('token');
      const url = profesorEditando 
        ? `http://localhost:5000/api/admin/profesores/${profesorEditando.rut}`
        : 'http://localhost:5000/api/admin/profesores';
      
      const method = profesorEditando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profesorData)
      });

      if (response.ok) {
        setMensaje(profesorEditando ? 'Profesor actualizado correctamente' : 'Profesor creado correctamente');
        fetchProfesores();
        handleCancelar();
        setTimeout(() => setMensaje(''), 3000);
      } else {
        const errorData = await response.json();
        setMensaje(`Error: ${errorData.message || 'Error desconocido'}`);
        setTimeout(() => setMensaje(''), 5000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar profesor');
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  const handleEditar = (profesor) => {
    setProfesorEditando(profesor);
    setMostrarFormulario(true);
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setProfesorEditando(null);
  };

  const eliminarProfesor = async (rut) => {
    const confirmed = await showConfirm(
      'Eliminar Profesor',
      '¿Está seguro de eliminar este profesor? Esta acción no se puede deshacer.',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/profesores/${rut}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showSuccess('Éxito', 'Profesor eliminado correctamente');
        fetchProfesores();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.message || 'Error al eliminar profesor');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de Conexión', 'No se pudo conectar con el servidor');
    }
  };

  const cambiarEstado = async (rut, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/profesores/${rut}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        setMensaje('Estado actualizado correctamente');
        fetchProfesores();
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

  // Filtrar profesores
  const profesoresFiltrados = profesores.filter(profesor => {
    return (
      (!filtros.rut || profesor.rut.toLowerCase().includes(filtros.rut.toLowerCase())) &&
      (!filtros.nombre || 
        `${profesor.nombres} ${profesor.apellidos}`.toLowerCase().includes(filtros.nombre.toLowerCase())) &&
      (!filtros.especialidad || profesor.especialidad.toLowerCase().includes(filtros.especialidad.toLowerCase())) &&
      (!filtros.estado || profesor.estado === filtros.estado)
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
      rut: '',
      nombre: '',
      especialidad: '',
      estado: ''
    });
  };

  if (loading) return <div className="loading">Cargando profesores...</div>;

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h2>Gestión de Profesores</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {profesoresFiltrados.length} de {profesores.length} | 
            Activos: {profesoresFiltrados.filter(p => p.estado === 'activo').length}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setMostrarFormulario(true)}
          >
            + CREAR PROFESOR
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
        <h6 style={{marginBottom: '1rem', color: 'var(--azul-marino)'}}>Buscar Profesores</h6>
        <div className="row g-3">
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
          <div className="col-md-3">
            <label className="form-label">Especialidad</label>
            <input
              type="text"
              name="especialidad"
              className="form-control"
              placeholder="Violín, Piano, etc."
              value={filtros.especialidad}
              onChange={handleChange}
            />
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
              <option value="licencia">Licencia</option>
            </select>
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

      {/* Modal para formulario */}
      <ModalPortal 
        isOpen={mostrarFormulario} 
        onClose={handleCancelar}
      >
        <FormularioProfesor
          profesor={profesorEditando}
          onGuardar={handleGuardar}
          onCancelar={handleCancelar}
        />
      </ModalPortal>

      {/* Tabla de profesores */}
      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>RUT</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Email</th>
              <th>Especialidad</th>
              <th>Experiencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profesoresFiltrados.map(profesor => (
              <tr key={profesor.rut}>
                <td>{profesor.rut}</td>
                <td>{profesor.nombres}</td>
                <td>{profesor.apellidos}</td>
                <td>{profesor.email || 'Sin email'}</td>
                <td>{profesor.especialidad}</td>
                <td>{profesor.anos_experiencia} años</td>
                <td>
                  <span className={`estado ${profesor.estado}`}>
                    {profesor.estado}
                  </span>
                </td>
                <td className="acciones">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEditar(profesor)}
                  >
                    <i className="fas fa-edit"></i> Editar
                  </button>
                  <select 
                    value={profesor.estado}
                    onChange={(e) => cambiarEstado(profesor.rut, e.target.value)}
                    className="select-estado"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="licencia">Licencia</option>
                  </select>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => eliminarProfesor(profesor.rut)}
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

const FormularioProfesor = ({ profesor, onGuardar, onCancelar }) => {
  const { showError } = useAlert();
  
  const [formData, setFormData] = useState({
    rut: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    especialidad: '',
    anos_experiencia: '',
    estado: 'activo',
    crear_cuenta: false,
    username: '',
    password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (profesor) {
      setFormData({
        rut: profesor.rut || '',
        nombres: profesor.nombres || '',
        apellidos: profesor.apellidos || '',
        email: profesor.email || '',
        telefono: profesor.telefono || '',
        especialidad: profesor.especialidad || '',
        anos_experiencia: profesor.anos_experiencia || '',
        estado: profesor.estado || 'activo',
        crear_cuenta: false,
        username: '',
        password: '',
        confirm_password: ''
      });
    }
  }, [profesor]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-generar email y username para nuevos profesores
    if (!profesor && name === 'apellidos' && formData.nombres) {
      const emailSugerido = generarEmailPredictivo(formData.nombres, value);
      setFormData(prev => ({
        ...prev,
        email: prev.email || emailSugerido,
        username: prev.username || emailSugerido
      }));
    }
    if (!profesor && name === 'nombres' && formData.apellidos) {
      const emailSugerido = generarEmailPredictivo(value, formData.apellidos);
      setFormData(prev => ({
        ...prev,
        email: prev.email || emailSugerido,
        username: prev.username || emailSugerido
      }));
    }
  };

  const generarEmailPredictivo = (nombres, apellidos) => {
    if (!nombres || !apellidos) return '';
    const nombreLimpio = nombres.toLowerCase().replace(/[^a-z\s]/g, '').split(' ')[0];
    const apellidoLimpio = apellidos.toLowerCase().replace(/[^a-z\s]/g, '').split(' ')[0];
    return `${nombreLimpio}.${apellidoLimpio}@orquestacobquecura.cl`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar contraseñas si se va a crear cuenta
    if (formData.crear_cuenta && !profesor) {
      if (!formData.password || formData.password.length < 6) {
        showError('Error de Validación', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        showError('Error de Validación', 'Las contraseñas no coinciden');
        return;
      }
    }

    onGuardar(formData);
  };

  return (
    <>
      <div className="modal-header">
        <h5 className="modal-title">{profesor ? 'Editar Profesor' : 'Nuevo Profesor'}</h5>
        <button type="button" className="btn-close" onClick={onCancelar}></button>
      </div>
      <div className="modal-body">
        <form id="formulario-profesor" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">RUT *</label>
              <input
                type="text"
                name="rut"
                className="form-control"
                value={formData.rut}
                onChange={handleChange}
                required
                disabled={!!profesor}
                placeholder="12.345.678-9"
              />
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
                <option value="licencia">Licencia</option>
              </select>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombres *</label>
              <input
                type="text"
                name="nombres"
                className="form-control"
                value={formData.nombres}
                onChange={handleChange}
                required
                placeholder="Ej: Carlos Eduardo"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Apellidos *</label>
              <input
                type="text"
                name="apellidos"
                className="form-control"
                value={formData.apellidos}
                onChange={handleChange}
                required
                placeholder="Ej: Mendoza Silva"
              />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                placeholder="profesor@email.com"
              />
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

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Especialidad *</label>
              <input
                type="text"
                name="especialidad"
                className="form-control"
                value={formData.especialidad}
                onChange={handleChange}
                required
                placeholder="Ej: Violín, Piano, Teoría Musical"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Años de Experiencia</label>
              <input
                type="number"
                name="anos_experiencia"
                className="form-control"
                value={formData.anos_experiencia}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          {!profesor && (
            <div className="col-12 mt-4" style={{borderTop: '1px solid #dee2e6', paddingTop: '20px'}}>
              <h6 className="text-primary mb-3">Cuenta de Usuario</h6>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="crear_cuenta"
                  id="crear_cuenta_profesor"
                  checked={formData.crear_cuenta}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="crear_cuenta_profesor">
                  Crear cuenta de acceso al sistema
                </label>
              </div>

              {formData.crear_cuenta && (
                <>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        name="username"
                        className="form-control"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="usuario@orquestacobquecura.cl"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contraseña</label>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  </div>
                  <div className="row g-3 mt-2">
                    <div className="col-md-6">
                      <label className="form-label">Confirmar Contraseña</label>
                      <input
                        type="password"
                        name="confirm_password"
                        className="form-control"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="Repetir contraseña"
                      />
                    </div>
                  </div>
                  <small className="text-muted">
                    La cuenta permitirá al profesor acceder al sistema con estos datos de inicio de sesión.
                  </small>
                </>
              )}
            </div>
          )}
        </form>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" form="formulario-profesor" className="btn btn-primary">
          {profesor ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </>
  );
};

export default Profesores;

<style jsx>{`
  .admin-section {
    padding: 20px;
  }
  
  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .stats {
    font-size: 14px;
    color: #666;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover {
    background: #0056b3;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
    margin-right: 5px;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
    margin-left: 5px;
  }

  .btn-sm {
    padding: 4px 8px;
    font-size: 12px;
  }
  
  .tabla-container {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .tabla-datos {
    width: 100%;
    border-collapse: collapse;
  }
  
  .tabla-datos th,
  .tabla-datos td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  .tabla-datos th {
    background: #f8f9fa;
    font-weight: 600;
  }

  .acciones {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .estado {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .estado.activo { background: #d4edda; color: #155724; }
  .estado.inactivo { background: #f8d7da; color: #721c24; }
  .estado.licencia { background: #fff3cd; color: #856404; }
  .estado.vacaciones { background: #d1ecf1; color: #0c5460; }
  
  .select-estado {
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid #eee;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 15px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    margin-bottom: 5px;
    font-weight: 600;
    color: #333;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #007bff;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .user-form-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }

  .user-form-section h4 {
    margin-bottom: 15px;
    color: #007bff;
  }

  .text-suggestion {
    color: #28a745;
    font-size: 12px;
    margin-top: 4px;
    font-style: italic;
  }

  .form-help {
    color: #6c757d;
    font-size: 12px;
    margin-top: 4px;
  }
  
  .alert {
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 20px;
  }
  
  .alert-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .loading {
    padding: 40px;
    text-align: center;
    color: #666;
  }

  .filtros-busqueda {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    border: 1px solid #ddd;
  }

  .filtros-busqueda h6 {
    margin-bottom: 15px;
    font-weight: 600;
    color: #333;
  }

  .filtros-busqueda .form-label {
    font-weight: 500;
    color: #555;
  }

  .filtros-busqueda .form-control,
  .filtros-busqueda .form-select {
    padding: 10px;
    font-size: 14px;
  }

  .filtros-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }

  .filtros-actions .btn {
    padding: 8px 12px;
    font-size: 14px;
  }
`}</style>