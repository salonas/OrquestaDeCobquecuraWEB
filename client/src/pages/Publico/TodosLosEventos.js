import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import { ContenidoExpandible } from '../../components/Common';
import './VistaPublica.css';

const TodosLosEventos = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const [eventos, setEventos] = useState([]);
    const [eventosFiltrados, setEventosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para filtros
    const [filtros, setFiltros] = useState({
        busqueda: '',
        tipo: '',
        fechaDesde: '',
        fechaHasta: ''
    });
    const [tiposEventos, setTiposEventos] = useState([]);

    useEffect(() => {
        cargarTodosLosEventos();
        
        // Si hay filtros en el state de navegación, aplicarlos
        if (location.state?.filtros) {
            setFiltros(location.state.filtros);
        }
    }, []);

    // Limpiar el state de navegación después de aplicar filtros
    useEffect(() => {
        if (location.state?.filtros) {
            // Limpiar el state para evitar que se mantenga en futuras navegaciones
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Aplicar filtros cuando cambien los filtros o los eventos
    useEffect(() => {
        aplicarFiltros();
    }, [filtros, eventos]);

    const cargarTodosLosEventos = async () => {
        try {
            setLoading(true);
            console.log('🔄 Cargando todos los eventos...');
            
            const response = await fetch('http://localhost:5000/api/eventos');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📅 Eventos cargados:', data.length);
            
            if (Array.isArray(data)) {
                setEventos(data);
                
                // Extraer tipos únicos de eventos
                const tiposUnicos = [...new Set(data.map(evento => evento.tipo).filter(Boolean))];
                setTiposEventos(tiposUnicos);
            } else {
                console.error('❌ Formato de datos inesperado:', data);
                setEventos([]);
            }
        } catch (error) {
            console.error('❌ Error al cargar eventos:', error);
            setEventos([]);
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        let eventosFiltrados = [...eventos];

        // Filtro por búsqueda
        if (filtros.busqueda.trim()) {
            const termino = filtros.busqueda.toLowerCase().trim();
            eventosFiltrados = eventosFiltrados.filter(evento =>
                evento.nombre?.toLowerCase().includes(termino) ||
                evento.descripcion?.toLowerCase().includes(termino) ||
                evento.lugar?.toLowerCase().includes(termino)
            );
        }

        // Filtro por tipo
        if (filtros.tipo) {
            eventosFiltrados = eventosFiltrados.filter(evento => 
                evento.tipo === filtros.tipo
            );
        }

        // Filtro por fecha desde
        if (filtros.fechaDesde) {
            eventosFiltrados = eventosFiltrados.filter(evento => {
                const fechaEvento = new Date(evento.fecha);
                const fechaDesde = new Date(filtros.fechaDesde);
                return fechaEvento >= fechaDesde;
            });
        }

        // Filtro por fecha hasta
        if (filtros.fechaHasta) {
            eventosFiltrados = eventosFiltrados.filter(evento => {
                const fechaEvento = new Date(evento.fecha);
                const fechaHasta = new Date(filtros.fechaHasta);
                return fechaEvento <= fechaHasta;
            });
        }

        setEventosFiltrados(eventosFiltrados);
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            busqueda: '',
            tipo: '',
            fechaDesde: '',
            fechaHasta: ''
        });
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        
        try {
            return new Date(fecha).toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return fecha;
        }
    };

    const formatearHora = (hora) => {
        if (!hora) return '';
        
        try {
            // Si la hora viene como string (HH:mm:ss), extraer solo HH:mm
            if (typeof hora === 'string' && hora.includes(':')) {
                const [horas, minutos] = hora.split(':');
                return `${horas}:${minutos}`;
            }
            return hora;
        } catch (error) {
            console.error('Error al formatear hora:', error);
            return hora;
        }
    };

    const hayFiltrosActivos = () => {
        return filtros.busqueda.trim() || 
               filtros.tipo || 
               filtros.fechaDesde || 
               filtros.fechaHasta;
    };

    // Aplicar clase al body para el fondo
    useEffect(() => {
        document.body.classList.add('vista-publica-body');
        return () => {
            document.body.classList.remove('vista-publica-body');
        };
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-estatico">
                    <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <p>Cargando eventos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vista-publica">
            <Container className="py-5">
                <Row>
                    <Col lg={12}>
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h1 className="text-azul-marino">
                                <i className="fas fa-calendar-alt me-3"></i>
                                Todos los Eventos
                                {/* Mostrar si hay filtro de tipo aplicado */}
                                {filtros.tipo && (
                                    <small className="text-azul-marino ms-2">
                                        - Tipo: {filtros.tipo.charAt(0).toUpperCase() + filtros.tipo.slice(1)}
                                    </small>
                                )}
                            </h1>
                            <Button 
                                variant="outline-primary"
                                onClick={() => navigate('/')}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Volver al Inicio
                            </Button>
                        </div>

                        {/* Panel de Filtros */}
                        <Card className="mb-4 filtros-panel">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0">
                                    <i className="fas fa-filter me-2"></i>
                                    Filtrar Eventos
                                    {hayFiltrosActivos() && (
                                        <span className="badge bg-primary ms-2">
                                            {eventosFiltrados.length} de {eventos.length}
                                        </span>
                                    )}
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    {/* Búsqueda por texto */}
                                    <Col md={6} lg={4}>
                                        <Form.Label>Buscar por nombre, descripción o lugar</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text>
                                                <i className="fas fa-search"></i>
                                            </InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="Escriba para buscar..."
                                                value={filtros.busqueda}
                                                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                                            />
                                        </InputGroup>
                                    </Col>

                                    {/* Filtro por tipo */}
                                    <Col md={6} lg={2}>
                                        <Form.Label>Tipo de Evento</Form.Label>
                                        <Form.Select
                                            value={filtros.tipo}
                                            onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                                        >
                                            <option value="">Todos los tipos</option>
                                            {tiposEventos.map(tipo => (
                                                <option key={tipo} value={tipo}>
                                                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>

                                    {/* Fecha desde */}
                                    <Col md={6} lg={2}>
                                        <Form.Label>Desde</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={filtros.fechaDesde}
                                            onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                                        />
                                    </Col>

                                    {/* Fecha hasta */}
                                    <Col md={6} lg={2}>
                                        <Form.Label>Hasta</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={filtros.fechaHasta}
                                            onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                                        />
                                    </Col>

                                    {/* Botón limpiar */}
                                    <Col lg={2} className="d-flex align-items-end">
                                        <Button
                                            variant="outline-secondary"
                                            onClick={limpiarFiltros}
                                            disabled={!hayFiltrosActivos()}
                                            className="w-100"
                                            title="Limpiar filtros"
                                        >
                                            <i className="fas fa-times me-1"></i>
                                            Limpiar
                                        </Button>
                                    </Col>
                                </Row>

                                {/* Indicadores de filtros activos */}
                                {hayFiltrosActivos() && (
                                    <Row className="mt-3">
                                        <Col>
                                            <div className="d-flex flex-wrap gap-2">
                                                <small className="text-muted me-2">Filtros activos:</small>
                                                
                                                {filtros.busqueda && (
                                                    <span className="badge bg-info">
                                                        Búsqueda: "{filtros.busqueda}"
                                                        <button 
                                                            className="btn-close btn-close-white ms-1"
                                                            style={{ fontSize: '0.6em' }}
                                                            onClick={() => handleFiltroChange('busqueda', '')}
                                                        ></button>
                                                    </span>
                                                )}
                                                
                                                {filtros.tipo && (
                                                    <span className="badge bg-primary">
                                                        Tipo: {filtros.tipo.charAt(0).toUpperCase() + filtros.tipo.slice(1)}
                                                        <button 
                                                            className="btn-close btn-close-white ms-1"
                                                            style={{ fontSize: '0.6em' }}
                                                            onClick={() => handleFiltroChange('tipo', '')}
                                                        ></button>
                                                    </span>
                                                )}
                                                
                                                {(filtros.fechaDesde || filtros.fechaHasta) && (
                                                    <span className="badge bg-success">
                                                        Fecha: {filtros.fechaDesde || '...'} - {filtros.fechaHasta || '...'}
                                                        <button 
                                                            className="btn-close btn-close-white ms-1"
                                                            style={{ fontSize: '0.6em' }}
                                                            onClick={() => {
                                                                handleFiltroChange('fechaDesde', '');
                                                                handleFiltroChange('fechaHasta', '');
                                                            }}
                                                        ></button>
                                                    </span>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Lista de eventos */}
                        {eventosFiltrados.length > 0 ? (
                            <>
                                {/* Información de resultados */}
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <p className="text-muted mb-0">
                                        {hayFiltrosActivos() ? (
                                            <>Mostrando {eventosFiltrados.length} de {eventos.length} eventos</>
                                        ) : (
                                            <>Mostrando {eventos.length} eventos</>
                                        )}
                                    </p>
                                </div>

                                <Row className="g-4">
                                    {eventosFiltrados.map((evento, index) => (
                                        <Col key={evento.id_evento} md={6} lg={4}>
                                            <Card 
                                                className="h-100 evento-card"
                                                style={{animationDelay: `${index * 0.1}s`}}
                                            >
                                                <Card.Body className="d-flex flex-column">
                                                    {/* Badges y fecha */}
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <small className="text-muted">
                                                            <i className="fas fa-calendar me-1"></i>
                                                            {formatearFecha(evento.fecha)}
                                                        </small>
                                                        {evento.tipo && (
                                                            <span className={`badge ${
                                                                evento.tipo === 'concierto' ? 'bg-warning text-dark' :
                                                                evento.tipo === 'ensayo' ? 'bg-primary' :
                                                                evento.tipo === 'masterclass' ? 'bg-info' :
                                                                evento.tipo === 'competencia' ? 'bg-success' :
                                                                evento.tipo === 'presentacion' ? 'bg-secondary' :
                                                                'bg-dark'
                                                            }`}>
                                                                <i className={`fas ${
                                                                    evento.tipo === 'concierto' ? 'fa-music' :
                                                                    evento.tipo === 'ensayo' ? 'fa-users' :
                                                                    evento.tipo === 'masterclass' ? 'fa-chalkboard-teacher' :
                                                                    evento.tipo === 'competencia' ? 'fa-trophy' :
                                                                    evento.tipo === 'presentacion' ? 'fa-stage' :
                                                                    'fa-calendar'
                                                                } me-1`}></i>
                                                                {evento.tipo.charAt(0).toUpperCase() + evento.tipo.slice(1)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Título */}
                                                    <Card.Title className="evento-titulo">
                                                        {evento.nombre}
                                                    </Card.Title>

                                                    {/* Descripción */}
                                                    {evento.descripcion && (
                                                        <Card.Text className="flex-grow-1 evento-descripcion">
                                                            <ContenidoExpandible texto={evento.descripcion} />
                                                        </Card.Text>
                                                    )}

                                                    {/* Información del evento */}
                                                    <div className="evento-info mt-auto">
                                                        {evento.hora_inicio && (
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="fas fa-clock text-primary me-2"></i>
                                                                <small className="text-muted">
                                                                    {formatearHora(evento.hora_inicio)}
                                                                    {evento.hora_fin && ` - ${formatearHora(evento.hora_fin)}`}
                                                                </small>
                                                            </div>
                                                        )}
                                                        {evento.lugar && (
                                                            <div className="d-flex align-items-center">
                                                                <i className="fas fa-map-marker-alt text-danger me-2"></i>
                                                                <small className="text-muted">{evento.lugar}</small>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        ) : (
                            <div className="text-center py-5">
                                <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                                <h3 className="text-muted">
                                    {hayFiltrosActivos() ? 
                                        'No se encontraron eventos con los filtros aplicados' : 
                                        'No hay eventos disponibles'
                                    }
                                </h3>
                                <p className="text-muted">
                                    {hayFiltrosActivos() ? 
                                        'Prueba modificando los filtros de búsqueda.' : 
                                        'Vuelve pronto para ver los próximos eventos.'
                                    }
                                </p>
                                {hayFiltrosActivos() ? (
                                    <Button 
                                        variant="primary"
                                        onClick={limpiarFiltros}
                                    >
                                        <i className="fas fa-times me-2"></i>
                                        Limpiar Filtros
                                    </Button>
                                ) : (
                                    <Button 
                                        variant="primary"
                                        onClick={() => navigate('/')}
                                    >
                                        <i className="fas fa-home me-2"></i>
                                        Volver al Inicio
                                    </Button>
                                )}
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default TodosLosEventos;
