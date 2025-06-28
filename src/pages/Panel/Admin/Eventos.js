import React, { useState, useEffect } from 'react';
import ModalPortal from '../../../components/ModalPortal';
import { useAlert } from '../../../components/providers/AlertProvider';

const Eventos = () => {
    // Hooks de alerta para usar shadcn/ui
    const { showConfirm, showSuccess, showError } = useAlert();
    
    // Estados principales del componente
    const [eventos, setEventos] = useState([]);
    const [eventoEditando, setEventoEditando] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState('');

    // Estados para búsqueda y filtrado
    const [filtros, setFiltros] = useState({
        nombre: '',
        fechaDesde: '',
        fechaHasta: '',
        estado: '',
        lugar: '',
        tipo: ''
    });

    // Cargar eventos al montar el componente
    useEffect(() => {
        cargarEventos();
    }, []);

    // Función para cargar eventos desde la API
    const cargarEventos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/eventos', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Eventos cargados:', data);
                setEventos(data);
            } else {
                console.error('Error al cargar eventos:', response.status);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Función para guardar (crear o actualizar) evento
    const handleGuardar = async (eventoData) => {
        try {
            const token = localStorage.getItem('token');
            
            // Determinar URL y método según si es edición o creación
            const url = eventoEditando 
                ? `http://localhost:5000/api/admin/eventos/${eventoEditando.id_evento}`
                : 'http://localhost:5000/api/admin/eventos';
            
            const method = eventoEditando ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventoData)
            });

            if (response.ok) {
                const result = await response.json();
                showSuccess('Éxito', result.message || 'Evento guardado exitosamente');
                cargarEventos(); // Recargar datos actualizados
                handleCancelar();
            } else {
                const error = await response.json();
                showError('Error', error.message || 'Error al guardar el evento');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error de Conexión', 'No se pudo conectar con el servidor');
            setMensaje('Error de conexión');
            setTimeout(() => setMensaje(''), 5000);
        }
    };

    // Preparar datos para edición
    const handleEditar = (evento) => {
        setEventoEditando(evento);
        setMostrarFormulario(true);
    };

    // Función para eliminar evento con confirmación
    const handleEliminar = async (id) => {
        const confirmed = await showConfirm(
            'Eliminar Evento',
            '¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.',
            {
                confirmText: 'Eliminar',
                cancelText: 'Cancelar'
            }
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/eventos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                showSuccess('Éxito', result.message || 'Evento eliminado exitosamente');
                cargarEventos();
            } else {
                const error = await response.json();
                showError('Error', error.message || 'Error al eliminar el evento');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error de Conexión', 'No se pudo conectar con el servidor');
            setTimeout(() => setMensaje(''), 5000);
        }
    };

    // Función para cambiar visibilidad del evento
    const handleToggleVisibilidad = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/eventos/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setMensaje(result.message || 'Visibilidad actualizada');
                cargarEventos();
                setTimeout(() => setMensaje(''), 3000);
            } else {
                const error = await response.json();
                setMensaje(`Error: ${error.message}`);
                setTimeout(() => setMensaje(''), 5000);
            }
        } catch (error) {
            console.error('Error:', error);
            setMensaje('Error de conexión');
            setTimeout(() => setMensaje(''), 5000);
        }
    };

    // Cerrar formulario y limpiar estado de edición
    const handleCancelar = () => {
        console.log('🚫 Cancelando formulario evento');
        setMostrarFormulario(false);
        setEventoEditando(null);
    };

    // Handler específico para crear nuevo evento
    const handleNuevoEvento = () => {
        console.log('➕ Creando nuevo evento');
        setEventoEditando(null); // Asegurar que esté en null
        setMostrarFormulario(true);
    };

    // Función para calcular el estado del evento basado en la fecha
    const calcularEstadoEvento = (fecha) => {
        const fechaEvento = new Date(fecha);
        const ahora = new Date();
        
        // Resetear horas para comparar solo fechas
        fechaEvento.setHours(0, 0, 0, 0);
        ahora.setHours(0, 0, 0, 0);
        
        if (fechaEvento < ahora) {
            return 'realizado';
        } else if (fechaEvento > ahora) {
            return 'programado';
        } else {
            return 'hoy'; // Evento de hoy
        }
    };

    // Función para filtrar eventos según criterios de búsqueda
    const eventosFiltrados = eventos.filter(evento => {
        const fechaEvento = new Date(evento.fecha);
        const fechaDesde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
        const fechaHasta = filtros.fechaHasta ? new Date(filtros.fechaHasta) : null;
        const estadoCalculado = calcularEstadoEvento(evento.fecha);
        
        return (
            (!filtros.nombre || evento.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) &&
            (!filtros.lugar || (evento.lugar && evento.lugar.toLowerCase().includes(filtros.lugar.toLowerCase()))) &&
            (!filtros.tipo || evento.tipo === filtros.tipo) &&
            (!filtros.estado || 
              filtros.estado === estadoCalculado ||
              (filtros.estado === 'visible' && evento.visible) ||
              (filtros.estado === 'oculto' && !evento.visible)) &&
            (!fechaDesde || fechaEvento >= fechaDesde) &&
            (!fechaHasta || fechaEvento <= fechaHasta)
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
            nombre: '',
            fechaDesde: '',
            fechaHasta: '',
            estado: '',
            lugar: '',
            tipo: ''
        });
    };

    // Mostrar indicador de carga
    if (loading) return <div className="loading">Cargando eventos...</div>;

    return (
        <div className="admin-section">
            {/* Encabezado con título y estadísticas */}
            <div className="admin-header">
                <h2>Gestión de Eventos</h2>
                <div className="header-actions">
                    <div className="stats">
                        Total: {eventosFiltrados.length} de {eventos.length} eventos
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={handleNuevoEvento}
                    >
                        + CREAR EVENTO
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
                <h6 style={{marginBottom: '1rem', color: 'var(--azul-marino)'}}>Buscar Eventos</h6>
                <div className="row g-3">
                    {/* Filtro por nombre */}
                    <div className="col-md-3">
                        <label className="form-label">Nombre</label>
                        <input
                            type="text"
                            name="nombre"
                            className="form-control"
                            placeholder="Nombre del evento"
                            value={filtros.nombre}
                            onChange={handleChange}
                        />
                    </div>
                    {/* Filtro por lugar */}
                    <div className="col-md-3">
                        <label className="form-label">Lugar</label>
                        <input
                            type="text"
                            name="lugar"
                            className="form-control"
                            placeholder="Lugar del evento"
                            value={filtros.lugar}
                            onChange={handleChange}
                        />
                    </div>
                    {/* Filtro por tipo de evento */}
                    <div className="col-md-2">
                        <label className="form-label">Tipo</label>
                        <select
                            name="tipo"
                            className="form-select"
                            value={filtros.tipo}
                            onChange={handleChange}
                        >
                            <option value="">Todos</option>
                            <option value="concierto">Concierto</option>
                            <option value="ensayo">Ensayo</option>
                            <option value="masterclass">Masterclass</option>
                            <option value="competencia">Competencia</option>
                            <option value="presentacion">Presentación</option>
                        </select>
                    </div>
                    {/* Filtro por estado del evento */}
                    <div className="col-md-2">
                        <label className="form-label">Estado</label>
                        <select
                            name="estado"
                            className="form-select"
                            value={filtros.estado}
                            onChange={handleChange}
                        >
                            <option value="">Todos</option>
                            <option value="programado">Programados</option>
                            <option value="hoy">Hoy</option>
                            <option value="realizado">Realizados</option>
                            <option value="visible">Solo Visibles</option>
                            <option value="oculto">Solo Ocultos</option>
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
                </div>
                <div className="row g-3 mt-2">
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

            {/* Tabla de eventos */}
            <div className="tabla-container">
                <table className="tabla-datos">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Fecha</th>
                            <th>Lugar</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eventosFiltrados.map(evento => (
                            <tr key={evento.id_evento}>
                                <td>{evento.nombre}</td>
                                <td>{new Date(evento.fecha).toLocaleDateString('es-CL')}</td>
                                <td>{evento.lugar}</td>
                                <td>{evento.tipo}</td>
                                <td>
                                    {/* Estado del evento con color dinámico */}
                                    <span className={`estado ${calcularEstadoEvento(evento.fecha)}`}>
                                        {calcularEstadoEvento(evento.fecha) === 'realizado' ? 'Realizado' : 
                                         calcularEstadoEvento(evento.fecha) === 'hoy' ? 'Hoy' : 'Programado'}
                                    </span>
                                </td>
                                <td className="acciones">
                                    {/* Botón editar */}
                                    <button 
                                        onClick={() => handleEditar(evento)} 
                                        className="btn btn-sm btn-secondary"
                                    >
                                        <i className="fas fa-edit"></i> Editar
                                    </button>
                                    {/* Botón cambiar visibilidad */}
                                    <button
                                        onClick={() => handleToggleVisibilidad(evento.id_evento)}
                                        className={`btn btn-sm ${evento.visible ? 'btn-success' : 'btn-warning'}`}
                                    >
                                        <i className={`fas ${evento.visible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                        {evento.visible ? 'Visible' : 'Oculto'}
                                    </button>
                                    {/* Botón eliminar */}
                                    <button 
                                        onClick={() => handleEliminar(evento.id_evento)} 
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
                {eventosFiltrados.length === 0 && (
                    <div className="text-center py-4">
                        <p className="text-muted">No se encontraron eventos</p>
                    </div>
                )}
            </div>

            {/* Modal para crear/editar evento */}
            <ModalPortal 
                isOpen={mostrarFormulario} 
                onClose={handleCancelar}
            >
                <FormularioEvento 
                    evento={eventoEditando}
                    onGuardar={handleGuardar}
                    onCancelar={handleCancelar}
                />
            </ModalPortal>
        </div>
    );
};

// Componente formulario para crear/editar eventos
const FormularioEvento = ({ evento, onGuardar, onCancelar }) => {
    // Estado del formulario con valores por defecto
    const [formData, setFormData] = useState({
        nombre: '',
        fecha: '',
        hora: '',
        lugar: '',
        descripcion: '',
        tipo: 'concierto',
        visible: true
    });

    // Cargar datos cuando se edita un evento existente
    useEffect(() => {
        console.log('🔄 useEffect FormularioEvento - evento:', evento);
        
        if (evento) {
            // Formatear fecha para el input de fecha
            let fechaFormateada = '';
            if (evento.fecha) {
                const fechaEvento = new Date(evento.fecha);
                const fechaAjustada = new Date(fechaEvento.getTime() + fechaEvento.getTimezoneOffset() * 60000);
                fechaFormateada = fechaAjustada.toISOString().split('T')[0];
            }

            const nuevosData = {
                nombre: evento.nombre || '',
                fecha: fechaFormateada,
                hora: evento.hora || '',
                lugar: evento.lugar || '',
                descripcion: evento.descripcion || '',
                tipo: evento.tipo || 'concierto',
                visible: evento.visible !== undefined ? evento.visible : true
            };
            
            console.log('📝 Cargando datos del evento:', nuevosData);
            setFormData(nuevosData);
        } else {
            // Limpiar formulario para nuevo evento
            const datosLimpios = {
                nombre: '',
                fecha: '',
                hora: '',
                lugar: '',
                descripcion: '',
                tipo: 'concierto',
                visible: true
            };
            
            console.log('🆕 Limpiando formulario para nuevo evento');
            setFormData(datosLimpios);
        }
    }, [evento]);

    // Manejar cambios en los campos del formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        console.log('Toggle cambio:', { name, value, type, checked });
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Enviar formulario
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Enviando datos:', formData);
        onGuardar(formData);
    };

    // Handler específico para el toggle de visibilidad
    const handleToggleChange = (e) => {
        const isChecked = e.target.checked;
        console.log('Toggle específico:', isChecked);
        setFormData(prev => ({
            ...prev,
            visible: isChecked
        }));
    };

    return (
        <>
            {/* Encabezado del modal */}
            <div className="modal-header">
                <h5 className="modal-title">
                    {evento ? 'Editar Evento' : 'Nuevo Evento'}
                </h5>
                <button 
                    type="button" 
                    className="btn-close" 
                    onClick={onCancelar}
                ></button>
            </div>
            
            <div className="modal-body">
                <form id="formulario-evento" onSubmit={handleSubmit}>
                    <div className="row g-3">
                        {/* Campo nombre del evento */}
                        <div className="col-12">
                            <label className="form-label">Nombre del Evento *</label>
                            <input
                                type="text"
                                name="nombre"
                                className="form-control"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Campos fecha y hora */}
                        <div className="col-md-6">
                            <label className="form-label">Fecha *</label>
                            <input
                                type="date"
                                name="fecha"
                                className="form-control"
                                value={formData.fecha}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Hora</label>
                            <input
                                type="time"
                                name="hora"
                                className="form-control"
                                value={formData.hora}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Campo lugar */}
                        <div className="col-12">
                            <label className="form-label">Lugar *</label>
                            <input
                                type="text"
                                name="lugar"
                                className="form-control"
                                value={formData.lugar}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Selector tipo de evento */}
                        <div className="col-12">
                            <label className="form-label">Tipo de Evento</label>
                            <select
                                name="tipo"
                                className="form-select"
                                value={formData.tipo}
                                onChange={handleChange}
                            >
                                <option value="concierto">Concierto</option>
                                <option value="ensayo">Ensayo</option>
                                <option value="masterclass">Masterclass</option>
                                <option value="competencia">Competencia</option>
                                <option value="presentacion">Presentación</option>
                            </select>
                        </div>

                        {/* Campo descripción */}
                        <div className="col-12">
                            <label className="form-label">Descripción</label>
                            <textarea
                                name="descripcion"
                                className="form-control"
                                rows="4"
                                value={formData.descripcion}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        {/* Switch de visibilidad */}
                        <div className="col-12">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="visible"
                                    name="visible"
                                    checked={formData.visible}
                                    onChange={handleToggleChange}
                                />
                                <label className="form-check-label" htmlFor="visible">
                                    Visible al público
                                </label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Botones de acción del modal */}
            <div className="modal-footer">
                <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={onCancelar}
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    form="formulario-evento"
                    className="btn btn-primary"
                >
                    {evento ? 'Actualizar' : 'Crear'} Evento
                </button>
            </div>
        </>
    );
};

export default Eventos;