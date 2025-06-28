import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContenidoExpandible } from '../../components/Common';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { images } from '../../utils/images';
import { initAllAnimations, animateCounter } from '../../utils/animations';
import './VistaPublica.css';

const VistaPublica = () => {
    const navigate = useNavigate();
    const [noticias, setNoticias] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [loadingNoticias, setLoadingNoticias] = useState(true);
    const [loadingEventos, setLoadingEventos] = useState(true);
    const [estadisticas, setEstadisticas] = useState({ 
        estudiantes: 0,
        profesores: 0,
        instrumentos: 0,
        anosExperiencia: 4
    });
    const [estadisticasAnimadas, setEstadisticasAnimadas] = useState(false);
    const [noticiasDestacadas, setNoticiasDestacadas] = useState([]);

    // Configurar altura del viewport
    const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Cargar noticias destacadas
    const cargarNoticiasDestacadas = async () => {
        try {
            console.log('🌟 Cargando noticias destacadas...');
            
            const response = await fetch('http://localhost:5000/api/noticias/destacadas?limit=3');
            
            if (response.ok) {
                const noticias = await response.json();
                console.log('✅ Noticias destacadas recibidas:', noticias.length);
                setNoticiasDestacadas(noticias);
            } else {
                console.error('❌ Error cargando noticias destacadas');
            }
        } catch (error) {
            console.error('❌ Error:', error);
        }
    };

    // Cargar noticias para vista pública
    const cargarNoticias = async () => {
        try {
            console.log('🔄 Cargando noticias para vista pública...');
            
            const response = await fetch('http://localhost:5000/api/noticias');
            
            console.log('📊 Response status noticias:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📋 Noticias recibidas:', data);
                
                if (Array.isArray(data) && data.length > 0) {
                    // Procesar solo las primeras 3 noticias
                    const noticiasParaVista = data.slice(0, 3).map(noticia => {
                        // Limpiar el contenido para evitar duplicación del título
                        let contenidoLimpio = noticia.resumen || noticia.contenido || 'Sin descripción';
                        
                        // Si el contenido empieza con el título, removerlo
                        if (contenidoLimpio.toLowerCase().startsWith(noticia.titulo.toLowerCase())) {
                            contenidoLimpio = contenidoLimpio.substring(noticia.titulo.length).trim();
                        }
                        
                        // Truncar si es muy largo
                        if (contenidoLimpio.length > 200) {
                            contenidoLimpio = contenidoLimpio.substring(0, 200) + '...';
                        }
                        
                        return {
                            ...noticia,
                            // Asegurar que tengamos un slug válido
                            slug: noticia.slug || `noticia-${noticia.id_noticia}`,
                            // Usar contenido limpio
                            contenido_vista: contenidoLimpio,
                            // Mantener imagen_principal como está
                            imagen_principal: noticia.imagen_principal
                        };
                    });
                    
                    // Debug: Log para verificar las imágenes
                    noticiasParaVista.forEach((noticia, index) => {
                        console.log(`🖼️ Noticia ${index + 1}:`, {
                            titulo: noticia.titulo,
                            imagen_principal: noticia.imagen_principal,
                            tieneImagen: !!(noticia.imagen_principal && 
                                          noticia.imagen_principal.trim() !== '' && 
                                          noticia.imagen_principal !== 'null' && 
                                          noticia.imagen_principal !== null),
                            valorOriginal: noticia.imagen_principal
                        });
                    });
                    
                    setNoticias(noticiasParaVista);
                    console.log('✅ Noticias procesadas:', noticiasParaVista);
                } else {
                    console.log('⚠️ No se encontraron noticias');
                    setNoticias([]);
                }
            } else {
                console.error('❌ Error en respuesta:', response.status);
                setNoticias([]);
            }
        } catch (error) {
            console.error('❌ Error cargando noticias:', error);
            setNoticias([]);
        } finally {
            setLoadingNoticias(false);
        }
    };

    // Cargar eventos para vista pública
    const cargarEventos = async () => {
        try {
            console.log('🔄 Cargando eventos para vista pública...');
            
            const response = await fetch('http://localhost:5000/api/eventos/publicos');
            
            console.log('📊 Response status eventos:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📋 Eventos recibidos:', data);
                
                if (Array.isArray(data) && data.length > 0) {
                    const eventosFormateados = data.slice(0, 3).map(evento => ({
                        id_evento: evento.id_evento,
                        nombre: evento.nombre,
                        descripcion: evento.descripcion,
                        fecha: evento.fecha,
                        hora_inicio: evento.hora_inicio,
                        hora_fin: evento.hora_fin,
                        lugar: evento.lugar,
                        tipo: evento.tipo
                    }));
                    
                    console.log('✅ Eventos formateados:', eventosFormateados);
                    setEventos(eventosFormateados);
                } else {
                    console.log('⚠️ No se encontraron eventos o datos no válidos:', data);
                    setEventos([]);
                }
            } else {
                console.error('❌ Error en respuesta eventos:', response.status);
                setEventos([]);
            }
        } catch (error) {
            console.error('❌ Error cargando eventos:', error);
            setEventos([]);
        } finally {
            setLoadingEventos(false);
        }
    };

    // Cargar estadísticas del sistema
    const cargarEstadisticas = async () => {
        try {
            console.log('🔄 Iniciando carga de estadísticas...');
            
            const endpoints = [
                'http://localhost:5000/api/estadisticas/publicas',
                'http://localhost:5000/api/auth/estadisticas'
            ];
            
            let estadisticasCargadas = false;
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint);
                    console.log(`📊 Response status ${endpoint}:`, response.status);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('📊 Estadísticas recibidas:', data);
                        
                        setEstadisticasAnimadas(false);
                        setEstadisticas(data);
                        
                        setTimeout(() => {
                            if (data.estudiantes > 0 || data.profesores > 0 || data.instrumentos > 0) {
                                animarEstadisticasDirectamente(data);
                            }
                        }, 100);
                        
                        estadisticasCargadas = true;
                        break;
                    }
                } catch (endpointError) {
                    console.log(`⚠️ Error en endpoint ${endpoint}:`, endpointError.message);
                    continue;
                }
            }
            
            if (!estadisticasCargadas) {
                console.log('⚠️ Usando estadísticas por defecto');
                const estadisticasDefecto = {
                    estudiantes: 45,
                    profesores: 5,
                    instrumentos: 25,
                    anosExperiencia: 4
                };
                setEstadisticas(estadisticasDefecto);
                setTimeout(() => {
                    animarEstadisticasDirectamente(estadisticasDefecto);
                }, 100);
            }
            
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            const estadisticasDefecto = {
                estudiantes: 45,
                profesores: 5,
                instrumentos: 25,
                anosExperiencia: 4
            };
            setEstadisticas(estadisticasDefecto);
            setTimeout(() => {
                animarEstadisticasDirectamente(estadisticasDefecto);
            }, 100);
        }
    };

    // Animar contadores de estadísticas
    const animarEstadisticasDirectamente = (datos) => {
        console.log('🎬 Iniciando animación con datos:', datos);
        
        if (!datos || estadisticasAnimadas) return;
        
        const animateCounter = (elementId, targetValue) => {
            const element = document.getElementById(elementId);
            if (!element || targetValue === 0) {
                if (element) element.textContent = targetValue;
                return;
            }
            
            // Verificar que el elemento esté en la sección correcta
            const estadisticasSection = element.closest('.bg-azul-marino');
            if (!estadisticasSection) {
                console.warn(`Elemento ${elementId} no está en la sección de estadísticas`);
                return;
            }
            
            // Evitar animaciones duplicadas
            if (element.dataset.animating === 'true') {
                return;
            }
            element.dataset.animating = 'true';
            
            let currentValue = 0;
            const increment = Math.ceil(targetValue / 30);
            const duration = 2000;
            const stepTime = duration / (targetValue / increment);
            
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= targetValue) {
                    currentValue = targetValue;
                    clearInterval(timer);
                    element.dataset.animating = 'false';
                }
                
                // Verificar que el elemento siga existiendo
                if (element && element.isConnected) {
                    element.textContent = currentValue;
                } else {
                    clearInterval(timer);
                }
            }, stepTime);
        };
        
        // Asegurar que el DOM esté listo
        setTimeout(() => {
            animateCounter('counter-estudiantes', datos.estudiantes);
            animateCounter('counter-profesores', datos.profesores);
            animateCounter('counter-instrumentos', datos.instrumentos);
            animateCounter('counter-anos', datos.anosExperiencia);
            
            setEstadisticasAnimadas(true);
        }, 100);
    };

    // Formatear fecha de forma segura
    const formatearFecha = (fecha) => {
        if (!fecha) return 'Fecha no disponible';
        
        try {
            const date = new Date(fecha);
            
            if (isNaN(date.getTime())) {
                console.warn('Fecha inválida recibida:', fecha);
                return 'Fecha no disponible';
            }
            
            return date.toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error al formatear fecha:', fecha, error);
            return 'Fecha no disponible';
        }
    };

    // Navegación a equipo y contacto
    const irAEquipoContacto = useCallback((e) => {
        e.preventDefault();
        navigate('/equipo-contacto');
    }, [navigate]);

    // Navegación directa a contacto
    const irAContacto = useCallback((e) => {
        e.preventDefault();
        navigate('/equipo-contacto#contacto');
    }, [navigate]);

    // Navegación al detalle de noticia
    const irANoticiaDetalle = useCallback((slug) => {
        console.log('🔗 Navegando a noticia:', slug);
        navigate(`/noticia/${slug}`);
    }, [navigate]);

    // Cargar datos al montar componente
    useEffect(() => {
        cargarNoticias();
        cargarEventos();
        cargarEstadisticas();
        cargarNoticiasDestacadas();
        
        setVH();
        
        setTimeout(() => {
            initAllAnimations();
        }, 100);
        
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
        
        return () => {
            window.removeEventListener('resize', setVH);
            window.removeEventListener('orientationchange', setVH);
        };
    }, []);

    // Animar estadísticas cuando se cargan
    useEffect(() => {
        if ((estadisticas.estudiantes > 0 || estadisticas.profesores > 0 || estadisticas.instrumentos > 0) && !estadisticasAnimadas) {
            const timer = setTimeout(() => {
                // Verificar que no haya animaciones en curso
                const contadores = document.querySelectorAll('#counter-estudiantes, #counter-profesores, #counter-instrumentos, #counter-anos');
                const hayAnimacionEnCurso = Array.from(contadores).some(counter => 
                    counter.dataset.animating === 'true'
                );
                
                if (!hayAnimacionEnCurso) {
                    animarEstadisticasDirectamente(estadisticas);
                }
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [estadisticas, estadisticasAnimadas]);

    // Aplicar clase al body
    useEffect(() => {
        document.body.className = 'vista-publica_body';
        
        return () => {
            document.body.className = '';
        };
    }, []);

    return (
        <div className="vista-publica">
            {/* Hero principal con imagen de fondo */}
            <header className="seccion-hero" style={{backgroundImage: `url(${images.OrquestaFondo})`}}>
                <div className="hero-overlay"></div>
                <Container>
                    <Row className="align-items-center min-vh-100">
                        <Col lg={8}>
                            <div className="hero-content">
                                <div className="logo-container mb-4 fade-in-up">
                                    <img src={images.Logo} alt="Logo Orquesta" className="logo-hero-blanco logo-white" />
                                </div>
                                <h1 className="display-3 fw-bold text-white mb-4 hero-title-animate">
                                    Orquesta Juvenil de Cobquecura
                                </h1>
                                <p className="lead text-white mb-4 fs-4 hero-subtitle-animate">
                                    Formando jóvenes talentos musicales en el corazón de la Región del Ñuble
                                </p>
                            </div>
                        </Col>
                        <Col lg={4}>
                            <div className="hero-side-content text-center slide-in-right">
                                <div className="acceso-card">
                                    <h4 className="text-white mb-4">
                                        <i className="fas fa-graduation-cap me-2"></i>
                                        Portal de Acceso
                                    </h4>
                                    <Button 
                                        variant="light" 
                                        size="lg"
                                        onClick={() => navigate('/iniciar-sesion')}
                                        className="btn-acceso w-100 mb-3"
                                    >
                                        <i className="fas fa-sign-in-alt me-2"></i>
                                        Estudiantes/Profesores
                                    </Button>
                                    
                                    <Button 
                                        variant="outline-light" 
                                        size="md"
                                        onClick={irAContacto}
                                        className="btn-contacto-small w-100"
                                    >
                                        <i className="fas fa-envelope me-2"></i>
                                        Contacto
                                    </Button>
                                    
                                    <p className="text-white-50 mt-3 small">
                                        Accede a tu portal personalizado
                                    </p>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </header>

            {/* Barra de estadísticas animadas */}
            <section className="py-4 bg-azul-marino">
                <Container>
                    <Row className="text-center text-white">
                        <Col md={3}>
                            <div className="stat-item">
                                <h2 className="fw-bold counter-animate" id="counter-estudiantes">0</h2>
                                <p className="mb-0">Estudiantes</p>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="stat-item">
                                <h2 className="fw-bold counter-animate" id="counter-profesores">0</h2>
                                <p className="mb-0">Profesores</p>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="stat-item">
                                <h2 className="fw-bold counter-animate" id="counter-anos">4</h2>
                                <p className="mb-0">Años de Historia</p>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="stat-item">
                                <h2 className="fw-bold counter-animate" id="counter-instrumentos">0</h2>
                                <p className="mb-0">Instrumentos</p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Sección de noticias y contenido lateral */}
            <section className="py-5 seccion-noticias">
                <Container>
                    <Row>
                        <Col lg={8}>
                            <h2 className="mb-4 text-azul-marino fade-in-up">
                                <i className="fas fa-newspaper me-3"></i>
                                Últimas Noticias
                            </h2>
                            
                            <section className="noticias-section">
                                <div className="container">
                                    {loadingNoticias ? (
                                        <div className="loading-estatico">
                                            <div className="loading-dots">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                            <p>Cargando noticias...</p>
                                        </div>
                                    ) : noticias.length > 0 ? (
                                        <div className="noticias-grid">
                                            {noticias.map((noticia, index) => (
                                                <div key={noticia.id_noticia || noticia._id || index} 
                                                     className="noticia-card fade-in-up" 
                                                     style={{animationDelay: `${index * 0.2}s`}}>
                                                    
                                                    <div className="noticia-header d-flex justify-content-between align-items-center mb-3">
                                                        <div className="noticia-fecha">
                                                            <i className="fas fa-clock me-2"></i>
                                                            {formatearFecha(noticia.fecha_publicacion || noticia.fechaCreacion)}
                                                        </div>
                                                        <div className="noticia-badges">
                                                            {noticia.categoria && (
                                                                <span className="badge bg-primary me-2">
                                                                    {noticia.categoria}
                                                                </span>
                                                            )}
                                                            {/* Verificar si es destacada */}
                                                            {!!noticia.destacado && noticia.destacado !== 0 && (
                                                                <span className="badge bg-warning">
                                                                    <i className="fas fa-star me-1"></i>
                                                                    Destacada
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Imagen de la noticia solo si existe y es válida */}
                                                    {noticia.imagen_principal && 
                                                     noticia.imagen_principal.trim() !== '' && 
                                                     noticia.imagen_principal !== 'null' && 
                                                     noticia.imagen_principal !== null && (
                                                        <div className="noticia-imagen mb-3">
                                                            <img 
                                                                src={noticia.imagen_principal.startsWith('http') 
                                                                    ? noticia.imagen_principal 
                                                                    : `http://localhost:5000${noticia.imagen_principal}`
                                                                } 
                                                                alt={noticia.titulo}
                                                                className="img-fluid rounded"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '200px',
                                                                    objectFit: 'cover',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => irANoticiaDetalle(noticia.slug)}
                                                                onError={(e) => {
                                                                    console.error('❌ Error cargando imagen:', noticia.imagen_principal);
                                                                    // Ocultar completamente el contenedor de imagen si falla
                                                                    e.target.closest('.noticia-imagen').style.display = 'none';
                                                                }}
                                                                onLoad={() => {
                                                                    console.log('✅ Imagen cargada correctamente:', noticia.imagen_principal);
                                                                }}
                                                            />
                                                        </div>
                                                    )}

                                                    <h3 
                                                        className="noticia-titulo" 
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => irANoticiaDetalle(noticia.slug)}
                                                    >
                                                        {noticia.titulo}
                                                    </h3>
                                                    
                                                    {noticia.autor && (
                                                        <div className="noticia-autor mb-2">
                                                            <small className="text-muted">
                                                                <i className="fas fa-user me-1"></i>
                                                                Por: {noticia.autor}
                                                            </small>
                                                        </div>
                                                    )}

                                                    <ContenidoExpandible maxLines={4}>
                                                        <p>{noticia.contenido_vista || noticia.contenido}</p>
                                                    </ContenidoExpandible>

                                                    <div className="noticia-actions mt-3">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => irANoticiaDetalle(noticia.slug)}
                                                            className="btn-leer-completo"
                                                        >
                                                            <i className="fas fa-book-open me-2"></i>
                                                            Leer artículo completo
                                                            <i className="fas fa-arrow-right ms-2"></i>
                                                        </Button>
                                                        
                                                        {/* Mostrar vistas solo si existen */}
                                                        {noticia.vistas && noticia.vistas > 0 && (
                                                            <small className="text-muted ms-3">
                                                                <i className="fas fa-eye me-1"></i>
                                                                {noticia.vistas} vistas
                                                            </small>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="alert alert-info text-center">
                                            <i className="fas fa-info-circle me-2"></i>
                                            No hay noticias disponibles en este momento.
                                        </div>
                                    )}

                                    {noticias.length > 0 && (
                                        <div className="text-center mt-4">
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={() => navigate('/noticias')}
                                                className="btn-ver-todas"
                                            >
                                                <i className="fas fa-newspaper me-2"></i>
                                                Ver todas las noticias
                                                <i className="fas fa-arrow-right ms-2"></i>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </Col>

                        <Col lg={4}>
                            {/* Redes Sociales */}
                            <Card className="mb-4 shadow-sm card-animate">
                                <Card.Header className="bg-azul-marino text-white">
                                    <i className="fas fa-share-alt me-2"></i>
                                    Nuestras Redes Sociales
                                </Card.Header>
                                <Card.Body className="text-center">
                                    <div className="d-grid gap-3">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            href="https://www.facebook.com/profile.php?id=100075974382566"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="boton-social boton-facebook"
                                        >
                                            <i className="fab fa-facebook-f me-2"></i>
                                            Síguenos en Facebook
                                        </Button>
                                        
                                        <Button
                                            variant="danger"
                                            size="lg"
                                            href="https://www.instagram.com/orquesta.de.cobquecura/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="boton-social boton-instagram"
                                        >
                                            <i className="fab fa-instagram me-2"></i>
                                            Síguenos en Instagram
                                        </Button>
                                    </div>
                                    
                                    <hr className="my-4" />
                                    
                                    <p className="text-muted mb-0">
                                        <i className="fas fa-heart text-danger me-1"></i>
                                        ¡Mantente conectado con todas nuestras actividades!
                                    </p>
                                </Card.Body>
                            </Card>

                            {/* Próximos Eventos */}
                            <Card className="shadow-sm card-animate">
                                <Card.Header className="bg-warning text-dark">
                                    <i className="fas fa-calendar-alt me-2"></i>
                                    Próximos Eventos
                                </Card.Header>
                                <Card.Body>
                                    <section className="eventos-section">
                                        <div className="container">
                                            {loadingEventos ? (
                                                <div className="loading-estatico">
                                                    <div className="loading-dots">
                                                        <span></span>
                                                        <span></span>
                                                        <span></span>
                                                    </div>
                                                    <p>Cargando eventos...</p>
                                                </div>
                                            ) : eventos.length > 0 ? (
                                                <div className="eventos-grid">
                                                    {eventos.map((evento, index) => (
                                                        <div key={evento.id_evento || index} 
                                                             className="evento-card fade-in-up" 
                                                             style={{animationDelay: `${index * 0.2}s`}}>
                                                            <div className="evento-fecha">
                                                                <i className="fas fa-calendar-alt me-2"></i>
                                                                {formatearFecha(evento.fecha)}
                                                            </div>
                                                            <h4>{evento.nombre}</h4>
                                                            
                                                            <ContenidoExpandible maxLines={3}>
                                                                <p>{evento.descripcion}</p>
                                                            </ContenidoExpandible>
                                                            
                                                            {evento.lugar && (
                                                                <div className="evento-lugar">
                                                                    <i className="fas fa-map-marker-alt me-2"></i>
                                                                    {evento.lugar}
                                                                </div>
                                                            )}
                                                            
                                                            {evento.hora_inicio && (
                                                                <div className="evento-hora">
                                                                    <i className="fas fa-clock me-2"></i>
                                                                    {evento.hora_inicio}
                                                                    {evento.hora_fin && ` - ${evento.hora_fin}`}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="alert alert-info text-center">
                                                    <i className="fas fa-info-circle me-2"></i>
                                                    No hay eventos programados en este momento.
                                                </div>
                                            )}
                                            
                                            {/* Botón Ver todos los eventos */}
                                            <div className="text-center mt-4">
                                                <Button 
                                                    variant="primary"
                                                    onClick={() => navigate('/eventos')}
                                                    className="btn-ver-todas"
                                                >
                                                    <i className="fas fa-calendar-alt me-2"></i>
                                                    Ver todos los eventos
                                                    <i className="fas fa-arrow-right ms-2"></i>
                                                </Button>
                                            </div>
                                        </div>
                                    </section>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Sección Sobre Nosotros */}
            <section className="py-5 bg-azul-marino text-white parallax-section">
                <Container>
                    <Row className="align-items-center">
                        <Col lg={6}>
                            <div className="fade-in-up">
                                <h2 className="mb-4">
                                    <i className="fas fa-users me-3"></i>
                                    Sobre Nosotros
                                </h2>
                                <p className="lead mb-4">
                                    La Orquesta Juvenil de Cobquecura es una institución dedicada a la formación 
                                    musical integral de jóvenes de la comuna y la región.
                                </p>
                                <p className="lead mb-4">
                                    Con 4 años de historia, hemos trabajado para brindar educación musical de calidad, 
                                    fomentando valores como la disciplina, el trabajo en equipo y el amor por las artes.
                                </p>
                                <Button 
                                    variant="light" 
                                    size="lg" 
                                    onClick={irAEquipoContacto}
                                >
                                    <i className="fas fa-info-circle me-2"></i>
                                    Conoce más sobre nosotros
                                </Button>
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="imagen-nosotros p-4 text-center slide-in-right">
                                <img src={images.LogoColor} alt="Logo Orquesta" className="logo-sobre-nosotros mb-4" />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Footer */}
            <footer className="bg-azul-marino text-white py-3">
                <Container>
                    <Row className="justify-content-center align-items-center">
                        <Col md={12} className="text-center mb-2">
                            <div className="d-flex justify-content-center align-items-center flex-wrap">
                                <img src={images.Logo} alt="Logo Orquesta" className="logo-footer logo-orquesta-footer" />
                                <img src={images.LogoMunicipal} alt="Logo Municipal" className="logo-footer logo-municipal-footer" />
                                <img src={images.LogoFoji} alt="Logo FOJI" className="logo-footer logo-foji-footer" />
                            </div>
                        </Col>
                        <Col md={12} className="text-center">
                            <p className="mb-1 small">&copy; 2025 Orquesta Juvenil de Cobquecura. Todos los derechos reservados.</p>
                            <small className="text-light opacity-75">
                                Fomentando la música y cultura en nuestra comunidad
                            </small>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </div>
    );
};

export default VistaPublica;