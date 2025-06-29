import React, { useEffect, useState } from 'react';
import ModalPortal from '../../../components/ModalPortal';
import { useAlert } from '../../../components/providers/AlertProvider';
import './AdminPanel.css';

const Instrumentos = () => {
  // Hooks de alerta para usar shadcn/ui
  const { showConfirm, showSuccess, showError } = useAlert();
  
  const [instrumentos, setInstrumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [instrumentoEditando, setInstrumentoEditando] = useState(null);

  // Estados para búsqueda y filtrado
  const [filtros, setFiltros] = useState({
    nombre: '',
    tipo: '',
    marca: '',
    estadoFisico: '',
    disponible: ''
  });

  useEffect(() => {
    fetchInstrumentos();
  }, []);

  const fetchInstrumentos = async () => {
    try {
      setLoading(true);
      setMensaje('');
    
      const token = localStorage.getItem('token');
      if (!token) {
        setMensaje('No hay token de autenticación');
        setInstrumentos([]);
        return;
      }

      console.log('🔄 Iniciando fetch de instrumentos...');
    
      const response = await fetch('http://localhost:5000/api/admin/instrumentos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Respuesta no JSON:', text.substring(0, 200));
        throw new Error('El servidor devolvió HTML en lugar de JSON. Verificar autenticación.');
      }

      const data = await response.json();
      console.log('📦 Datos recibidos:', data);

      if (data.success !== undefined) {
        if (data.success) {
          const instrumentosArray = Array.isArray(data.instrumentos) ? data.instrumentos : [];
          console.log(`✅ Cargando ${instrumentosArray.length} instrumentos`);
          setInstrumentos(instrumentosArray);
          setMensaje('');
        } else {
          console.error('❌ Error en respuesta:', data.error);
          setMensaje(`Error: ${data.error || 'Error desconocido'}`);
          setInstrumentos([]);
        }
      } else {
        const instrumentosArray = Array.isArray(data) ? data : [];
        console.log(`✅ Cargando ${instrumentosArray.length} instrumentos (formato legacy)`);
        setInstrumentos(instrumentosArray);
        setMensaje('');
      }

    } catch (error) {
      console.error('💥 Error al cargar instrumentos:', error);
      setMensaje(`Error al cargar instrumentos: ${error.message}`);
      setInstrumentos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async (instrumentoData) => {
    try {
      setMensaje('');
      console.log('💾 Guardando instrumento:', instrumentoData);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setMensaje('Error: No hay token de autenticación');
        return;
      }

      if (!instrumentoData.nombre || !instrumentoData.tipo) {
        setMensaje('Error: Nombre y tipo son campos obligatorios');
        return;
      }

      const datosLimpios = {
        nombre: instrumentoData.nombre.trim(),
        tipo: instrumentoData.tipo,
        marca: instrumentoData.marca?.trim() || '',
        modelo: instrumentoData.modelo?.trim() || '',
        numero_serie: instrumentoData.numero_serie?.trim() || '',
        estado_fisico: instrumentoData.estado_fisico || 'bueno',
        disponible: Boolean(instrumentoData.disponible),
        ubicacion: instrumentoData.ubicacion?.trim() || '',
        valor_estimado: instrumentoData.valor_estimado ? parseFloat(instrumentoData.valor_estimado) : '',
        fecha_adquisicion: instrumentoData.fecha_adquisicion || '',
        observaciones: instrumentoData.observaciones?.trim() || ''
      };

      console.log('📤 Datos a enviar:', datosLimpios);

      const url = instrumentoEditando 
        ? `http://localhost:5000/api/admin/instrumentos/${instrumentoEditando.id}`
        : 'http://localhost:5000/api/admin/instrumentos';
      
      const method = instrumentoEditando ? 'PUT' : 'POST';
      
      console.log(`📡 ${method} ${url}`);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosLimpios)
      });

      console.log('📡 Response status:', response.status);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Respuesta no es JSON:', textResponse.substring(0, 200));
        throw new Error('El servidor devolvió una respuesta no válida');
      }

      const data = await response.json();
      console.log('📦 Respuesta del servidor:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || `Error ${response.status}`);
      }

      if (data.success) {
        setMensaje(data.message || 'Instrumento guardado exitosamente');
        setMostrarFormulario(false);
        setInstrumentoEditando(null);
        await fetchInstrumentos();
        setTimeout(() => setMensaje(''), 3000);
      } else {
        throw new Error(data.error || 'Error desconocido al guardar');
      }

    } catch (error) {
      console.error('💥 Error al guardar instrumento:', error);
      
      let mensajeError = 'Error al guardar el instrumento';
      
      if (error.message.includes('fetch')) {
        mensajeError = 'Error de conexión con el servidor';
      } else if (error.message.includes('JSON')) {
        mensajeError = 'Error en la respuesta del servidor';
      } else if (error.message) {
        mensajeError = `Error: ${error.message}`;
      }
      
      setMensaje(mensajeError);
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  const handleEliminar = async (id) => {
    const confirmed = await showConfirm(
      'Eliminar Instrumento',
      '¿Estás seguro de que quieres eliminar este instrumento? Esta acción no se puede deshacer.',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/admin/instrumentos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      setMensaje('Instrumento eliminado correctamente');
      fetchInstrumentos();
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al eliminar el instrumento');
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  const toggleDisponibilidad = async (id, disponible) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/admin/instrumentos/${id}/disponibilidad`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ disponible: !disponible })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      setMensaje('Disponibilidad actualizada correctamente');
      fetchInstrumentos();
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al actualizar disponibilidad');
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  const handleEditar = (instrumento) => {
    setInstrumentoEditando(instrumento);
    setMostrarFormulario(true);
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setInstrumentoEditando(null);
  };

  // Función para filtrar instrumentos
  const instrumentosFiltrados = instrumentos.filter(instrumento => {
    return (
      (!filtros.nombre || instrumento.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) &&
      (!filtros.tipo || instrumento.tipo.toLowerCase().includes(filtros.tipo.toLowerCase())) &&
      (!filtros.marca || instrumento.marca?.toLowerCase().includes(filtros.marca.toLowerCase())) &&
      (!filtros.estadoFisico || instrumento.estado_fisico?.toLowerCase() === filtros.estadoFisico.toLowerCase()) &&
      (!filtros.disponible || instrumento.disponible.toString() === filtros.disponible)
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
      nombre: '',
      tipo: '',
      marca: '',
      estadoFisico: '',
      disponible: ''
    });
  };

  if (loading) return <div className="loading">Cargando instrumentos...</div>;

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h2>Gestión de Instrumentos</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {instrumentosFiltrados.length} de {instrumentos.length} | 
            Disponibles: {instrumentosFiltrados.filter(i => i.disponible).length} |
            En préstamo: {instrumentosFiltrados.filter(i => !i.disponible).length}
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setMostrarFormulario(true)}
          >
            + CREAR INSTRUMENTO
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
        <h6 style={{marginBottom: '1rem', color: 'var(--azul-marino)'}}>Buscar Instrumentos</h6>
        <div className="row g-3">
          <div className="col-md-2">
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
            <label className="form-label">Nombre</label>
            <input
              type="text"
              name="nombre"
              className="form-control"
              placeholder="Nombre del instrumento"
              value={filtros.nombre}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Tipo</label>
            <input
              type="text"
              name="tipo"
              className="form-control"
              placeholder="Violín, Piano..."
              value={filtros.tipo}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Marca</label>
            <input
              type="text"
              name="marca"
              className="form-control"
              placeholder="Marca"
              value={filtros.marca}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Estado Físico</label>
            <select
              name="estadoFisico"
              className="form-select"
              value={filtros.estadoFisico}
              onChange={handleChange}
            >
              <option value="">Todos</option>
              <option value="excelente">Excelente</option>
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
              <option value="malo">Malo</option>
              <option value="reparacion">En Reparación</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Disponibilidad</label>
            <select
              name="disponible"
              className="form-select"
              value={filtros.disponible}
              onChange={handleChange}
            >
              <option value="">Todos</option>
              <option value="true">Disponible</option>
              <option value="false">No Disponible</option>
            </select>
          </div>
        </div>
        <div className="filtros-actions">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={limpiarFiltros}
          >
            <i className="fas fa-times"></i> Limpiar
          </button>
        </div>
      </div>

      {/* Modal para crear/editar instrumento */}
      <ModalPortal 
        isOpen={mostrarFormulario} 
        onClose={handleCancelar}
      >
        <FormularioInstrumento
          instrumento={instrumentoEditando}
          onGuardar={handleGuardar}
          onCancelar={handleCancelar}
        />
      </ModalPortal>

      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Serie</th>
              <th>Estado Físico</th>
              <th>Disponible</th>
              <th>Ubicación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {instrumentosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>
                  {filtros.id || filtros.nombre || filtros.tipo || filtros.marca || filtros.estado_fisico || filtros.disponible
                    ? 'No se encontraron instrumentos con los filtros aplicados'
                    : 'No hay instrumentos registrados'
                  }
                </td>
              </tr>
            ) : (
              instrumentosFiltrados.map(instrumento => (
                <tr key={instrumento.id}>
                  <td>{instrumento.id}</td>
                  <td>{instrumento.nombre}</td>
                  <td>{instrumento.tipo}</td>
                  <td>{instrumento.marca || 'N/A'}</td>
                  <td>{instrumento.modelo || 'N/A'}</td>
                  <td>{instrumento.numero_serie || 'N/A'}</td>
                  <td>
                    <span className={`estado ${instrumento.estado_fisico?.toLowerCase()}`}>
                      {instrumento.estado_fisico}
                    </span>
                  </td>
                  <td>
                    <span className={`estado ${instrumento.disponible ? 'activo' : 'inactivo'}`}>
                      {instrumento.disponible ? 'Disponible' : 'No Disponible'}
                    </span>
                  </td>
                  <td>{instrumento.ubicacion || 'N/A'}</td>
                  <td className="acciones">
                    <button
                      onClick={() => handleEditar(instrumento)}
                      className="btn btn-sm btn-secondary"
                    >
                      <i className="fas fa-edit"></i> Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(instrumento.id)}
                      className="btn btn-sm btn-danger"
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

const FormularioInstrumento = ({ instrumento, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    estado_fisico: 'bueno',
    disponible: true,
    ubicacion: '',
    valor_estimado: '',
    fecha_adquisicion: '',
    observaciones: ''
  });

  const tiposInstrumento = [
    'Violín', 'Viola', 'Violoncello', 'Contrabajo', 'Piano', 'Guitarra', 
    'Flauta', 'Clarinete', 'Saxofón', 'Trompeta', 'Trombón', 'Percusión', 'Otros'
  ];

  const estadosFisicos = ['excelente', 'bueno', 'regular', 'malo', 'reparacion'];

  useEffect(() => {
    if (instrumento) {
      setFormData({
        nombre: instrumento.nombre || '',
        tipo: instrumento.tipo || '',
        marca: instrumento.marca || '',
        modelo: instrumento.modelo || '',
        numero_serie: instrumento.numero_serie || '',
        estado_fisico: instrumento.estado_fisico || 'bueno',
        disponible: instrumento.disponible !== undefined ? instrumento.disponible : true,
        ubicacion: instrumento.ubicacion || '',
        valor_estimado: instrumento.valor_estimado || '',
        fecha_adquisicion: instrumento.fecha_adquisicion ? 
          instrumento.fecha_adquisicion.split('T')[0] : '',
        observaciones: instrumento.observaciones || ''
      });
    }
  }, [instrumento]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onGuardar(formData);
  };

  return (
    <>
      <div className="modal-header">
        <h5 className="modal-title">{instrumento ? 'Editar Instrumento' : 'Nuevo Instrumento'}</h5>
        <button type="button" className="btn-close" onClick={onCancelar}></button>
      </div>
      <div className="modal-body">
        <form id="formulario-instrumento" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre del Instrumento *</label>
              <input 
                type="text" 
                name="nombre" 
                className="form-control"
                value={formData.nombre} 
                onChange={handleChange} 
                placeholder="Ej: Violín 1/4 Niños 1"
                required 
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Tipo *</label>
              <select 
                name="tipo" 
                className="form-select"
                value={formData.tipo}
                onChange={handleChange} 
                required
              >
                <option value="">Seleccionar tipo</option>
                {tiposInstrumento.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Marca</label>
              <input 
                type="text" 
                name="marca" 
                className="form-control"
                value={formData.marca} 
                onChange={handleChange} 
                placeholder="Ej: Cremona"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Modelo</label>
              <input 
                type="text" 
                name="modelo" 
                className="form-control"
                value={formData.modelo} 
                onChange={handleChange} 
                placeholder="Ej: SV-75"
              />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Número de Serie</label>
              <input 
                type="text" 
                name="numero_serie" 
                className="form-control"
                value={formData.numero_serie} 
                onChange={handleChange} 
                placeholder="Ej: CRE-SV7-004"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Estado Físico</label>
              <select 
                name="estado_fisico" 
                className="form-select"
                value={formData.estado_fisico} 
                onChange={handleChange} 
                required
              >
                {estadosFisicos.map(estado => (
                  <option key={estado} value={estado}>
                    {estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Ubicación</label>
              <input 
                type="text" 
                name="ubicacion" 
                className="form-control"
                value={formData.ubicacion} 
                onChange={handleChange} 
                placeholder="Ej: Aula 101"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Valor Estimado</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                name="valor_estimado" 
                className="form-control"
                value={formData.valor_estimado} 
                onChange={handleChange} 
                placeholder="120000.00"
              />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Fecha de Adquisición</label>
              <input 
                type="date" 
                name="fecha_adquisicion" 
                className="form-control"
                value={formData.fecha_adquisicion} 
                onChange={handleChange} 
              />
            </div>

            <div className="col-md-6">
              <div className="form-check mt-4">
                <input 
                  type="checkbox" 
                  name="disponible" 
                  className="form-check-input"
                  id="disponible"
                  checked={formData.disponible} 
                  onChange={handleChange} 
                />
                <label className="form-check-label" htmlFor="disponible">
                  Disponible para préstamo
                </label>
              </div>
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">Observaciones</label>
            <textarea 
              name="observaciones" 
              className="form-control"
              value={formData.observaciones} 
              onChange={handleChange}
              placeholder="Notas adicionales sobre el instrumento..."
              rows="3"
            />
          </div>
        </form>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" form="formulario-instrumento" className="btn btn-primary">
          {instrumento ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </>
  );
};

export default Instrumentos;