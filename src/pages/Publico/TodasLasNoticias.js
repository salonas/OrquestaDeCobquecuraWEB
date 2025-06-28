import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import './VistaPublica.css';

const TodasLasNoticias = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const [noticias, setNoticias] = useState([]);
    const [noticiasFiltradas, setNoticiasFiltradas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para filtros
    const [filtros, setFiltros] = useState({
        busqueda: '',
        categoria: '',
        fechaDesde: '',
        fechaHasta: ''
    });
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        cargarTodasLasNoticias();
        
        // Aplicar filtros iniciales si vienen del state
        if (location.state?.filtroInicial) {
            setFiltros(prev => ({
                ...prev,
                ...location.state.filtroInicial
            }));
        }
        
        // Aplicar clase al body
        document.body.classList.add('vista-publica-body');
        return () => {
            document.body.classList.remove('vista-publica-body');
        };
    }, []);

    // Limpiar el state de navegación después de aplicar filtros
    useEffect(() => {
        if (location.state?.filtroInicial) {
            // Limpiar el state para evitar que se mantenga en futuras navegaciones
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Aplicar filtros cuando cambien los filtros o las noticias
    useEffect(() => {
        aplicarFiltros();
    }, [filtros, noticias]);

    const cargarTodasLasNoticias = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/noticias');
            if (response.ok) {
                const data = await response.json();
                
                // Formatear las URLs de las imágenes
                const noticiasFormateadas = data.map(noticia => ({
                    ...noticia,
                    imagen_principal: noticia.imagen_principal ? 
                        (noticia.imagen_principal.startsWith('http') ? 
                            noticia.imagen_principal : 
                            `http://localhost:5000${noticia.imagen_principal}`
                        ) : null
                }));
                
                console.log('📝 Noticias formateadas:', noticiasFormateadas);
                setNoticias(noticiasFormateadas);
                
                // Extraer categorías únicas
                const categoriasUnicas = [...new Set(noticiasFormateadas
                    .map(noticia => noticia.categoria)
                    .filter(categoria => categoria && categoria.trim() !== '')
                )].sort();
                setCategorias(categoriasUnicas);
            }
        } catch (error) {
            console.error('Error cargando noticias:', error);
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        let noticiasFiltradas = [...noticias];

        // Filtro por búsqueda en título
        if (filtros.busqueda) {
            noticiasFiltradas = noticiasFiltradas.filter(noticia =>
                noticia.titulo.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                (noticia.resumen && noticia.resumen.toLowerCase().includes(filtros.busqueda.toLowerCase())) ||
                (noticia.contenido && noticia.contenido.toLowerCase().includes(filtros.busqueda.toLowerCase()))
            );
        }

        // Filtro por categoría
        if (filtros.categoria) {
            noticiasFiltradas = noticiasFiltradas.filter(noticia =>
                noticia.categoria === filtros.categoria
            );
        }

        // Filtro por fecha desde
        if (filtros.fechaDesde) {
            noticiasFiltradas = noticiasFiltradas.filter(noticia => {
                const fechaNoticia = new Date(noticia.fecha_publicacion);
                const fechaFiltro = new Date(filtros.fechaDesde);
                return fechaNoticia >= fechaFiltro;
            });
        }

        // Filtro por fecha hasta
        if (filtros.fechaHasta) {
            noticiasFiltradas = noticiasFiltradas.filter(noticia => {
                const fechaNoticia = new Date(noticia.fecha_publicacion);
                const fechaFiltro = new Date(filtros.fechaHasta);
                return fechaNoticia <= fechaFiltro;
            });
        }

        setNoticiasFiltradas(noticiasFiltradas);
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
            categoria: '',
            fechaDesde: '',
            fechaHasta: ''
        });
    };

    const irANoticiaDetalle = (slug) => {
        navigate(`/noticia/${slug}`);
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearFechaInput = (fecha) => {
        return new Date(fecha).toISOString().split('T')[0];
    };

    const hayFiltrosActivos = () => {
        return filtros.busqueda || filtros.categoria || filtros.fechaDesde || filtros.fechaHasta;
    };

    // Componente para manejar imágenes con validación estricta
    const ImagenNoticia = ({ src, alt, className, style, onClick }) => {
        const [error, setError] = useState(false);
        const [cargando, setCargando] = useState(true);

        const handleError = () => {
            console.error('Error cargando imagen:', src);
            setError(true);
            setCargando(false);
        };

        const handleLoad = () => {
            setCargando(false);
            setError(false);
        };

        // Verificar si la imagen es válida - solo mostrar si realmente existe
        if (!src || src.trim() === '' || src === 'null' || src === null || error) {
            return null; // No renderizar nada si no hay imagen válida
        }

        const urlImagen = src.startsWith('http') ? src : `http://localhost:5000${src}`;

        return (
            <div className="position-relative">
                {cargando && (
                    <div 
                        className="position-absolute top-50 start-50 translate-middle"
                        style={{ zIndex: 1 }}
                    >
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                )}
                
                <img
                    src={urlImagen}
                    alt={alt}
                    className={className}
                    style={{ 
                        ...style, 
                        display: cargando ? 'none' : 'block',
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover'
                    }}
                    onClick={onClick}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-estatico">
                    <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <p>Cargando noticias...</p>
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
                        <div className="d-flex justify-content-between align-items-center mb-4">                            <h1 className="text-azul-marino">
                                <i className="fas fa-newspaper me-3"></i>
                                Todas las Noticias
                                {/* Mostrar si hay filtro de categoría aplicado */}
                                {filtros.categoria && (
                                    <small className="text-azul-marino ms-2">
                                        - Categoría: {filtros.categoria}
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
                                    Filtrar Noticias
                                    {hayFiltrosActivos() && (
                                        <span className="badge bg-primary ms-2">
                                            {noticiasFiltradas.length} de {noticias.length}
                                        </span>
                                    )}
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    {/* Búsqueda por texto */}
                                    <Col md={6} lg={4}>
                                        <Form.Label>Buscar por título o contenido</Form.Label>
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

                                    {/* Filtro por categoría */}
                                    <Col md={6} lg={3}>
                                        <Form.Label>Categoría</Form.Label>
                                        <Form.Select
                                            value={filtros.categoria}
                                            onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                                        >
                                            <option value="">Todas las categorías</option>
                                            {categorias.map(categoria => (
                                                <option key={categoria} value={categoria}>
                                                    {categoria}
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
                                    <Col lg={1} className="d-flex align-items-end">
                                        <Button
                                            variant="outline-secondary"
                                            onClick={limpiarFiltros}
                                            disabled={!hayFiltrosActivos()}
                                            className="w-100"
                                            title="Limpiar filtros"
                                        >
                                            <i className="fas fa-times"></i>
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
                                                
                                                {filtros.categoria && (
                                                    <span className="badge bg-primary">
                                                        Categoría: {filtros.categoria}
                                                        <button 
                                                            className="btn-close btn-close-white ms-1"
                                                            style={{ fontSize: '0.6em' }}
                                                            onClick={() => handleFiltroChange('categoria', '')}
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

                        {/* Grid de noticias */}
                        {noticiasFiltradas.length > 0 ? (
                            <>
                                {/* Información de resultados */}
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <p className="text-muted mb-0">
                                        {hayFiltrosActivos() ? (
                                            <>Mostrando {noticiasFiltradas.length} de {noticias.length} noticias</>
                                        ) : (
                                            <>Mostrando {noticias.length} noticias</>
                                        )}
                                    </p>
                                </div>

                                <Row className="g-4">
                                    {noticiasFiltradas.map((noticia, index) => (
                                        <Col key={noticia.id_noticia} md={6} lg={4}>
                                            <Card 
                                                className="h-100 noticia-card"
                                                style={{animationDelay: `${index * 0.1}s`}}
                                            >
                                                {/* Imagen */}
                                                <ImagenNoticia
                                                    src={noticia.imagen_principal}
                                                    alt={noticia.titulo}
                                                    className="card-img-top"
                                                    style={{ 
                                                        height: '200px', 
                                                        objectFit: 'cover',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => irANoticiaDetalle(noticia.slug)}
                                                />
                                                
                                                <Card.Body className="d-flex flex-column">
                                                    {/* Badges y fecha */}
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <small className="text-muted">
                                                            <i className="fas fa-calendar me-1"></i>
                                                            {formatearFecha(noticia.fecha_publicacion)}
                                                        </small>
                                                        {(noticia.destacado === true || noticia.destacado === 1) && (
                                                            <span className="badge bg-warning text-dark">
                                                                <i className="fas fa-star me-1"></i>
                                                                DESTACADA
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Categoría */}
                                                    {noticia.categoria && (
                                                        <span className="badge bg-primary mb-2 align-self-start">
                                                            {noticia.categoria}
                                                        </span>
                                                    )}

                                                    {/* Título */}
                                                    <Card.Title 
                                                        className="noticia-titulo"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => irANoticiaDetalle(noticia.slug)}
                                                    >
                                                        {noticia.titulo}
                                                    </Card.Title>

                                                    {/* Resumen */}
                                                    <Card.Text className="flex-grow-1">
                                                        {noticia.resumen || 
                                                         (noticia.contenido ? 
                                                          noticia.contenido.substring(0, 150) + '...' : 
                                                          'Sin descripción')}
                                                    </Card.Text>

                                                    {/* Autor */}
                                                    {noticia.autor && (
                                                        <small className="text-muted mb-3">
                                                            <i className="fas fa-user me-1"></i>
                                                            Por: {noticia.autor}
                                                        </small>
                                                    )}

                                                    {/* Botón leer más */}
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => irANoticiaDetalle(noticia.slug)}
                                                        className="mt-auto"
                                                    >
                                                        <i className="fas fa-book-open me-2"></i>
                                                        Leer completo
                                                        <i className="fas fa-arrow-right ms-2"></i>
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        ) : (
                            <div className="text-center py-5">
                                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                                <h3 className="text-muted">
                                    {hayFiltrosActivos() ? 
                                        'No se encontraron noticias con los filtros aplicados' : 
                                        'No hay noticias disponibles'
                                    }
                                </h3>
                                <p className="text-muted">
                                    {hayFiltrosActivos() ? 
                                        'Prueba modificando los filtros de búsqueda.' : 
                                        'Vuelve pronto para ver las últimas noticias.'
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

export default TodasLasNoticias;