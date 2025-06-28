const Noticias = require('../models/Noticias');
const path = require('path');
const fs = require('fs');
const { uploadNoticia } = require('../middleware/upload');

// Cache temporal para evitar incrementos múltiples
const vistasCacheMap = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para limpiar cache viejo
const limpiarCacheViejo = () => {
  const ahora = Date.now();
  const CACHE_DURATION = 15000; // 15 segundos
  
  for (const [key, value] of vistasCacheMap.entries()) {
    if (ahora - value.timestamp > CACHE_DURATION) {
      vistasCacheMap.delete(key);
    }
  }
};

class NoticiasController {
    // Obtener todas las noticias
    async getAll(req, res) {
        try {
            console.log('🔍 Obteniendo todas las noticias...');
            const noticias = await Noticias.getAll();
            console.log('📊 Noticias encontradas:', noticias.length);
            
            // Filtrar campos innecesarios y limpiar datos
            const noticiasLimpias = noticias.map(noticia => {
                // Formatear URL de imagen principal
                let imagenPrincipal = null;
                if (noticia.imagen_principal) {
                    imagenPrincipal = noticia.imagen_principal.startsWith('http') 
                        ? noticia.imagen_principal 
                        : `http://localhost:5000${noticia.imagen_principal}`;
                }
                
                return {
                    id_noticia: noticia.id_noticia,
                    titulo: noticia.titulo,
                    slug: noticia.slug,
                    resumen: noticia.resumen,
                    fecha_publicacion: noticia.fecha_publicacion,
                    autor: noticia.autor,
                    categoria: noticia.categoria,
                    imagen_principal: imagenPrincipal,
                    destacado: noticia.destacado,
                    // Solo incluir vistas si es mayor que 0
                    ...(noticia.vistas && noticia.vistas > 0 && { vistas: noticia.vistas })
                };
            });
            
            console.log('📋 Datos limpios con URLs formateadas:', noticiasLimpias.map(n => ({
                id: n.id_noticia,
                titulo: n.titulo,
                imagen: n.imagen_principal
            })));
            
            res.json(noticiasLimpias);
        } catch (error) {
            console.error('❌ Error obteniendo noticias:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor',
                details: error.message 
            });
        }
    }

    // Obtener noticia por slug
    async getBySlug(req, res) {
        try {
            const { slug } = req.params;
            const incrementarVista = req.headers['x-incrementar-vista'] === 'true';
            
            console.log(`🔍 Buscando noticia con slug: "${slug}"`);
            console.log(`👁️ Incrementar vista: ${incrementarVista}`);
            
            if (!slug || slug.trim() === '') {
              return res.status(400).json({ 
                success: false, 
                message: 'Slug es requerido' 
              });
            }
            
            // Limpiar cache viejo
            limpiarCacheViejo();
            
            if (incrementarVista) {
              // Cache para evitar spam de vistas
              const ahora = Date.now();
              const CACHE_DURATION = 15000; // 15 segundos entre vistas del mismo cliente
              const cacheKey = `${slug}-${req.ip}`;
              
              // Verificar cache anti-spam
              if (vistasCacheMap.has(cacheKey)) {
                const { timestamp, contado } = vistasCacheMap.get(cacheKey);
                const tiempoTranscurrido = ahora - timestamp;
                
                if (tiempoTranscurrido < CACHE_DURATION) {
                  console.log(`⚠️ Vista en cache para ${slug}, tiempo restante: ${Math.round((CACHE_DURATION - tiempoTranscurrido) / 1000)}s`);
                  
                  // No incrementar vista si está en cache
                  const noticia = await Noticias.getBySlugSinIncrementar(slug);
                  
                  if (!noticia) {
                    return res.status(404).json({ error: 'Noticia no encontrada' });
                  }
                  
                  return res.json(noticia);
                }
              }
              
              // Incrementar vista y marcar en cache
              const noticia = await Noticias.getBySlug(slug);
              
              if (!noticia) {
                return res.status(404).json({ error: 'Noticia no encontrada' });
              }
              
              // Marcar en cache
              vistasCacheMap.set(cacheKey, { 
                timestamp: ahora, 
                contado: true 
              });
              
              console.log(`✅ Vista incrementada para ${slug}, total: ${noticia.vistas}`);
              return res.json(noticia);
              
            } else {
              // Solo consultar sin incrementar vista
              console.log(`📖 Consultando noticia sin incrementar vista: ${slug}`);
              const noticia = await Noticias.getBySlugSinIncrementar(slug);
              
              if (!noticia) {
                return res.status(404).json({ error: 'Noticia no encontrada' });
              }
              
              return res.json(noticia);
            }
            
          } catch (error) {
            console.error('❌ Error obteniendo noticia:', error);
            res.status(500).json({ 
              success: false, 
              message: 'Error interno del servidor',
              error: error.message 
            });
          }
    }

    // Método auxiliar para limpiar cache viejo
    limpiarCacheViejo() {
        const ahora = Date.now();
        for (const [key, { timestamp }] of vistasCacheMap.entries()) {
            if (ahora - timestamp > CACHE_DURATION) {
                vistasCacheMap.delete(key);
            }
        }
    }

    // Crear noticia con imágenes en una sola operación
    async create(req, res) {
        try {
            console.log('📝 Creando nueva noticia...');
            console.log('📋 Datos recibidos:', req.body);
            console.log('📁 Archivos recibidos:', req.files ? req.files.length : 0);
            
            // Crear la noticia como siempre
            const noticiaId = await Noticias.create(req.body);
            console.log('✅ Noticia creada con ID:', noticiaId);

            // Guardar archivos en BD si existen
            if (req.files && req.files.length > 0) {
                await Noticias.guardarArchivosEnBD(noticiaId, req.files);
            }
            
            res.status(201).json({ 
                message: 'Noticia creada exitosamente',
                id: noticiaId
            });
            
        } catch (error) {
            console.error('❌ Error creando noticia:', error);
            res.status(500).json({ 
                error: 'Error creando noticia',
                details: error.message 
            });
        }
    }

    // Actualizar noticia
    async update(req, res) {
        try {
            const { id } = req.params;
            console.log('📝 Actualizando noticia ID:', id);
            
            const success = await Noticias.update(id, req.body);
            
            if (!success) {
                return res.status(404).json({ error: 'Noticia no encontrada' });
            }
            
            res.json({ message: 'Noticia actualizada exitosamente' });
        } catch (error) {
            console.error('❌ Error actualizando noticia:', error);
            res.status(500).json({ error: 'Error actualizando noticia' });
        }
    }

    // Eliminar noticia
    async delete(req, res) {
        try {
            const { id } = req.params;
            console.log('🗑️ Eliminando noticia ID:', id);
            
            const success = await Noticias.delete(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Noticia no encontrada' });
            }
            
            res.json({ message: 'Noticia eliminada exitosamente' });
        } catch (error) {
            console.error('❌ Error eliminando noticia:', error);
            res.status(500).json({ error: 'Error eliminando noticia' });
        }
    }

    // Subir imágenes a noticia específica
    async subirImagenesANoticia(req, res) {
        try {
            const { id } = req.params; // Obtener ID de la URL
            console.log('📤 Subiendo imágenes a noticia ID:', id);
            console.log('📁 Archivos recibidos:', req.files?.length || 0);
            console.log('📋 Body:', req.body);
            
            // Validar que tenemos el ID
            if (!id) {
                return res.status(400).json({ 
                    error: 'ID de noticia requerido en la URL' 
                });
            }
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ 
                    error: 'No se recibieron archivos' 
                });
            }
            
            // Verificar que la noticia existe
            try {
                const noticia = await Noticias.getById(id);
                if (!noticia) {
                    return res.status(404).json({ 
                        error: 'Noticia no encontrada' 
                    });
                }
            } catch (error) {
                return res.status(404).json({ 
                    error: 'Noticia no encontrada' 
                });
            }
            
            const imagenesGuardadas = [];
            
            for (let i = 0; i < req.files.length; i++) {
                const archivo = req.files[i];
                
                try {
                    const tipoArchivo = this.obtenerTipoArchivo(archivo.filename, null);
                    
                    const imagenData = {
                        imagen_url: `/uploads/noticias/${archivo.filename}`,
                        imagen_alt: archivo.originalname || `Archivo ${i + 1}`,
                        orden: i,
                        es_principal: false,
                        tipo_archivo: tipoArchivo,
                        tipo_mime: archivo.mimetype,
                        tamaño_archivo: archivo.size
                    };
                    
                    console.log(`📷 Guardando archivo ${i + 1}:`, {
                        noticia_id: id,
                        filename: archivo.filename,
                        originalname: archivo.originalname,
                        tipo: tipoArchivo
                    });
                    
                    const imagenId = await Noticias.agregarImagen(id, imagenData);
                    
                    imagenesGuardadas.push({
                        id_imagen: imagenId,
                        noticia_id: id,
                        ...imagenData,
                        tipo: tipoArchivo
                    });
                    
                    console.log(`✅ Archivo ${i + 1} guardado con ID:`, imagenId);
                    
                } catch (error) {
                    console.error(`❌ Error guardando archivo ${i + 1}:`, error);
                }
            }
            
            res.json({
                success: true,
                message: `${imagenesGuardadas.length} archivos subidos correctamente`,
                imagenes: imagenesGuardadas,
                total: imagenesGuardadas.length,
                noticia_id: id
            });
            
        } catch (error) {
            console.error('❌ Error subiendo imágenes:', error);
            res.status(500).json({ 
                error: 'Error subiendo archivos',
                details: error.message 
            });
        }
    }

    // Subir múltiples imágenes con verificación mejorada
    async subirMultiplesImagenes(req, res) {
        try {
            console.log('📤 Subiendo múltiples imágenes...');
            console.log('📁 Archivos recibidos:', req.files?.length || 0);
            console.log('📋 Body completo:', req.body);
            console.log('📋 Query params:', req.query);
            console.log('📋 Headers:', req.headers);
            
            // Extraer noticia_id de múltiples fuentes
            let noticia_id = req.body.noticia_id || 
                            req.body.noticiaId || 
                            req.query.noticia_id || 
                            req.query.noticiaId ||
                            req.params.id;
            
            console.log('🆔 ID extraído:', noticia_id);
            
            // Si no hay ID, pedirlo explícitamente
            if (!noticia_id) {
                console.error('❌ No se pudo extraer ID de noticia');
                return res.status(400).json({ 
                    error: 'ID de noticia requerido. Envíe el ID como parámetro de consulta: ?noticia_id=X',
                    debug: {
                        body_keys: Object.keys(req.body),
                        body: req.body,
                        query: req.query,
                        params: req.params
                    }
                });
            }
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ 
                    error: 'No se recibieron archivos' 
                });
            }
            
            // Verificar que la noticia existe
            try {
                const noticia = await Noticias.getById(noticia_id);
                if (!noticia) {
                    return res.status(404).json({ 
                        error: 'Noticia no encontrada con ID: ' + noticia_id 
                    });
                }
                console.log('✅ Noticia encontrada:', noticia.titulo);
            } catch (error) {
                return res.status(404).json({ 
                    error: 'Error verificando noticia: ' + error.message 
                });
            }
            
            const imagenesGuardadas = [];
            
            for (let i = 0; i < req.files.length; i++) {
                const archivo = req.files[i];
                
                try {
                    const tipoArchivo = this.obtenerTipoArchivo(archivo.filename, null);
                    
                    const imagenData = {
                        imagen_url: `/uploads/noticias/${archivo.filename}`,
                        imagen_alt: archivo.originalname || `Archivo ${i + 1}`,
                        orden: i,
                        es_principal: false,
                        tipo_archivo: tipoArchivo,
                        tipo_mime: archivo.mimetype,
                        tamaño_archivo: archivo.size
                    };
                    
                    console.log(`📷 Guardando archivo ${i + 1}:`, imagenData);
                    
                    const imagenId = await Noticias.agregarImagen(noticia_id, imagenData);
                    
                    imagenesGuardadas.push({
                        id_imagen: imagenId,
                        ...imagenData,
                        tipo: tipoArchivo
                    });
                    
                    console.log(`✅ Archivo ${i + 1} guardado con ID:`, imagenId);
                    
                } catch (error) {
                    console.error(`❌ Error guardando archivo ${i + 1}:`, error);
                }
            }
            
            res.json({
                success: true,
                message: `${imagenesGuardadas.length} archivos subidos correctamente`,
                imagenes: imagenesGuardadas,
                total: imagenesGuardadas.length
            });
            
        } catch (error) {
            console.error('❌ Error subiendo imágenes:', error);
            res.status(500).json({ 
                error: 'Error subiendo archivos',
                details: error.message 
            });
        }
    }

    // Eliminar imagen
    async eliminarImagen(req, res) {
        try {
            const { imagenId } = req.params;
            console.log('🗑️ Eliminando imagen ID:', imagenId);
            
            const resultado = await Noticias.eliminarImagen(imagenId);
            
            res.json({
                success: true,
                message: 'Imagen eliminada correctamente',
                noticia_id: resultado.noticia_id
            });
            
        } catch (error) {
            console.error('❌ Error eliminando imagen:', error);
            res.status(500).json({ 
                error: 'Error eliminando imagen',
                details: error.message 
            });
        }
    }

    // Subida masiva optimizada para grandes volúmenes
    async subirImagenesMasivo(req, res) {
        try {
            console.log('📤 Subida masiva iniciada...');
            console.log('📊 Archivos recibidos:', req.files?.length || 0);
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se enviaron archivos'
                });
            }

            // Estadísticas iniciales
            const totalArchivos = req.files.length;
            const pesoTotal = req.files.reduce((total, file) => total + file.size, 0);
            const pesoTotalMB = (pesoTotal / (1024 * 1024)).toFixed(2);
            
            console.log(`📊 Procesando ${totalArchivos} archivos (${pesoTotalMB} MB total)`);

            // Procesar en lotes para optimizar rendimiento
            const tamanoLote = 10; // Procesar de 10 en 10
            const lotes = [];
            
            for (let i = 0; i < req.files.length; i += tamanoLote) {
                lotes.push(req.files.slice(i, i + tamanoLote));
            }

            const imagenesSubidas = [];
            const errores = [];

            // Procesar lotes secuencialmente
            for (let loteIndex = 0; loteIndex < lotes.length; loteIndex++) {
                const lote = lotes[loteIndex];
                console.log(`📦 Procesando lote ${loteIndex + 1}/${lotes.length} (${lote.length} archivos)`);

                // Procesar archivos del lote en paralelo
                const promesasLote = lote.map(async (file, indexEnLote) => {
                    const indexGlobal = loteIndex * tamanoLote + indexEnLote;
                    
                    try {
                        const imagenUrl = `/uploads/noticias/${file.filename}`;
                        
                        // Opcional: Guardar en base de datos
                        if (req.body.noticia_id) {
                            await Noticias.agregarImagen(req.body.noticia_id, {
                                imagen_url: imagenUrl,
                                imagen_alt: file.originalname,
                                orden: indexGlobal + 1,
                                es_principal: false
                            });
                        }

                        return {
                            id: `lote_${loteIndex}_${indexEnLote}`,
                            imagen_url: imagenUrl,
                            imagen_alt: file.originalname,
                            nombre_original: file.originalname,
                            tamano: file.size,
                            tamano_mb: (file.size / (1024 * 1024)).toFixed(2),
                            orden: indexGlobal + 1,
                            lote: loteIndex + 1,
                            filename: file.filename,
                            mimetype: file.mimetype
                        };
                    } catch (error) {
                        console.error(`❌ Error en archivo ${indexGlobal + 1}:`, error);
                        return {
                            error: true,
                            archivo: file.originalname,
                            mensaje: error.message,
                            lote: loteIndex + 1,
                            index: indexGlobal + 1
                        };
                    }
                });

                // Esperar a que termine el lote actual
                const resultadosLote = await Promise.all(promesasLote);
                
                // Separar exitosos de errores
                resultadosLote.forEach(resultado => {
                    if (resultado.error) {
                        errores.push(resultado);
                    } else {
                        imagenesSubidas.push(resultado);
                    }
                });

                console.log(`✅ Lote ${loteIndex + 1} completado: ${resultadosLote.filter(r => !r.error).length} exitosos`);
                
                // Pequeña pausa entre lotes para no saturar el servidor
                if (loteIndex < lotes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Estadísticas finales
            const estadisticas = {
                total_archivos: totalArchivos,
                exitosas: imagenesSubidas.length,
                fallidas: errores.length,
                peso_total_bytes: pesoTotal,
                peso_total_mb: pesoTotalMB,
                tiempo_procesamiento: new Date().toISOString(),
                lotes_procesados: lotes.length,
                promedio_por_lote: (totalArchivos / lotes.length).toFixed(1),
                promedio_tamano_mb: (pesoTotal / totalArchivos / (1024 * 1024)).toFixed(2),
                tasa_exito: ((imagenesSubidas.length / totalArchivos) * 100).toFixed(1) + '%'
            };

            console.log('📊 Estadísticas finales:', estadisticas);

            res.json({
                success: true,
                message: `Subida masiva completada: ${imagenesSubidas.length}/${totalArchivos} imágenes procesadas correctamente`,
                imagenes: imagenesSubidas,
                errores: errores.length > 0 ? errores : undefined,
                estadisticas
            });

        } catch (error) {
            console.error('❌ Error en subida masiva:', error);
            res.status(500).json({
                success: false,
                message: 'Error en subida masiva',
                error: error.message
            });
        }
    }

    // Subir imagen principal + galería
    async subirImagenesCompleto(req, res) {
        try {
            console.log('📤 Subiendo imágenes completas...');
            console.log('📁 Archivos recibidos:', req.files);

            const resultado = {
                imagen_principal: null,
                imagenes_galeria: []
            };

            // Procesar imagen principal
            if (req.files.imagen_principal && req.files.imagen_principal[0]) {
                const file = req.files.imagen_principal[0];
                resultado.imagen_principal = {
                    filename: file.filename,
                    originalname: file.originalname,
                    imagen_url: `/uploads/noticias/${file.filename}`,
                    size: file.size,
                    mimetype: file.mimetype
                };
            }

            // Procesar imágenes de galería sin límites
            if (req.files.imagenes_galeria && req.files.imagenes_galeria.length > 0) {
                resultado.imagenes_galeria = req.files.imagenes_galeria.map((file, index) => ({
                    id: `galeria_${index}`,
                    filename: file.filename,
                    originalname: file.originalname,
                    imagen_url: `/uploads/noticias/${file.filename}`,
                    size: file.size,
                    tamano_mb: (file.size / (1024 * 1024)).toFixed(2),
                    mimetype: file.mimetype,
                    orden: index + 1
                }));
            }

            console.log('✅ Resultado procesado:', {
                imagen_principal: !!resultado.imagen_principal,
                imagenes_galeria: resultado.imagenes_galeria.length
            });

            res.json({
                success: true,
                message: `Imágenes subidas: ${resultado.imagen_principal ? 1 : 0} principal, ${resultado.imagenes_galeria.length} galería`,
                ...resultado
            });

        } catch (error) {
            console.error('❌ Error subiendo imágenes completas:', error);
            res.status(500).json({ 
                error: 'Error subiendo imágenes',
                details: error.message 
            });
        }
    }

    // Subir imagen única (mantener compatibilidad)
    async subirImagen(req, res) {
        try {
            console.log('📤 Subiendo imagen única...');
            
            if (!req.file) {
                return res.status(400).json({ error: 'No se recibió archivo' });
            }

            const imageUrl = `/uploads/noticias/${req.file.filename}`;
            
            console.log('✅ Imagen subida:', imageUrl);

            res.json({
                success: true,
                message: 'Imagen subida exitosamente',
                imageUrl: imageUrl,
                imagen_url: imageUrl, // Compatibilidad
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                tamano_mb: (req.file.size / (1024 * 1024)).toFixed(2)
            });

        } catch (error) {
            console.error('❌ Error subiendo imagen:', error);
            res.status(500).json({ 
                error: 'Error subiendo imagen',
                details: error.message 
            });
        }
    }

    // Obtener imágenes de una noticia
    async obtenerImagenes(req, res) {
        try {
            const { id } = req.params;
            console.log('🔍 Obteniendo imágenes de noticia:', id);

            const imagenes = await Noticias.obtenerImagenes(id);

            res.json({
                success: true,
                imagenes: imagenes
            });

        } catch (error) {
            console.error('❌ Error obteniendo imágenes:', error);
            res.status(500).json({ 
                error: 'Error obteniendo imágenes',
                details: error.message 
            });
        }
    }

    // Agregar imagen a galería
    async agregarImagen(req, res) {
        try {
            const { id } = req.params;
            const { imagen_url, imagen_alt, orden = 0, es_principal = false } = req.body;

            console.log('➕ Agregando imagen a noticia:', id);

            const imagenId = await Noticias.agregarImagen(id, {
                imagen_url,
                imagen_alt,
                orden,
                es_principal
            });

            res.json({
                success: true,
                message: 'Imagen agregada exitosamente',
                imagenId: imagenId
            });

        } catch (error) {
            console.error('❌ Error agregando imagen:', error);
            res.status(500).json({ 
                error: 'Error agregando imagen',
                details: error.message 
            });
        }
    }

    // Endpoint para noticias destacadas
    async getDestacadas(req, res) {
        try {
            const { limit = 3 } = req.query;
            console.log('🌟 Solicitando noticias destacadas, límite:', limit);
            
            const noticias = await Noticias.getDestacadas(parseInt(limit));
            
            console.log('✅ Noticias destacadas enviadas:', {
                total: noticias.length,
                noticias: noticias.map(n => ({
                    id: n.id_noticia,
                    titulo: n.titulo,
                    fecha: n.fecha_publicacion,
                    destacado: n.destacado
                }))
            });
            
            res.json(noticias);
        } catch (error) {
            console.error('❌ Error obteniendo noticias destacadas:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor',
                details: error.message 
            });
        }
    }

    // Endpoint para noticias recientes
    async getRecientes(req, res) {
        try {
            const { limit = 6 } = req.query;
            console.log('🕒 Solicitando noticias recientes, límite:', limit);
            
            const noticias = await Noticias.getRecientes(parseInt(limit));
            
            console.log('✅ Noticias recientes enviadas:', noticias.length);
            
            res.json(noticias);
        } catch (error) {
            console.error('❌ Error obteniendo noticias recientes:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor',
                details: error.message 
            });
        }
    }

    // Obtener imágenes de una noticia con formato mejorado
    async obtenerImagenesNoticia(req, res) {
      try {
        const { id } = req.params;
        console.log('🔍 Obteniendo imágenes para noticia ID:', id);
        
        const imagenes = await Noticias.obtenerImagenes(id);
        console.log('📸 Imágenes encontradas:', imagenes.length);
        
        // Procesar imágenes sin usar this.obtenerTipoArchivo
        const imagenesFormateadas = imagenes.map(img => {
          // Usar el tipo_archivo de la BD o determinar por extensión
          let tipoFinal = img.tipo_archivo || 'imagen';
          
          // Si no hay tipo_archivo en BD, determinar por URL
          if (!img.tipo_archivo && img.imagen_url) {
            const extension = img.imagen_url.split('.').pop().toLowerCase().split('?')[0];
            if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension)) {
              tipoFinal = 'video';
            } else if (['gif'].includes(extension)) {
              tipoFinal = 'gif';
            } else {
              tipoFinal = 'imagen';
            }
          }
          
          return {
            id_imagen: img.id_imagen,
            noticia_id: img.noticia_id,
            imagen_url: img.imagen_url,
            imagen_alt: img.imagen_alt,
            orden: img.orden,
            es_principal: img.es_principal,
            tipo_archivo: tipoFinal,
            tipo_mime: img.tipo_mime,
            tamaño_archivo: img.tamaño_archivo,
            fecha_subida: img.fecha_subida,
            tipo: tipoFinal // Campo adicional para el frontend
          };
        });
        
        res.json({
          success: true,
          imagenes: imagenesFormateadas,
          total: imagenesFormateadas.length
        });
        
      } catch (error) {
        console.error('❌ Error obteniendo imágenes:', error);
        res.status(500).json({ 
          error: 'Error obteniendo imágenes',
          details: error.message 
        });
      }
    }

    // Método auxiliar para determinar tipo de archivo mejorado
    obtenerTipoArchivo(url, tipoArchivo = null) {
        // Si ya tenemos el tipo_archivo de la BD, usarlo
        if (tipoArchivo && ['imagen', 'video', 'gif'].includes(tipoArchivo)) {
            return tipoArchivo;
        }
        
        if (!url) return 'imagen';
        
        const extension = url.split('.').pop().toLowerCase();
        
        // Videos
        if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'm4v'].includes(extension)) {
            return 'video';
        }
        
        // GIFs
        if (['gif'].includes(extension)) {
            return 'gif';
        }
        
        // Por defecto, imagen
        return 'imagen';
    }

    // Obtener imágenes con nombres de campos correctos
    static async obtenerImagenes(noticiaId) {
        try {
            console.log('🔍 Buscando imágenes para noticia ID:', noticiaId);
            
            // Usar id_imagen en lugar de id
            const query = `
              SELECT 
                id_imagen,
                noticia_id,
                imagen_url,
                imagen_alt,
                orden,
                es_principal,
                tipo_archivo,
                tipo_mime,
                tamaño_archivo,
                fecha_subida
              FROM noticias_imagenes 
              WHERE noticia_id = ? 
              ORDER BY orden ASC, es_principal DESC, fecha_subida ASC
            `;
            
            const result = await execute(query, [noticiaId]);
            console.log('📊 Resultado bruto de BD:', result);
            
            let imagenes = [];
            
            if (Array.isArray(result)) {
              imagenes = result;
            } else if (result && Array.isArray(result[0])) {
              imagenes = result[0];
            }
            
            console.log('✅ Imágenes procesadas:', imagenes.length);
            return imagenes;
            
        } catch (error) {
            console.error('❌ Error en obtenerImagenes:', error);
            throw error;
        }
    }

    // Subir archivos temporales (para vista previa antes de crear noticia)
    async subirArchivosTemporales(req, res) {
        try {
            console.log('📤 Subiendo archivos temporales...');
            console.log('📊 Archivos recibidos:', req.files);
            
            if (!req.files || Object.keys(req.files).length === 0) {
              return res.status(400).json({
                success: false,
                message: 'No se enviaron archivos'
              });
            }

            const archivosSubidos = [];
            
            // Procesar todos los archivos de todos los campos
            Object.keys(req.files).forEach(fieldName => {
              const filesArray = req.files[fieldName];
              
              filesArray.forEach((file, index) => {
                const tipoArchivo = file.mimetype.startsWith('video/') ? 'video' : 'imagen';
                
                archivosSubidos.push({
                  id_temporal: `temp_${Date.now()}_${index}`,
                  filename: file.filename,
                  originalname: file.originalname,
                  imagen_url: `/uploads/noticias/${file.filename}`,
                  url_completa: `http://localhost:5000/uploads/noticias/${file.filename}`,
                  size: file.size,
                  tamano_mb: (file.size / (1024 * 1024)).toFixed(2),
                  mimetype: file.mimetype,
                  tipo_archivo: tipoArchivo,
                  es_temporal: true,
                  fecha_subida: new Date().toISOString(),
                  // Datos formateados para BD
                  datos_bd: {
                    imagen_url: `/uploads/noticias/${file.filename}`,
                    imagen_alt: file.originalname,
                    tipo_archivo: tipoArchivo,
                    tipo_mime: file.mimetype,
                    tamaño_archivo: file.size,
                    es_principal: false
                  }
                });
              });
            });

            console.log('✅ Archivos temporales procesados:', archivosSubidos.length);

            res.json({
              success: true,
              message: 'Archivos subidos correctamente',
              archivos: archivosSubidos
            });

        } catch (error) {
            console.error('❌ Error subiendo archivos temporales:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Crear noticia con archivos
    static async crearNoticia(req, res) {
      try {
        console.log('📥 Creando nueva noticia...');
        console.log('📋 Datos recibidos:', req.body);
        console.log('📁 Archivos recibidos:', req.files);

        const {
          titulo,
          contenido,
          resumen = '',
          autor = 'Administrador',
          categoria = 'General',
          visible = true,
          destacado = false,
          fecha_publicacion
        } = req.body;

        // Validaciones básicas
        if (!titulo || !contenido) {
          return res.status(400).json({
            error: 'Título y contenido son obligatorios'
          });
        }

        // Generar slug
        const slug = titulo
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();

        // Procesar imagen principal
        let imagenPrincipal = null;
        if (req.files && req.files.imagen && req.files.imagen[0]) {
          const archivo = req.files.imagen[0];
          imagenPrincipal = `/uploads/noticias/${archivo.filename}`;
          console.log('🖼️ Imagen principal:', imagenPrincipal);
        }

        // Crear noticia en BD
        const queryNoticia = `
          INSERT INTO noticias (
            titulo, slug, contenido, resumen, fecha_publicacion, 
            autor, categoria, imagen_principal, visible, destacado
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const fechaPublicacion = fecha_publicacion || new Date().toISOString().split('T')[0];

        const resultNoticia = await execute(queryNoticia, [
          titulo,
          slug,
          contenido,
          resumen,
          fechaPublicacion,
          autor,
          categoria,
          imagenPrincipal,
          visible === 'true' || visible === true,
          destacado === 'true' || destacado === true
        ]);

        const noticiaId = resultNoticia.insertId;
        console.log('✅ Noticia creada con ID:', noticiaId);

        // Procesar galería de imágenes
        if (req.files && req.files.imagenes_galeria) {
          console.log('📸 Procesando galería:', req.files.imagenes_galeria.length, 'archivos');
          
          for (let i = 0; i < req.files.imagenes_galeria.length; i++) {
            const archivo = req.files.imagenes_galeria[i];
            const imagenUrl = `/uploads/noticias/${archivo.filename}`;
            
            const queryImagen = `
              INSERT INTO noticias_imagenes (
                noticia_id, imagen_url, imagen_alt, orden, 
                tipo_archivo, tipo_mime, tamaño_archivo
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            await execute(queryImagen, [
              noticiaId,
              imagenUrl,
              archivo.originalname,
              i,
              archivo.mimetype.startsWith('video/') ? 'video' : 'imagen',
              archivo.mimetype,
              archivo.size
            ]);

            console.log(`📁 Archivo ${i + 1} guardado:`, imagenUrl);
          }
        }

        // Obtener noticia completa
        const noticiaCompleta = await Noticias.getById(noticiaId);

        res.status(201).json({
          message: 'Noticia creada exitosamente',
          noticia: noticiaCompleta
        });

      } catch (error) {
        console.error('❌ Error creando noticia:', error);
        res.status(500).json({
          error: 'Error interno del servidor',
          details: error.message
        });
      }
    }

    // Obtener imágenes de una noticia por slug
    async getImagenesNoticia(req, res) {
        try {
            const { slug } = req.params;
            
            // Obtener la noticia
            const noticia = await Noticias.getBySlugSinIncrementar(slug);
            if (!noticia) {
                return res.status(404).json({ error: 'Noticia no encontrada' });
            }
            
            // Obtener las imágenes
            const imagenes = await Noticias.getImagenes(noticia.id_noticia);
            
            res.json({
                success: true,
                noticia: noticia.titulo,
                imagenes: imagenes
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo imágenes:', error);
            res.status(500).json({ 
                error: 'Error obteniendo imágenes de la noticia'
            });
        }
    }
}

// Método para obtener imágenes
obtenerImagenes: async (noticiaId) => {
  try {
    console.log('🔍 Obteniendo multimedia para noticia ID:', noticiaId);
    
    const query = `
      SELECT 
        id_imagen,
        noticia_id,
        imagen_url,
        imagen_alt,
        orden,
        es_principal,
        tipo_archivo,
        tipo_mime,
        tamaño_archivo,
        fecha_subida
      FROM noticias_imagenes 
      WHERE noticia_id = ? 
      ORDER BY orden ASC, es_principal DESC, fecha_subida ASC
    `;
    
    const imagenes = await execute(query, [noticiaId]);
    
    console.log(`📊 Encontradas ${imagenes.length} multimedia para noticia ${noticiaId}`);
    if (imagenes.length > 0) {
      imagenes.forEach((img, index) => {
        console.log(`  ${index + 1}. ID: ${img.id_imagen}, Tipo: ${img.tipo_archivo}, URL: ${img.imagen_url}`);
      });
    }
    
    return imagenes;
    
  } catch (error) {
    console.error('❌ Error obteniendo multimedia:', error);
    throw error;
  }
},

module.exports = new NoticiasController();