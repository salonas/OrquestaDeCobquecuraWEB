import React, { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import { useAlert } from '../../../components/providers/AlertProvider';
import ModalPortal from '../../../components/ModalPortal';

const Noticias = () => {
  // Hooks de alerta para usar shadcn/ui
  const { showConfirm, showSuccess, showError } = useAlert();
  
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [noticiaEditando, setNoticiaEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [filtros, setFiltros] = useState({
    titulo: '',
    autor: '',
    estado: '',
    fechaCreacion: '',
    fechaPublicacion: ''
  });

  useEffect(() => {
    cargarNoticias();
  }, []);

  // Cargar noticias desde la API
  const cargarNoticias = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/noticias', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setNoticias(data);
          console.log('Noticias cargadas:', data.length);
        } else {
          console.error('Formato de datos incorrecto:', data);
          setError('Formato de datos incorrecto del servidor');
          setNoticias([]);
        }
      } else {
        const errorText = await response.text();
        setError(`Error del servidor: ${response.status} - ${errorText}`);
        setNoticias([]);
      }
    } catch (error) {
      setError(`Error de conexión: ${error.message}`);
      setNoticias([]);
    } finally {
      setLoading(false);
    }
  };

  // Guardar noticia (crear o editar)
  const handleGuardar = async (noticiaData) => {
    setGuardando(true);
    try {
      console.log('Guardando noticia con datos:', noticiaData);
      
      const url = noticiaEditando 
        ? `http://localhost:5000/api/admin/noticias/${noticiaEditando.id_noticia}`
        : 'http://localhost:5000/api/admin/noticias';
      
      const method = noticiaEditando ? 'PUT' : 'POST';

      // Detectar si es FormData o JSON
      const isFormData = noticiaData instanceof FormData;
      console.log('Tipo de datos:', isFormData ? 'FormData' : 'JSON', 'Método:', method);
      
      // Configurar headers
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      // Debug de datos enviados
      if (isFormData) {
        console.log('Enviando FormData:');
        for (let [key, value] of noticiaData.entries()) {
          console.log(`  ${key}:`, value);
        }
      } else {
        console.log('Enviando JSON:', noticiaData);
      }

      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: isFormData ? noticiaData : JSON.stringify(noticiaData)
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (response.ok) {
        showSuccess(
          'Operación exitosa',
          noticiaEditando ? 'Noticia actualizada exitosamente' : 'Noticia creada exitosamente'
        );
        handleCancelar();
        cargarNoticias();
      } else {
        showError(
          'Error al guardar',
          data.error || 'Error guardando la noticia'
        );
      }
    } catch (error) {
      console.error('Error guardando noticia:', error);
      showError(
        'Error de conexión',
        'Error de conexión al guardar la noticia'
      );
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar noticia
  const handleEliminar = async (id) => {
    const confirmed = await showConfirm(
      '¿Estás seguro?',
      '¿Estás seguro de que quieres eliminar esta noticia? Esta acción no se puede deshacer.'
    );
    
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/admin/noticias/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showSuccess(
          'Eliminación exitosa',
          'Noticia eliminada exitosamente'
        );
        cargarNoticias();
      } else {
        const errorData = await response.json();
        showError(
          'Error al eliminar',
          `Error: ${errorData.error}`
        );
      }
    } catch (error) {
      showError(
        'Error de conexión',
        'Error al eliminar noticia'
      );
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  const handleEditar = (noticia) => {
    setNoticiaEditando(noticia);
    setMostrarFormulario(true);
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setNoticiaEditando(null);
  };

  const handleNuevaNoticia = () => {
    setNoticiaEditando(null);
    setMostrarFormulario(true);
  };

  // Cambiar estado de publicación
  const handleTogglePublicacion = async (id) => {
    try {
      const noticia = noticias.find(n => n.id_noticia === id);
      
      if (!noticia) return;

      const nuevaData = {
        ...noticia,
        publicada: !noticia.publicada
      };

      const response = await fetch(`http://localhost:5000/api/admin/noticias/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(nuevaData)
      });

      if (response.ok) {
        setMensaje('Estado de publicación actualizado');
        setTimeout(() => setMensaje(''), 3000);
        cargarNoticias();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error actualizando el estado de publicación');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      setError('Error de conexión al actualizar el estado de publicación');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Cambiar visibilidad
  const handleToggleVisibilidad = async (id) => {
    try {
      const noticia = noticias.find(n => n.id_noticia === id);
      
      if (!noticia) return;

      const nuevaData = {
        ...noticia,
        visible: !noticia.visible
      };

      const response = await fetch(`http://localhost:5000/api/admin/noticias/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(nuevaData)
      });

      if (response.ok) {
        setMensaje('Visibilidad actualizada');
        setTimeout(() => setMensaje(''), 3000);
        cargarNoticias();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error actualizando la visibilidad');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      setError('Error de conexión al actualizar la visibilidad');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Manejar cambios en filtros
  const handleChangeFiltros = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      titulo: '',
      autor: '',
      estado: '',
      fechaCreacion: '',
      fechaPublicacion: ''
    });
  };

  // Filtrar noticias
  const noticiasFiltradas = noticias.filter(noticia => {
    return (
      (!filtros.titulo || noticia.titulo.toLowerCase().includes(filtros.titulo.toLowerCase())) &&
      (!filtros.autor || noticia.autor?.toLowerCase().includes(filtros.autor.toLowerCase())) &&
      (!filtros.estado || (filtros.estado === 'visible' ? noticia.visible : !noticia.visible)) &&
      (!filtros.fechaCreacion || noticia.fecha_creacion?.startsWith(filtros.fechaCreacion)) &&
      (!filtros.fechaPublicacion || noticia.fecha_publicacion?.startsWith(filtros.fechaPublicacion))
    );
  });

  if (loading) {
    return <div className="loading">Cargando noticias...</div>;
  }

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h2>Gestión de Noticias</h2>
        <div className="header-actions">
          <div className="stats">
            Total: {noticiasFiltradas.length} de {noticias.length} | 
            Visibles: {noticiasFiltradas.filter(n => n.visible).length}
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleNuevaNoticia}
            disabled={guardando}
          >
            + CREAR NOTICIA
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={cargarNoticias}
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {mensaje && (
        <div className={`alert ${mensaje.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {mensaje}
        </div>
      )}

      {/* Panel de filtros */}
      <div className="filtros-busqueda" style={{
        background: 'rgba(248, 249, 252, 0.8)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(92, 107, 192, 0.1)'
      }}>
        <h6 style={{marginBottom: '1rem', color: 'var(--azul-marino)'}}>Buscar Noticias</h6>
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">Título</label>
            <input
              type="text"
              name="titulo"
              className="form-control"
              placeholder="Buscar por título"
              value={filtros.titulo}
              onChange={handleChangeFiltros}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Autor</label>
            <input
              type="text"
              name="autor"
              className="form-control"
              placeholder="Buscar por autor"
              value={filtros.autor}
              onChange={handleChangeFiltros}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Estado</label>
            <select
              name="estado"
              className="form-select"
              value={filtros.estado}
              onChange={handleChangeFiltros}
            >
              <option value="">Todos</option>
              <option value="visible">Visibles</option>
              <option value="oculto">Ocultos</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Fecha Creación</label>
            <input
              type="date"
              name="fechaCreacion"
              className="form-control"
              value={filtros.fechaCreacion}
              onChange={handleChangeFiltros}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Fecha Publicación</label>
            <input
              type="date"
              name="fechaPublicacion"
              className="form-control"
              value={filtros.fechaPublicacion}
              onChange={handleChangeFiltros}
            />
          </div>
        </div>
        <div className="filtros-actions" style={{marginTop: '1rem'}}>
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={limpiarFiltros}
          >
            <i className="fas fa-times"></i> Limpiar Filtros
          </button>
          <div className="ms-3 text-muted small">
            Mostrando {noticiasFiltradas.length} de {noticias.length} noticias
          </div>
        </div>
      </div>

      {/* Tabla de noticias */}
      <div className="tabla-container">
        {Array.isArray(noticiasFiltradas) && noticiasFiltradas.length > 0 ? (
          <table className="tabla-datos">
            <thead>
              <tr>
                <th>Título</th>
                <th>Autor</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Vistas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {noticiasFiltradas.map(noticia => (
                <tr key={noticia.id_noticia}>
                  <td>
                    <strong>{noticia.titulo}</strong>
                    {(noticia.destacado === true || noticia.destacado === 1) && (
                      <span className="badge bg-warning text-dark ms-2">
                        <i className="fas fa-star me-1"></i>
                        DESTACADA
                      </span>
                    )}
                  </td>
                  <td>{noticia.autor}</td>
                  <td>{noticia.categoria}</td>
                  <td>{new Date(noticia.fecha_publicacion).toLocaleDateString('es-CL')}</td>
                  <td>
                    <span className={`estado ${noticia.visible ? 'activo' : 'inactivo'}`}>
                      {noticia.visible ? 'Visible' : 'Oculto'}
                    </span>
                  </td>
                  <td>{noticia.vistas || 0}</td>
                  <td className="acciones">
                    <button
                      onClick={() => handleEditar(noticia)}
                      className="btn btn-sm btn-secondary"
                    >
                      <i className="fas fa-edit"></i> Editar
                    </button>
                    <button 
                      onClick={() => window.open(`/noticia/${noticia.slug}`, '_blank')} 
                      className="btn btn-sm btn-info me-1"
                    >
                      <i className="fas fa-eye"></i> Ver
                    </button>
                    <button
                      onClick={() => handleEliminar(noticia.id_noticia)}
                      className="btn btn-sm btn-danger"
                      disabled={guardando}
                    >
                      <i className="fas fa-trash"></i> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center p-4">
            <h4>No hay noticias disponibles</h4>
            <p>Crea tu primera noticia para comenzar.</p>
            <button 
              className="btn btn-primary"
              onClick={handleNuevaNoticia}
              disabled={guardando}
            >
              <i className="fas fa-plus"></i> Crear primera noticia
            </button>
          </div>
        )}
      </div>

      {/* Modal del formulario */}
      <ModalPortal 
        isOpen={mostrarFormulario} 
        onClose={() => {
          setMostrarFormulario(false);
          setNoticiaEditando(null);
        }}
      >
        <FormularioNoticia
          noticia={noticiaEditando}
          onGuardar={handleGuardar}
          onCancelar={() => {
            setMostrarFormulario(false);
            setNoticiaEditando(null);
          }}
          guardando={guardando}
        />
      </ModalPortal>
    </div>
  );
};

// Componente para vista previa de multimedia
const VistaPreviewMedia = ({ src, alt, tipo, style, className, onClick, subiendo = false, tipoMime }) => {
  // Solo loggear una vez por renderizado para evitar spam
  const shouldLog = React.useRef(true);
  
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      setError(false);
      setCargando(true);
      shouldLog.current = true;
      
      // Debug: observar cambios en el elemento después de 2 segundos
      const timer = setTimeout(() => {
        const elementos = document.querySelectorAll('.gallery-image');
        const contenedores = document.querySelectorAll('.gallery-image-container');
        const items = document.querySelectorAll('.gallery-item');
        
        console.log(`🔍 Debug: ${elementos.length} imágenes, ${contenedores.length} contenedores, ${items.length} items`);
        
        elementos.forEach((el, i) => {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          const container = el.closest('.gallery-image-container');
          const containerRect = container ? container.getBoundingClientRect() : null;
          
          console.log(`Imagen ${i}:`, {
            imagen: {
              visible: rect.width > 0 && rect.height > 0,
              dimensions: `${rect.width}x${rect.height}`,
              display: styles.display,
              opacity: styles.opacity,
              visibility: styles.visibility,
              width: styles.width,
              height: styles.height,
              minWidth: styles.minWidth,
              minHeight: styles.minHeight
            },
            contenedor: containerRect ? {
              dimensions: `${containerRect.width}x${containerRect.height}`,
              display: window.getComputedStyle(container).display,
              visibility: window.getComputedStyle(container).visibility
            } : 'No contenedor'
          });
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [src]);

  if (shouldLog.current) {
    console.log('🖼️ VistaPreviewMedia:', { 
      tipo, 
      srcLength: src?.length, 
      isDataURL: src?.startsWith('data:'),
      alt
    });
    shouldLog.current = false;
  }

  // Validar que src existe
  if (!src) {
    return (
      <div className={`vista-preview-error d-flex align-items-center justify-content-center ${className || ''}`} style={style}>
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-warning"></i>
          <br />
          <small className="text-muted">Sin archivo</small>
        </div>
      </div>
    );
  }

  if (subiendo) {
    return (
      <div className={`vista-preview-loading ${className || ''}`} style={style}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Subiendo...</span>
        </div>
        <small className="text-muted mt-2">Subiendo archivo...</small>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`vista-preview-error ${className || ''}`} style={style}>
        <i className="fas fa-exclamation-triangle text-warning"></i>
        <small className="text-muted">Error al cargar</small>
      </div>
    );
  }

  // Renderizado por tipo de archivo con mejor soporte responsivo
  if (tipo === 'video') {
    console.log('Renderizando video:', src);
    return (
      <div className={`vista-preview-video position-relative ${className || ''}`} style={style} onClick={onClick}>
        <video
          src={src}
          alt={alt}
          controls
          preload="metadata"
          className="gallery-image"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onLoadStart={() => setCargando(true)}
          onLoadedData={() => {
            console.log('Video cargado correctamente');
            setCargando(false);
          }}
          onError={(e) => {
            console.error('Error cargando video:', e);
            setError(true);
            setCargando(false);
          }}
        >
          Tu navegador no soporta el elemento video.
        </video>
        {cargando && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Cargando video...</span>
            </div>
          </div>
        )}
        <div className="gallery-badge info">
          <i className="fas fa-video me-1"></i>VIDEO
        </div>
      </div>
    );
  }

  if (tipo === 'gif') {
    console.log('Renderizando GIF:', src);
    return (
      <div className={`vista-preview-gif position-relative ${className || ''}`} style={style} onClick={onClick}>
        <img
          src={src}
          alt={alt}
          className="gallery-image"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onLoad={() => {
            console.log('GIF cargado correctamente');
            setCargando(false);
          }}
          onError={(e) => {
            console.error('Error cargando GIF:', e);
            setError(true);
            setCargando(false);
          }}
        />
        {cargando && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando GIF...</span>
            </div>
          </div>
        )}
        <div className="gallery-badge info">
          <i className="fas fa-magic me-1"></i>GIF
        </div>
      </div>
    );
  }

  // Imagen por defecto con mejor responsividad
  return (
    <div className={`position-relative gallery-image-container ${className || ''}`} onClick={onClick}>
      {cargando && !error && (
        <div className="gallery-loading">
          <div className="spinner"></div>
          <small>Cargando...</small>
        </div>
      )}
      
      {error ? (
        <div className="gallery-error">
          <i className="fas fa-exclamation-triangle"></i>
          <small>Error cargando archivo</small>
          <small style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
            {src?.startsWith('data:') ? 
              `Data URL: ${src.substring(0, 30)}...` : 
              `URL: ${src?.substring(0, 40)}...`
            }
          </small>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="gallery-image"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: cargando ? 'none' : 'block'
          }}
          onLoad={() => {
            console.log('✅ Imagen cargada:', alt);
            setCargando(false);
            setError(false);
          }}
          onError={(e) => {
            console.error('❌ Error cargando imagen:', alt, src?.substring(0, 30));
            setError(true);
            setCargando(false);
          }}
        />
      )}
    </div>
  );
};

// Determinar tipo de archivo
const obtenerTipoArchivo = (url, tipoMime = null, tipoArchivoDB = null) => {
  console.log('Determinando tipo de archivo:', { url, tipoMime, tipoArchivoDB });
  
  // Priorizar tipo de DB
  if (tipoArchivoDB) {
    console.log('Usando tipo de DB:', tipoArchivoDB);
    return tipoArchivoDB;
  }
  
  // Verificar tipo MIME
  if (tipoMime) {
    if (tipoMime.startsWith('video/')) {
      console.log('Detectado como video por MIME:', tipoMime);
      return 'video';
    }
    if (tipoMime === 'image/gif') {
      console.log('Detectado como GIF por MIME:', tipoMime);
      return 'gif';
    }
    if (tipoMime.startsWith('image/')) {
      console.log('Detectado como imagen por MIME:', tipoMime);
      return 'imagen';
    }
  }
  
  // Verificar por extensión
  if (url) {
    const extension = url.split('.').pop()?.toLowerCase();
    console.log('Extensión detectada:', extension);
    
    if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'm4v', 'wmv', 'flv', '3gp'].includes(extension)) {
      console.log('Detectado como video por extensión');
      return 'video';
    }
    
    if (extension === 'gif') {
      console.log('Detectado como GIF por extensión');
      return 'gif';
    }
    
    if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'svg', 'ico'].includes(extension)) {
      console.log('Detectado como imagen por extensión');
      return 'imagen';
    }
  }
  
  console.log('Tipo no detectado, usando imagen por defecto');
  return 'imagen';
};

// Formulario para crear/editar noticias
const FormularioNoticia = ({ noticia, onGuardar, onCancelar, guardando = false }) => {
  // Hooks de alerta para usar shadcn/ui
  const { showConfirm, showSuccess, showError } = useAlert();
  
  const [guardandoLocal, setGuardandoLocal] = useState(false);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    resumen: '',
    autor: 'Administrador',
    categoria: '',
    visible: true,
    destacado: false
  });

  // Estados para archivos
  const [archivos, setArchivos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [imagenPrincipal, setImagenPrincipal] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');

  // Límites de caracteres
  const LIMITES = {
    titulo: 255,
    resumen: 500,
    autor: 100,
    contenido: 10000
  };

  const CATEGORIAS = [
    'General',
    'Conciertos', 
    'Eventos',
    'Educativo',
    'Logros',
    'Anuncios'
  ];

  // Cargar imágenes existentes
  const cargarImagenesExistentes = async (noticiaId) => {
    try {
      console.log('Cargando imágenes existentes para noticia:', noticiaId);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/noticias/${noticiaId}/imagenes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (data.imagenes && Array.isArray(data.imagenes)) {
          const imagenesFormateadas = data.imagenes.map((img, index) => ({
            id: img.id_imagen,
            url: img.imagen_url.startsWith('http') 
              ? img.imagen_url 
              : `http://localhost:5000${img.imagen_url}`,
            nombre: img.imagen_alt || `Imagen ${index + 1}`,
            tipo: obtenerTipoArchivo(img.imagen_url, img.tipo_mime, img.tipo_archivo),
            esPrincipal: Boolean(img.es_principal),
            esExistente: true,
            tamaño: img.tamaño_archivo
          }));

          console.log('Imágenes formateadas:', imagenesFormateadas);
          setPreviewUrls(imagenesFormateadas);

          const imagenPrincipal = imagenesFormateadas.find(img => img.esPrincipal);
          if (imagenPrincipal) {
            setImagenPrincipal(imagenPrincipal);
          }
        }
      } else {
        console.log('No se pudieron cargar las imágenes existentes');
      }
    } catch (error) {
      console.error('Error cargando imágenes existentes:', error);
    }
  };

  // Inicializar formulario
  useEffect(() => {
    if (noticia) {
      console.log('Editando noticia:', noticia);
      
      setFormData({
        titulo: noticia.titulo || '',
        contenido: noticia.contenido || '',
        resumen: noticia.resumen || '',
        autor: noticia.autor || 'Administrador',
        categoria: noticia.categoria || '',
        visible: noticia.visible !== undefined ? noticia.visible : true,
        destacado: noticia.destacado !== undefined ? noticia.destacado : false
      });
      
      if (noticia.id_noticia) {
        console.log('Cargando multimedia para noticia ID:', noticia.id_noticia);
        cargarImagenesExistentes(noticia.id_noticia);
      } else {
        console.log('Noticia sin ID, no se pueden cargar imágenes');
        setPreviewUrls([]);
      }
    } else {
      console.log('Nueva noticia - reseteando formulario');
      setFormData({
        titulo: '',
        contenido: '',
        resumen: '',
        autor: 'Administrador',
        categoria: '',
        visible: true,
        destacado: false
      });
      setPreviewUrls([]);
      setArchivos([]);
      setImagenPrincipal(null);
    }
  }, [noticia]);

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type !== 'checkbox' && LIMITES[name]) {
      if (value.length > LIMITES[name]) {
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Manejo de drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      handleMultiplesArchivos(filesArray);
    }
  };

  const handleArchivoInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      handleMultiplesArchivos(filesArray);
    }
  };

  // Procesar múltiples archivos
  const handleMultiplesArchivos = (files) => {
    const tiposPermitidos = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'
    ];
    
    const archivosValidos = files.filter(file => {
      console.log('Procesando archivo:', file.name, file.type, (file.size / 1024 / 1024).toFixed(2) + 'MB');
      
      if (!tiposPermitidos.includes(file.type)) {
        showError(
          'Archivo no permitido',
          `El archivo ${file.name} tiene un tipo no permitido (${file.type})`
        );
        return false;
      }
      
      return true;
    });

    if (archivosValidos.length === 0) {
      console.log('No hay archivos válidos para procesar');
      return;
    }

    console.log('Archivos válidos:', archivosValidos.length);

    setArchivos(prev => {
      const nuevosArchivos = [...prev, ...archivosValidos];
      console.log('Total archivos después de agregar:', nuevosArchivos.length);
      return nuevosArchivos;
    });

    // Crear previews
    archivosValidos.forEach((file, fileIndex) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const resultado = e.target.result;
          
          if (!resultado || typeof resultado !== 'string') {
            console.error('Error: resultado de FileReader inválido para', file.name);
            return;
          }

          const nuevoPreview = {
            id: Date.now() + Math.random() + fileIndex,
            file: file,
            url: resultado,
            tipo: obtenerTipoArchivo(file.name, file.type),
            esPrincipal: false,
            esExistente: false,
            nombre: file.name,
            tamaño: file.size,
            tipoMime: file.type
          };

          console.log('🖼️ Preview creado:', {
            nombre: file.name,
            tipo: nuevoPreview.tipo,
            tipoMime: file.type,
            urlLength: resultado?.length,
            urlStart: resultado?.substring(0, 50),
            isDataURL: resultado?.startsWith('data:')
          });

          setPreviewUrls(prev => {
            const nuevasPreviews = [...prev, nuevoPreview];
            console.log('Total previews:', nuevasPreviews.length);
            return nuevasPreviews;
          });

        } catch (error) {
          console.error('Error procesando archivo:', file.name, error);
          showError(
            'Error procesando archivo',
            `Error procesando ${file.name}: ${error.message}`
          );
        }
      };

      reader.onerror = (error) => {
        console.error('Error leyendo archivo:', file.name, error);
        showError(
          'Error leyendo archivo',
          `No se pudo leer el archivo ${file.name}`
        );
      };

      try {
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error iniciando lectura de archivo:', file.name, error);
        showError(
          'Error iniciando lectura',
          `No se pudo iniciar la lectura del archivo ${file.name}`
        );
      }
    });

    // Establecer imagen principal si no hay una
    if (!imagenPrincipal && archivosValidos.length > 0) {
      setImagenPrincipal(archivosValidos[0]);
      console.log('Imagen principal establecida:', archivosValidos[0].name);
    }
  };

  // Limpiar archivos
  const limpiarTodosLosArchivos = () => {
    setArchivos([]);
    setPreviewUrls([]);
    setImagenPrincipal(null);
    setEditandoNombre(null);
    setNuevoNombre('');
    console.log('Todos los archivos limpiados');
  };

  // Eliminar archivo
  const eliminarArchivo = async (index) => {
    const preview = previewUrls[index];
    console.log('Eliminando archivo:', preview.nombre);
    
    // Si es archivo existente, eliminarlo del servidor
    if (preview.esExistente && preview.id) {
      try {
        console.log('Eliminando imagen existente del servidor...');
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/noticias/imagenes/${preview.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error eliminando imagen del servidor');
        }

        const result = await response.json();
        console.log('Imagen eliminada del servidor:', result);
      } catch (error) {
        console.error('Error eliminando imagen del servidor:', error);
        showError('Error eliminando imagen del servidor: ' + error.message);
        return;
      }
    } else if (!preview.esExistente) {
      // Eliminar archivo nuevo del array
      const nuevoArchivos = [...archivos];
      nuevoArchivos.splice(index, 1);
      setArchivos(nuevoArchivos);
    }
    
    // Eliminar preview
    setPreviewUrls(prev => {
      const nuevos = [...prev];
      nuevos.splice(index, 1);
      return nuevos;
    });
    
    // Ajustar imagen principal
    if (preview.esPrincipal && previewUrls.length > 1) {
      const siguienteIndice = index === previewUrls.length - 1 ? 0 : index;
      if (siguienteIndice < previewUrls.length - 1) {
        setTimeout(() => cambiarImagenPrincipal(siguienteIndice), 100);
      }
    } else if (previewUrls.length === 1) {
      setImagenPrincipal(null);
    }

    if (editandoNombre === index) {
      setEditandoNombre(null);
      setNuevoNombre('');
    }

    console.log('Archivo eliminado correctamente');
  };

  // Cambiar imagen principal con funcionalidad de toggle
  const cambiarImagenPrincipal = async (index) => {
    const preview = previewUrls[index];
    
    // Si ya es principal, deseleccionarla (toggle)
    if (preview.esPrincipal) {
      console.log('Deseleccionando imagen principal:', preview.nombre);
      
      // Para imágenes existentes, hacer petición al servidor para quitar principal
      if (preview.esExistente && preview.id && noticia?.id_noticia) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/admin/noticias/${noticia.id_noticia}/imagen-principal`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Error removiendo imagen principal en servidor');
          }

          console.log('Imagen principal removida en servidor correctamente');
        } catch (error) {
          console.error('Error removiendo imagen principal:', error);
          showError('Error removiendo imagen principal: ' + error.message);
          return;
        }
      }

      // Actualizar estado local para remover principal
      const nuevosPreviews = [...previewUrls];
      nuevosPreviews[index].esPrincipal = false;
      setPreviewUrls(nuevosPreviews);
      setImagenPrincipal(null);
      
      console.log('Imagen principal removida localmente');
      return;
    }
    
    // Si no es principal, establecerla como principal
    console.log('Estableciendo imagen principal:', preview.nombre);
    
    // Para imágenes existentes, hacer petición al servidor
    if (preview.esExistente && preview.id && noticia?.id_noticia) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/noticias/${noticia.id_noticia}/imagen-principal`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imagen_id: preview.id
          })
        });

        if (!response.ok) {
          throw new Error('Error actualizando imagen principal en servidor');
        }

        console.log('Imagen principal actualizada en servidor correctamente');
      } catch (error) {
        console.error('Error cambiando imagen principal:', error);
        showError('Error cambiando imagen principal: ' + error.message);
        return;
      }
    }

    // Actualizar estado local para imágenes nuevas y existentes
    const nuevosPreviews = [...previewUrls];
    nuevosPreviews.forEach(p => p.esPrincipal = false); // Quitar principal de todas
    nuevosPreviews[index].esPrincipal = true; // Establecer nueva principal
    setPreviewUrls(nuevosPreviews);
    setImagenPrincipal(nuevosPreviews[index]);

    console.log('Imagen principal actualizada localmente:', preview.nombre);
  };

  // Edición de nombres
  const iniciarEdicionNombre = (index, nombreActual) => {
    setEditandoNombre(index);
    setNuevoNombre(nombreActual);
  };

  const guardarNuevoNombre = (index) => {
    if (nuevoNombre.trim()) {
      setPreviewUrls(prev => prev.map((preview, i) => 
        i === index ? { ...preview, nombre: nuevoNombre.trim() } : preview
      ));
      
      const preview = previewUrls[index];
      if (!preview.esExistente && preview.file) {
        const newFile = new File([preview.file], nuevoNombre.trim(), { type: preview.file.type });
        setArchivos(prev => prev.map(archivo => 
          archivo.name === preview.file.name ? newFile : archivo
        ));
        
        if (imagenPrincipal && imagenPrincipal.name === preview.file.name) {
          setImagenPrincipal(newFile);
        }
      }
    }
    setEditandoNombre(null);
    setNuevoNombre('');
  };

  const cancelarEdicionNombre = () => {
    setEditandoNombre(null);
    setNuevoNombre('');
  };

  // Contador de caracteres
  const getContadorCaracteres = (campo) => {
    const actual = formData[campo]?.length || 0;
    const limite = LIMITES[campo];
    const porcentaje = (actual / limite) * 100;
    
    let colorClass = 'text-muted';
    if (porcentaje > 90) colorClass = 'text-danger';
    else if (porcentaje > 75) colorClass = 'text-warning';
    
    return (
      <span className={`contador-caracteres ${colorClass}`}>
        {actual}/{limite}
      </span>
    );
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (guardando || guardandoLocal) return;
    
    console.log('Iniciando envío del formulario...');

    try {
      setGuardandoLocal(true);

      if (!formData.titulo?.trim()) {
        showError('Campo requerido', 'El título es obligatorio');
        return;
      }

      const formDataToSend = new FormData();
      
      // Datos básicos
      formDataToSend.append('titulo', formData.titulo.trim());
      formDataToSend.append('contenido', formData.contenido || '');
      formDataToSend.append('resumen', formData.resumen || '');
      formDataToSend.append('autor', formData.autor || 'Administrador');
      formDataToSend.append('categoria', formData.categoria || 'General');
      formDataToSend.append('visible', formData.visible);
      formDataToSend.append('destacado', formData.destacado);
      formDataToSend.append('fecha_publicacion', new Date().toISOString().split('T')[0]);
      
      // Imagen principal
      const imagenPrincipalSeleccionada = previewUrls.find(preview => preview.esPrincipal);
      
      if (imagenPrincipalSeleccionada) {
        if (imagenPrincipalSeleccionada.esExistente) {
          console.log('Imagen principal existente:', imagenPrincipalSeleccionada.id_imagen);
          formDataToSend.append('imagen_principal_existente', imagenPrincipalSeleccionada.id_imagen);
        } else {
          console.log('Nueva imagen principal:', imagenPrincipalSeleccionada.file.name);
          formDataToSend.append('imagen', imagenPrincipalSeleccionada.file);
        }
      }
      
      // Archivos de galería
      const archivosGaleria = previewUrls.filter(preview => !preview.esPrincipal && !preview.esExistente);
      archivosGaleria.forEach((preview, index) => {
        console.log(`Agregando archivo ${index + 1} a galería:`, preview.file.name);
        formDataToSend.append('imagenes_galeria', preview.file);
      });

      // Orden de imágenes
      const ordenImagenes = previewUrls.map((preview, index) => ({
        nombre: preview.esExistente ? preview.id_imagen : preview.file.name,
        orden: index,
        esPrincipal: preview.esPrincipal,
        esExistente: preview.esExistente
      }));
      formDataToSend.append('orden_imagenes', JSON.stringify(ordenImagenes));

      console.log('Creando noticia con archivos:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value);
      }

      // Llamar al callback del padre
      await onGuardar(formDataToSend);
      
    } catch (error) {
      console.error('Error preparando formulario:', error);
      alert('Error preparando los datos del formulario');
    } finally {
      setGuardandoLocal(false);
    }
  };

  // Corregir estructura del modal
  return (
    <>
      <div className="modal-header">
        <h5 className="modal-title">
          {noticia ? 'Editar Noticia' : 'Nueva Noticia'}
        </h5>
        <button 
          type="button" 
          className="btn-close" 
          onClick={onCancelar}
          disabled={guardando || guardandoLocal}
        ></button>
      </div>
      
      <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Título */}
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0">Título *</label>
                {getContadorCaracteres('titulo')}
              </div>
              <input
                type="text"
                name="titulo"
                className="form-control"
                value={formData.titulo}
                onChange={handleChange}
                required
                placeholder="Título de la noticia"
              />
            </div>

            {/* Resumen */}
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0">Resumen</label>
                {getContadorCaracteres('resumen')}
              </div>
              <textarea
                name="resumen"
                className="form-control"
                rows="2"
                value={formData.resumen}
                onChange={handleChange}
                placeholder="Breve resumen de la noticia"
              ></textarea>
            </div>

            {/* Contenido */}
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0">Contenido *</label>
                {getContadorCaracteres('contenido')}
              </div>
              <textarea
                name="contenido"
                className="form-control"
                rows="8"
                value={formData.contenido}
                onChange={handleChange}
                required
                placeholder="Contenido completo de la noticia"
              ></textarea>
            </div>

            {/* Autor y Categoría */}
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0">Autor</label>
                {getContadorCaracteres('autor')}
              </div>
              <input
                type="text"
                name="autor"
                className="form-control"
                value={formData.autor}
                onChange={handleChange}
                placeholder="Nombre del autor"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Categoría</label>
              <select
                name="categoria"
                className="form-select"
                value={formData.categoria}
                onChange={handleChange}
              >
                <option value="">Seleccionar categoría</option>
                {CATEGORIAS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Área de subida de archivos */}
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label mb-0">Multimedia (Imágenes/Videos)</label>
                {previewUrls.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={limpiarTodosLosArchivos}
                    title="Limpiar todos los archivos"
                  >
                    <i className="fas fa-trash-alt me-1"></i>
                    Limpiar Todo ({previewUrls.length})
                  </button>
                )}
              </div>
              
              <div 
                className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('archivo-input').click()}
              >
                <input
                  id="archivo-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                  onChange={handleArchivoInput}
                  multiple
                  style={{ display: 'none' }}
                />
                
                <div className="upload-placeholder">
                  <i className="fas fa-cloud-upload-alt fa-3x mb-3"></i>
                  <h5>Subir Multimedia</h5>
                  <p className="text-muted mb-2">
                    Arrastra y suelta múltiples archivos o haz clic para seleccionar
                  </p>
                  {previewUrls.length > 0 && (
                    <div className="mb-3">
                      <span className="badge bg-success">
                        {previewUrls.length} archivo{previewUrls.length !== 1 ? 's' : ''} cargado{previewUrls.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  <small className="text-muted">
                    <strong>Formatos soportados:</strong><br/>
                    📷 Imágenes: JPG, PNG, GIF, WebP<br/>
                    🎥 Videos: MP4, WebM, OGG, AVI, MOV<br/>
                    📏 <strong>Sin límites de tamaño o cantidad</strong>
                  </small>
                </div>
              </div>

              {/* Vista previa de archivos */}
              {previewUrls.length > 0 && (
                <div className="accordion mt-3" id="accordionVistaPrevia">
                  <div className="accordion-item">
                    <h2 className="accordion-header" id="headingVistaPrevia">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseVistaPrevia"
                        aria-expanded="true"
                        aria-controls="collapseVistaPrevia"
                      >
                        <i className="fas fa-images me-2"></i>
                        Vista Previa - Galería ({previewUrls.length} archivo{previewUrls.length !== 1 ? 's' : ''})
                      </button>
                    </h2>
                    <div
                      id="collapseVistaPrevia"
                      className="accordion-collapse collapse show"
                      aria-labelledby="headingVistaPrevia"
                      data-bs-parent="#accordionVistaPrevia"
                    >
                      <div className="accordion-body">
                        <div className="gallery-container">
                          {previewUrls.map((preview, index) => {
                            // Reducir logs solo para el primer renderizado
                            if (index === 0) {
                              console.log(`🖼️ Renderizando preview ${index}:`, {
                                nombre: preview.nombre,
                                tipo: preview.tipo,
                                url: preview.url?.substring(0, 50) + '...',
                                tipoMime: preview.tipoMime
                              });
                            }
                            
                            return (
                              <div key={preview.id} className="gallery-item">
                                <div className="gallery-image-container">
                                  {/* Badges de estado */}
                                  {preview.esPrincipal && (
                                    <div className="gallery-badge primary">
                                      Principal
                                    </div>
                                  )}
                                  
                                  {preview.esExistente && (
                                    <div className="gallery-badge info">
                                      Actual
                                    </div>
                                  )}
                                  
                                  <VistaPreviewMedia 
                                    src={preview.url}
                                    alt={`Preview ${index + 1}`}
                                    tipo={preview.tipo}
                                    tipoMime={preview.tipoMime}
                                    className="gallery-image"
                                  />
                                </div>
                                
                                <div className="gallery-info">
                                  {/* Nombre editable */}
                                  {editandoNombre === index ? (
                                    <div className="mb-2">
                                      <div className="input-group input-group-sm">
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={nuevoNombre}
                                          onChange={(e) => setNuevoNombre(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              guardarNuevoNombre(index);
                                            }
                                            if (e.key === 'Escape') {
                                              e.preventDefault();
                                              cancelarEdicionNombre();
                                            }
                                          }}
                                          autoFocus
                                          placeholder="Nuevo nombre del archivo"
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-outline-success btn-sm"
                                          onClick={() => guardarNuevoNombre(index)}
                                          title="Guardar nombre"
                                        >
                                          <i className="fas fa-check"></i>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={cancelarEdicionNombre}
                                          title="Cancelar"
                                        >
                                          <i className="fas fa-times"></i>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="gallery-filename">{preview.nombre}</div>
                                      <div className="gallery-filesize">
                                        {preview.tamaño && (
                                          <span>{(preview.tamaño / 1024 / 1024).toFixed(2)} MB</span>
                                        )}
                                        {preview.esExistente && (
                                          <span className="text-info"> (Imagen actual)</span>
                                        )}
                                      </div>
                                    </>
                                  )}
                                  
                                  {/* Botones de acción */}
                                  <div className="gallery-actions">
                                    <button
                                      type="button"
                                      className={`gallery-btn ${preview.esPrincipal ? 'primary' : ''}`}
                                      onClick={() => cambiarImagenPrincipal(index)}
                                      title={preview.esPrincipal ? 'Quitar como principal (click para deseleccionar)' : 'Establecer como imagen principal'}
                                    >
                                      <i className={`fas ${preview.esPrincipal ? 'fa-star' : 'fa-star-o'}`}></i>
                                      {preview.esPrincipal ? 'Principal' : 'Destacar'}
                                    </button>
                                    
                                    <button
                                      type="button"
                                      className="gallery-btn"
                                      onClick={() => iniciarEdicionNombre(index, preview.nombre)}
                                      title="Editar nombre"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    
                                    <button
                                      type="button"
                                      className="gallery-btn danger"
                                      onClick={() => eliminarArchivo(index)}
                                      title="Eliminar"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Opciones de visibilidad */}
            <div className="col-12">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="visible"
                      id="visible"
                      checked={formData.visible}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="visible">
                      Visible al público
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="destacado"
                      id="destacado"
                      checked={formData.destacado}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="destacado">
                      Noticia destacada
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer del modal */}
      <div className="modal-footer">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onCancelar}
          disabled={guardando || guardandoLocal}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={guardando || guardandoLocal}
        >
          {(guardando || guardandoLocal) ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Guardando...
            </>
          ) : (
            noticia ? 'Actualizar Noticia' : 'Crear Noticia'
          )}
        </button>
      </div>
    </>
  );
};

export default Noticias;