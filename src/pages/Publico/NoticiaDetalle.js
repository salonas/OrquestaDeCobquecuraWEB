import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ModalPortal from '../../components/ModalPortal';
import { useAlert } from '../../components/providers/AlertProvider';
import './NoticiaDetalle.css';

const NoticiaDetalle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { showSuccess } = useAlert();
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Control de vistas
  const vistaContabilizada = useRef(false);
  const tiempoInicioVisita = useRef(Date.now());
  
  const [modalGaleriaAbierto, setModalGaleriaAbierto] = useState(false);
  const [imagenActual, setImagenActual] = useState(0);
  const [todasLasImagenes, setTodasLasImagenes] = useState([]);
  const [galeriaExpandida, setGaleriaExpandida] = useState(false);

  // Estados para zoom y drag
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [fitMode, setFitMode] = useState('contain'); // contain, cover, fill, actual
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Detectar tipo de archivo por extensión
  const obtenerTipoArchivo = (url) => {
    if (!url) return 'imagen';
    
    const urlLimpia = url.split('?')[0];
    const extension = urlLimpia.split('.').pop().toLowerCase();
    
    if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension)) {
      return 'video';
    } else if (['gif'].includes(extension)) {
      return 'gif';
    } else if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extension)) {
      return 'imagen';
    }
    
    return 'imagen';
  };

  // Componente para mostrar medios con manejo de errores
  const VistaPreviewMedia = React.forwardRef(({ src, alt, tipo, style, className, onMouseDown }, ref) => {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      setError(false);
      setLoading(true);
    }, [src]);
    
    // Formatear URL del archivo
    const formatearUrl = (url) => {
      if (!url) return '';
      
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      try {
        const partes = url.split('/');
        const partesCodec = partes.map((parte, index) => {
          if (parte === '' || index === 0) return parte;
          
          if (parte.includes('🇳') || parte.includes('@') || parte.includes('•')) {
            return encodeURIComponent(parte);
          }
          
          return encodeURIComponent(parte);
        });
        
        return `http://localhost:5000${partesCodec.join('/')}`;
        
      } catch (error) {
        return `http://localhost:5000${url}`;
      }
    };
    
    const urlFormateada = formatearUrl(src);
    
    // Mostrar error si no se puede cargar
    if (error || !src) {
      return (
        <div 
          className={`d-flex align-items-center justify-content-center bg-light text-muted ${className || ''}`}
          style={style}
          ref={ref}
        >
          <div className="text-center p-3">
            <i className="fas fa-exclamation-triangle fa-2x mb-2 text-warning"></i>
            <br />
            <small className="text-danger">Error cargando archivo</small>
            <br />
            <small className="text-muted" style={{ fontSize: '0.6rem' }}>
              {src ? 'Archivo temporal no disponible' : 'Sin archivo'}
            </small>
            {src && (
              <div className="mt-2">
                <small className="text-muted" style={{ fontSize: '0.5rem', wordBreak: 'break-all' }}>
                  {alt || 'Sin descripción'}
                </small>
              </div>
            )}
            <div className="mt-2">
              <small className="text-info" style={{ fontSize: '0.5rem' }}>
                💡 Los archivos temporales requieren implementación de upload
              </small>
            </div>
          </div>
        </div>
      );
    }
    
    const handleLoad = () => {
      setLoading(false);
      setError(false);
    };
    
    const handleError = (e) => {
      console.error('❌ Error cargando media:', e);
      setError(true);
      setLoading(false);
    };
    
    return (
      <div className="position-relative">
        {loading && (
          <div 
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light"
            style={{ zIndex: 1 }}
          >
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}
        
        {tipo === 'video' ? (
          <video
            ref={ref}
            src={urlFormateada}
            className={className}
            style={style}
            controls
            muted
            preload="metadata"
            onLoadStart={handleLoad}
            onError={handleError}
            onCanPlay={handleLoad}
            onMouseDown={onMouseDown}
          >
            <div className="text-center p-3">
              <i className="fas fa-video text-muted"></i>
              <br />
              <small>Tu navegador no soporta video HTML5</small>
            </div>
          </video>
        ) : (
          <img
            ref={ref}
            src={urlFormateada}
            alt={alt}
            className={className}
            style={style}
            onLoad={handleLoad}
            onError={handleError}
            onMouseDown={onMouseDown}
            loading="lazy"
          />
        )}
      </div>
    );
  });
  // Funciones para zoom y drag
  const resetImageTransform = useCallback(() => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    setFitMode('contain');
  }, []);

  const zoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.5, 5);
    setZoomLevel(newZoom);
    if (newZoom > 1) {
      setFitMode('zoom');
    }
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.5, 0.1);
    setZoomLevel(newZoom);
    if (newZoom <= 1) {
      setImagePosition({ x: 0, y: 0 });
      setFitMode('contain');
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    setFitMode('contain');
  };

  const toggleFullscreen = () => {
    // Obtener la imagen actual en lugar del modal completo
    const imagen = imageRef.current;
    if (!imagen) return;

    if (!document.fullscreenElement) {
      // Entrar en pantalla completa solo con la imagen
      imagen.requestFullscreen?.() || 
      imagen.webkitRequestFullscreen?.() || 
      imagen.mozRequestFullScreen?.();
    } else {
      // Salir de pantalla completa
      document.exitFullscreen?.() || 
      document.webkitExitFullscreen?.() || 
      document.mozCancelFullScreen?.();
    }
  };

  const changeFitMode = (mode) => {
    setFitMode(mode);
    if (mode !== 'zoom') {
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  // Manejo del drag
  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    });
    
    if (containerRef.current) {
      containerRef.current.classList.add('dragging');
    }
  };
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || zoomLevel <= 1) return;
    
    e.preventDefault();
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Limitar el drag a los bordes de la imagen
    const container = containerRef.current;
    const image = imageRef.current;
    
    if (container && image) {
      const containerRect = container.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      
      const maxX = Math.max(0, (imageRect.width * zoomLevel - containerRect.width) / 2);
      const maxY = Math.max(0, (imageRect.height * zoomLevel - containerRect.height) / 2);
      
      setImagePosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY))
      });
    }
  }, [isDragging, zoomLevel, dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.classList.remove('dragging');
    }
  }, []);

  // Manejo de rueda del mouse para zoom
  const handleWheel = (e) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta));
    
    setZoomLevel(newZoom);
    
    if (newZoom > 1) {
      setFitMode('zoom');
    } else {
      setImagePosition({ x: 0, y: 0 });
      setFitMode('contain');
    }
  };

  // Calcular estilos de imagen
  const getImageStyles = () => {
    let objectFit = 'contain';
    let transform = `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`;
    
    switch (fitMode) {
      case 'cover':
        objectFit = 'cover';
        break;
      case 'fill':
        objectFit = 'fill';
        break;
      case 'actual':
        objectFit = 'none';
        break;
      case 'zoom':
        objectFit = 'contain';
        break;
      default:
        objectFit = 'contain';
    }
    
    return {
      objectFit,
      transform,
      maxWidth: fitMode === 'actual' ? 'none' : '100%',
      maxHeight: fitMode === 'actual' ? 'none' : '100%',
      width: fitMode === 'fill' ? '100%' : 'auto',
      height: fitMode === 'fill' ? '100%' : 'auto'
    };
  };

  // Reset zoom cuando cambia la imagen
  useEffect(() => {
    resetImageTransform();
  }, [imagenActual]);
  // Event listeners para drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  // Contabilizar vista con throttling
  const contabilizarVista = useCallback(async (noticiaId) => {
    if (vistaContabilizada.current) {
      return;
    }
    
    // Verificar tiempo mínimo de visita
    const tiempoTranscurrido = Date.now() - tiempoInicioVisita.current;
    if (tiempoTranscurrido < 2000) {
      return;
    }
    
    vistaContabilizada.current = true;
    
    try {
      const response = await fetch(`http://localhost:5000/api/noticias/${slug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Incrementar-Vista': 'true'
        }
      });
      
      if (!response.ok) {
        vistaContabilizada.current = false;
      }
    } catch (error) {
      vistaContabilizada.current = false;
    }
  }, [slug]);
  // Cargar datos de la noticia
  const cargarNoticia = useCallback(async (incrementarVista = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = `http://localhost:5000/api/noticias/${slug}`;
      const headers = incrementarVista ? { 'X-Incrementar-Vista': 'true' } : {};

      const response = await fetch(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        
        if (!data || !data.titulo) {
          throw new Error('Datos de noticia inválidos');
        }
        
        // Cargar imágenes por separado
        try {
          const imagenesResponse = await fetch(`http://localhost:5000/api/noticias/${data.id_noticia}/imagenes`);
          
          if (imagenesResponse.ok) {
            const imagenesData = await imagenesResponse.json();
            
            if (imagenesData.success && imagenesData.imagenes) {
              // Formatear URLs de imágenes
              const imagenesFormateadas = imagenesData.imagenes.map(img => ({
                ...img,
                imagen_url: img.imagen_url?.startsWith('http') 
                  ? img.imagen_url 
                  : `http://localhost:5000${img.imagen_url}`
              }));
              
              data.imagenes = imagenesFormateadas;
            }
          }
        } catch (imgError) {
          console.error('Error cargando imágenes:', imgError);
        }
        
        if (!data.imagenes) {
          data.imagenes = [];
        }
        
        setNoticia(data);
        
        // Preparar medios para modal
        const medios = [];
        
        // Agregar imagen principal
        if (data.imagen_principal && data.imagen_principal.trim()) {
          const imagenPrincipalUrl = data.imagen_principal.startsWith('http') 
            ? data.imagen_principal 
            : `http://localhost:5000${data.imagen_principal}`;
            
          const tipoImgPrincipal = obtenerTipoArchivo(data.imagen_principal);
          medios.push({
            url: imagenPrincipalUrl,
            titulo: 'Imagen Principal',
            alt: data.titulo,
            esPrincipal: true,
            tipo: tipoImgPrincipal
          });
        }
        
        // Agregar medios de galería
        if (data.imagenes && Array.isArray(data.imagenes) && data.imagenes.length > 0) {
          data.imagenes
            .filter(img => {
              const tieneUrl = img.imagen_url && img.imagen_url.trim();
              const noEsPrincipal = !img.es_principal;
              return tieneUrl && noEsPrincipal;
            })
            .forEach((img, index) => {
              const urlCompleta = img.imagen_url;
              const tipoArchivo = img.tipo_archivo || obtenerTipoArchivo(img.imagen_url);
              
              medios.push({
                url: urlCompleta,
                titulo: img.imagen_alt || `Media ${index + 1}`,
                alt: img.imagen_alt || `Media ${index + 1}`,
                esPrincipal: false,
                tipo: tipoArchivo,
                id: img.id_imagen || img.id
              });
            });
        }
        
        setTodasLasImagenes(medios);
        setError(null);
      } else if (response.status === 404) {
        setError('Noticia no encontrada');
      } else if (response.status === 500) {
        setError('Error temporal del servidor. Intenta recargar la página.');
        if (incrementarVista) {
          vistaContabilizada.current = false;
        }
      } else {
        setError('Error cargando la noticia');
      }
    } catch (error) {
      if (error.message.includes('fetch')) {
        setError('Error de conexión con el servidor');
      } else if (error.message.includes('inválidos')) {
        setError('Error en los datos recibidos del servidor');
      } else {
        setError('Error inesperado. Intenta recargar la página.');
      }
      
      if (incrementarVista) {
        vistaContabilizada.current = false;
      }    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Funciones para el modal de galería
  const abrirModalGaleria = (indiceImagen = 0) => {
    setImagenActual(indiceImagen);
    setModalGaleriaAbierto(true);
    resetImageTransform();
  };
  const irAImagen = useCallback((nuevoIndice) => {
    setImagenActual(nuevoIndice);
    resetImageTransform();
    
    // Auto-scroll para mostrar la miniatura seleccionada
    setTimeout(() => {
      const thumbnail = document.querySelector(`.fandom-thumbnail[data-index="${nuevoIndice}"]`);
      if (thumbnail) {
        thumbnail.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center' 
        });
      }
    }, 100);
  }, [resetImageTransform]);
  const imagenSiguiente = useCallback(() => {
    const siguienteIndice = (imagenActual + 1) % todasLasImagenes.length;
    irAImagen(siguienteIndice);
  }, [imagenActual, todasLasImagenes.length, irAImagen]);

  const imagenAnterior = useCallback(() => {
    const anteriorIndice = imagenActual === 0 ? todasLasImagenes.length - 1 : imagenActual - 1;
    irAImagen(anteriorIndice);
  }, [imagenActual, todasLasImagenes.length, irAImagen]);

  const cerrarModalGaleria = useCallback(() => {
    setModalGaleriaAbierto(false);
    resetImageTransform();
  }, [resetImageTransform]);
  // Carga inicial de la noticia
  useEffect(() => {
    if (slug) {
      vistaContabilizada.current = false;
      tiempoInicioVisita.current = Date.now();
      cargarNoticia(false);
    }
  }, [slug, cargarNoticia]);

  // Incrementar vista después de cargar
  useEffect(() => {
    if (noticia && 
        noticia.id_noticia && 
        !vistaContabilizada.current) {
      
      const timer = setTimeout(() => {
        contabilizarVista(noticia.id_noticia);
      }, 3000);        return () => clearTimeout(timer);
    }
  }, [noticia, contabilizarVista]);

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      vistaContabilizada.current = false;
    };
  }, []);

  // Manejo de teclas del teclado en modal
  useEffect(() => {
    const manejarTecla = (e) => {
      if (!modalGaleriaAbierto) return;      
      switch (e.key) {
        case 'ArrowLeft':
          imagenAnterior();
          break;
        case 'ArrowRight':
          imagenSiguiente();
          break;
        case 'Escape':
          cerrarModalGaleria();
          break;
        default:
          // No hacer nada para otras teclas
          break;
      }
    };    document.addEventListener('keydown', manejarTecla);
    return () => document.removeEventListener('keydown', manejarTecla);
  }, [modalGaleriaAbierto, imagenActual, imagenAnterior, imagenSiguiente, cerrarModalGaleria]);

  // Formatear fecha completa
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear fecha corta
  const formatearFechaCorta = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Funciones de navegación
  const volverAtras = () => {
    navigate('/noticias');
  };

  const irAInicio = () => {
    navigate('/');
  };

  const irATodasLasNoticias = () => {
    navigate('/noticias');
  };

  const toggleGaleria = () => {
    setGaleriaExpandida(!galeriaExpandida);
  };

  const irANoticiasPorCategoria = (categoria) => {
    navigate('/noticias', { 
      state: { 
        filtroInicial: { 
          categoria: categoria 
        } 
      } 
    });
  };

  // Aplicar clase al body para el fondo
  useEffect(() => {
    document.body.classList.add('vista-noticia-detalle-body');
    return () => {
      document.body.classList.remove('vista-noticia-detalle-body');
    };
  }, []);

  // Descargar imagen actual del modal
  const descargarImagen = async () => {
    try {
      const mediaActual = todasLasImagenes[imagenActual];
      if (!mediaActual) return;

      const response = await fetch(mediaActual.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const extension = mediaActual.tipo === 'video' ? 'mp4' : 
                      mediaActual.tipo === 'gif' ? 'gif' : 'jpg';
      
      const link = document.createElement('a');
      link.href = url;
      link.download = mediaActual.titulo 
        ? `${mediaActual.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`
        : `media_${imagenActual + 1}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
    }
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-estatico">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="mt-3 text-muted">Cargando noticia...</p>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="noticia-detalle">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="admin-section text-center">
                <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h2 className="text-muted mb-3">{error}</h2>
                <p className="text-muted mb-4">
                  La noticia que buscas no está disponible o ha sido eliminada.
                </p>
                <div className="d-flex gap-3 justify-content-center">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={volverAtras}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Volver
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={irAInicio}
                  >
                    <i className="fas fa-home me-2"></i>
                    Ir al Inicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!noticia) {
    return null;
  }

  // Filtrar medios de galería (no principales)
  const mediosGaleria = noticia.imagenes 
    ? noticia.imagenes.filter(img => img.imagen_url && img.imagen_url.trim() && !img.es_principal)
    : [];

  return (
    <div className="noticia-detalle admin-panel-container">
      <div className="container">
        {/* Breadcrumb de navegación */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb admin-breadcrumb">
            <li className="breadcrumb-item">
              <button 
                className="btn btn-link p-0" 
                onClick={irAInicio}
              >
                <i className="fas fa-home me-1"></i>
                Inicio
              </button>
            </li>
            <li className="breadcrumb-item">
              <button 
                className="btn btn-link p-0" 
                onClick={irATodasLasNoticias}
              >
                Noticias
              </button>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {noticia?.titulo || 'Cargando...'}
            </li>
          </ol>
        </nav>

        {/* Botón volver */}
        <button 
          className="btn btn-secondary mb-4"
          onClick={volverAtras}
        >
          <i className="fas fa-arrow-left me-2"></i>
          Volver
        </button>

        {/* Tarjeta principal de la noticia */}
        <div className="admin-section">
          {/* Banner principal clickeable */}
          {noticia.imagen_principal && noticia.imagen_principal.trim() && (
            <div 
              className="noticia-banner admin-banner"
              onClick={() => abrirModalGaleria(0)}
            >
              <VistaPreviewMedia
                src={noticia.imagen_principal}
                alt={noticia.titulo}
                tipo={obtenerTipoArchivo(noticia.imagen_principal)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="banner-overlay">
                <i className="fas fa-expand-alt"></i>
                <span>Hacer clic para ver en grande</span>
              </div>
            </div>
          )}

          {/* Header con título y metadatos */}
          <div className="admin-header">
            <div>
              <h2 className="admin-titulo">{noticia.titulo}</h2>              <div className="admin-meta mb-3">
                <div className="d-flex flex-wrap align-items-center gap-3">                  <div className="noticia-badges">
                    <span 
                      className="badge bg-primary categoria-clickeable me-2"
                      onClick={() => irANoticiasPorCategoria(noticia.categoria)}
                      style={{ cursor: 'pointer' }}
                      title={`Ver todas las noticias de ${noticia.categoria}`}
                    >
                      <i className="fas fa-tag me-1"></i>
                      {noticia.categoria}
                    </span>
                    
                    {(noticia.destacado === true || noticia.destacado === 1) && (
                      <span className="badge bg-warning">
                        <i className="fas fa-star me-1"></i>
                        Destacada
                      </span>
                    )}
                  </div>
                  <span className="admin-info">
                    <i className="fas fa-calendar me-1"></i>
                    {formatearFecha(noticia.fecha_publicacion)}
                  </span>
                  <span className="admin-info">
                    <i className="fas fa-user me-1"></i>
                    {noticia.autor}
                  </span>
                  <span className="admin-info">
                    <i className="fas fa-eye me-1"></i>
                    {noticia.vistas || 0} {(noticia.vistas || 0) === 1 ? 'vista' : 'vistas'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de la noticia */}
          {noticia.resumen && (
            <div className="admin-resumen">
              <i className="fas fa-quote-left"></i>
              <p>{noticia.resumen}</p>
            </div>
          )}

          {/* Contenido principal */}
          <div className="admin-contenido">
            {noticia.contenido.split('\n').map((parrafo, index) => (
              parrafo.trim() && (
                <p key={index} className="mb-3">
                  {parrafo.trim()}
                </p>
              )
            ))}
          </div>

          {/* Galería multimedia colapsable */}
          {mediosGaleria.length > 0 && (
            <div className="admin-galeria mt-4">
              <div 
                className="admin-galeria-header"
                onClick={toggleGaleria}
                style={{ cursor: 'pointer' }}
              >
                <h5 className="admin-subtitle mb-0">
                  <i className="fas fa-photo-video me-2"></i>
                  Galería multimedia ({mediosGaleria.length})
                </h5>
                <div className="admin-galeria-toggle">
                  <i className={`fas ${galeriaExpandida ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  <span className="ms-2">
                    {galeriaExpandida ? 'Ocultar galería' : 'Mostrar galería'}
                  </span>
                </div>
              </div>
              
              <div className={`admin-galeria-contenido ${galeriaExpandida ? 'expandida' : 'colapsada'}`}>
                <div className="row g-3 mt-2">
                  {mediosGaleria.map((media, index) => {
                    const urlCompleta = media.imagen_url.startsWith('http') 
                      ? media.imagen_url 
                      : `http://localhost:5000${media.imagen_url}`;
                    
                    const tipoArchivo = obtenerTipoArchivo(media.imagen_url);
                    
                    // Encontrar índice en modal
                    const indiceEnModal = todasLasImagenes.findIndex(img => 
                      img.url === urlCompleta && !img.esPrincipal
                    );
                    
                    return (
                      <div key={media.id_imagen || index} className="col-md-6 col-lg-4">
                        <div 
                          className="admin-imagen-item"
                          onClick={() => abrirModalGaleria(indiceEnModal >= 0 ? indiceEnModal : index + 1)}
                        >
                          <div style={{ position: 'relative' }}>
                            <VistaPreviewMedia
                              src={urlCompleta}
                              alt={media.imagen_alt || `Media ${index + 1}`}
                              tipo={tipoArchivo}
                              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                            />
                            
                            {/* Indicador de tipo de archivo */}
                            <div 
                              className="position-absolute top-0 end-0 m-2"
                              style={{ 
                                backgroundColor: 'rgba(0,0,0,0.7)', 
                                borderRadius: '4px', 
                                padding: '4px 8px',
                                zIndex: 2
                              }}
                            >
                              <small className="text-white">
                                {tipoArchivo === 'gif' && <i className="fas fa-play-circle"></i>}
                                {tipoArchivo === 'video' && <i className="fas fa-video"></i>}
                                {tipoArchivo === 'imagen' && <i className="fas fa-image"></i>}
                              </small>
                            </div>
                          </div>
                          
                          <div className="admin-imagen-overlay">
                            <i className="fas fa-search-plus"></i>
                            <span>Ver {tipoArchivo === 'video' ? 'video' : 'imagen'} completa</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer con acciones */}
          <div className="admin-footer mt-5 pt-4">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="admin-info">
                  <i className="fas fa-clock me-1"></i>
                  Publicado el {formatearFechaCorta(noticia.fecha_publicacion)}
                </div>
              </div>
              <div className="col-md-6 text-end">
                <button 
                  className="btn btn-secondary btn-sm me-2"
                  onClick={() => window.print()}
                >
                  <i className="fas fa-print me-1"></i>
                  Imprimir
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: noticia.titulo,
                        text: noticia.resumen,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      showSuccess('Éxito', 'Enlace copiado al portapapeles');
                    }
                  }}
                >
                  <i className="fas fa-share-alt me-1"></i>
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="text-center mt-4">
          <button 
            className="btn btn-primary me-3"
            onClick={irAInicio}
          >
            <i className="fas fa-home me-2"></i>
            Volver al Inicio
          </button>
          <button 
            className="btn btn-secondary"
            onClick={volverAtras}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Volver Atrás
          </button>
        </div>
      </div>

      {/* Modal de galería multimedia */}
      <ModalPortal 
        isOpen={modalGaleriaAbierto} 
        onClose={cerrarModalGaleria}
        className="modal-galeria-fandom"
      >
        <div className="modal-content-flex">
          {/* Header del modal */}
          <div className="fandom-header">
            <h5 className="fandom-title">
              <i className="fas fa-photo-video"></i>
              Galería Multimedia
            </h5>
            <div className="fandom-controls">
              <div className="fandom-counter">
                {imagenActual + 1} DE {todasLasImagenes.length}
              </div>
              <button 
                className="fandom-download"
                onClick={descargarImagen}
                title="Descargar archivo en alta calidad"
              >
                <i className="fas fa-download"></i>
                Descargar
              </button>
              <button 
                className="fandom-close" 
                onClick={cerrarModalGaleria}
                title="Cerrar galería"
              >
                ×
              </button>
            </div>
          </div>

          {/* Área principal de visualización */}
          <div className="fandom-image-area">
            {/* Controles de ajuste */}
            <div className="fandom-fit-controls">
              <button 
                className={`fandom-fit-btn ${fitMode === 'contain' ? 'active' : ''}`}
                onClick={() => changeFitMode('contain')}
                title="Ajustar al contenedor"
              >
                Ajustar
              </button>
              <button 
                className={`fandom-fit-btn ${fitMode === 'cover' ? 'active' : ''}`}
                onClick={() => changeFitMode('cover')}
                title="Llenar contenedor"
              >
                Llenar
              </button>
              <button 
                className={`fandom-fit-btn ${fitMode === 'actual' ? 'active' : ''}`}
                onClick={() => changeFitMode('actual')}
                title="Tamaño real"
              >
                100%
              </button>
            </div>

            {/* Botón pantalla completa */}
            <button 
              className="fandom-fullscreen-btn"
              onClick={toggleFullscreen}
              title="Pantalla completa"
            >
              <i className="fas fa-expand"></i>
            </button>

            <div 
              ref={containerRef}
              className="fandom-image-container"
              onWheel={handleWheel}
            >
              {todasLasImagenes.length > 0 && todasLasImagenes[imagenActual] && (
                <VistaPreviewMedia
                  ref={imageRef}
                  src={todasLasImagenes[imagenActual].url}
                  alt={todasLasImagenes[imagenActual].alt || `Media ${imagenActual + 1}`}
                  tipo={todasLasImagenes[imagenActual].tipo}
                  className="fandom-main-image"
                  style={getImageStyles()}
                  onMouseDown={handleMouseDown}
                />
              )}
            </div>

            {/* Controles de zoom */}
            <div className="fandom-zoom-controls">
              <button 
                className="fandom-zoom-btn"
                onClick={zoomOut}
                disabled={zoomLevel <= 0.1}
                title="Alejar"
              >
                −
              </button>
              <div className="fandom-zoom-indicator">
                {Math.round(zoomLevel * 100)}%
              </div>
              <button 
                className="fandom-zoom-btn"
                onClick={zoomIn}
                disabled={zoomLevel >= 5}
                title="Acercar"
              >
                +
              </button>
              <button 
                className="fandom-zoom-btn"
                onClick={resetZoom}
                title="Restablecer zoom"
              >
                <i className="fas fa-undo" style={{ fontSize: '10px' }}></i>
              </button>
            </div>

            {/* Botones de navegación del modal */}
            {todasLasImagenes.length > 1 && (
              <>
                <button 
                  className="fandom-nav-button fandom-nav-prev"
                  onClick={imagenAnterior}
                  title="Media anterior"
                >
                  ‹
                </button>
                <button 
                  className="fandom-nav-button fandom-nav-next"
                  onClick={imagenSiguiente}
                  title="Media siguiente"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Footer con información y carrusel */}
          <div className="fandom-footer">
            {/* Información del archivo actual */}
            <div className="fandom-image-info">
              <p className="fandom-image-name">
                <i className={`fas fa-${todasLasImagenes[imagenActual]?.tipo === 'video' ? 'video' : 
                                todasLasImagenes[imagenActual]?.tipo === 'gif' ? 'play-circle' : 'image'} me-2`}></i>
                {todasLasImagenes[imagenActual]?.titulo || `${todasLasImagenes[imagenActual]?.tipo || 'archivo'}_${imagenActual + 1}`}
              </p>
            </div>

            {/* Carrusel de miniaturas */}
            {todasLasImagenes.length > 1 && (
              <div className="fandom-carousel">
                <div className="fandom-thumbnails">
                  {todasLasImagenes.map((media, index) => (
                    <div 
                      key={index}
                      data-index={index}
                      className={`fandom-thumbnail ${index === imagenActual ? 'active' : ''}`}
                      onClick={() => irAImagen(index)}
                      title={media.titulo || `${media.tipo} ${index + 1}`}
                    >
                      <VistaPreviewMedia
                        src={media.url}
                        alt={media.alt || `Miniatura ${index + 1}`}
                        tipo={media.tipo}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div className="fandom-thumbnail-number">{index + 1}</div>
                      
                      {/* Indicador de tipo en miniatura */}
                      <div className="fandom-thumbnail-type">
                        {media.tipo === 'video' && <i className="fas fa-video"></i>}
                        {media.tipo === 'gif' && <i className="fas fa-play-circle"></i>}
                        {media.tipo === 'imagen' && <i className="fas fa-image"></i>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalPortal>
    </div>
  );
};

export default NoticiaDetalle;