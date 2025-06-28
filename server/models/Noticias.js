const { execute } = require('../config/database');

class Noticias {
    // Obtener todas las noticias públicas
    static async getAll(filtros = {}) {
        try {
            console.log('📋 Obteniendo todas las noticias con filtros:', filtros);
            
            let query = `
                SELECT 
                    n.id_noticia,
                    n.titulo,
                    n.slug,
                    n.resumen,
                    n.imagen_principal,
                    n.autor,
                    n.categoria,
                    n.fecha_publicacion,
                    n.vistas,
                    n.destacado,
                    n.visible
                FROM noticias n
            `;
            
            const conditions = [];
            const params = [];
            
            // Solo noticias visibles
            conditions.push('n.visible = TRUE');
            
            // Filtro por categoría
            if (filtros.categoria) {
                conditions.push('n.categoria = ?');
                params.push(filtros.categoria);
            }
            
            // Filtro por autor
            if (filtros.autor) {
                conditions.push('n.autor = ?');
                params.push(filtros.autor);
            }
            
            // Filtro de búsqueda
            if (filtros.busqueda) {
                conditions.push('(n.titulo LIKE ? OR n.contenido LIKE ? OR n.resumen LIKE ?)');

                const busquedaParam = `%${filtros.busqueda}%`;
                params.push(busquedaParam, busquedaParam, busquedaParam);
            }
            
            // Solo destacadas
            if (filtros.destacadas) {
                conditions.push('n.destacado = TRUE');
            }
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' ORDER BY n.fecha_publicacion DESC';
            
            // Límite
            if (filtros.limite) {
                query += ' LIMIT ?';
                params.push(parseInt(filtros.limite));
            }
            
            const result = await execute(query, params);
            const noticias = Array.isArray(result) ? result : (result[0] || []);
            
            console.log('✅ Noticias obtenidas:', noticias.length);
            return noticias;
        } catch (error) {
            console.error('❌ Error obteniendo noticias:', error);
            throw error;
        }
    }

    // Obtener noticia por slug
    static async getBySlug(slug) {
        try {
            console.log('🔍 Buscando noticia por slug CON incremento de vista:', slug);
            
            // ✅ PRIMERO incrementar vistas
            const updateResult = await execute(`
                UPDATE noticias 
                SET vistas = vistas + 1 
                WHERE slug = ? AND visible = TRUE
            `, [slug]);
            
            console.log('👁️ Vistas incrementadas, affected rows:', updateResult.affectedRows);

            // ✅ LUEGO obtener noticia
            const query = `
                SELECT 
                    id_noticia,
                    titulo,
                    slug,
                    contenido,
                    resumen,
                    imagen_principal,
                    autor,
                    categoria,
                    fecha_publicacion,
                    fecha_actualizacion,
                    vistas,
                    destacado,
                    visible
                FROM noticias 
                WHERE slug = ? AND visible = TRUE
            `;
            
            const result = await execute(query, [slug]);
            const noticias = Array.isArray(result) ? result : (result[0] || []);
            
            if (noticias.length === 0) {
                return null;
            }
            
            const noticia = noticias[0];
            console.log('📰 Noticia encontrada CON vista incrementada:', {
                titulo: noticia.titulo,
                vistas: noticia.vistas
            });
            
            // ✅ OBTENER IMÁGENES ASOCIADAS
            try {
                const imagenes = await this.obtenerImagenes(noticia.id_noticia);
                noticia.imagenes = imagenes;
                console.log('📸 Imágenes agregadas a la noticia:', imagenes.length);
            } catch (error) {
                console.log('⚠️ Error cargando imágenes, continuando sin ellas:', error.message);
                noticia.imagenes = [];
            }
            
            return noticia;
        } catch (error) {
            console.error('❌ Error obteniendo noticia por slug CON incremento:', error);
            throw error;
        }
    }

    // ✅ NUEVO MÉTODO: Obtener noticia SIN incrementar vistas
    static async getBySlugSinIncrementar(slug) {
        try {
            console.log('🔍 Buscando noticia por slug SIN incrementar vista:', slug);

            // ✅ Solo obtener noticia, NO incrementar vistas
            const query = `
                SELECT 
                    id_noticia,
                    titulo,
                    slug,
                    contenido,
                    resumen,
                    imagen_principal,
                    autor,
                    categoria,
                    fecha_publicacion,
                    fecha_actualizacion,
                    vistas,
                    destacado,
                    visible
                FROM noticias 
                WHERE slug = ? AND visible = TRUE
            `;
            
            const result = await execute(query, [slug]);
            const noticias = Array.isArray(result) ? result : (result[0] || []);
            
            if (noticias.length === 0) {
                return null;
            }
            
            const noticia = noticias[0];
            console.log('📰 Noticia encontrada (sin incrementar vista):', noticia.titulo);
            
            // ✅ OBTENER IMÁGENES ASOCIADAS
            try {
                const imagenes = await this.obtenerImagenes(noticia.id_noticia);
                noticia.imagenes = imagenes;
                console.log('📸 Imágenes agregadas a la noticia:', imagenes.length);
            } catch (error) {
                console.log('⚠️ Error cargando imágenes, continuando sin ellas:', error.message);
                noticia.imagenes = [];
            }
            
            return noticia;
        } catch (error) {
            console.error('❌ Error obteniendo noticia por slug (sin incrementar):', error);
            throw error;
        }
    }

    // Crear nueva noticia
    static async create(noticiaData) {
        try {
            const {
                titulo, contenido, resumen, autor, categoria,
                imagen_principal, visible = true, destacado = false
            } = noticiaData;

            console.log('📝 Datos a insertar:', {
                titulo, contenido, resumen, autor, categoria,
                imagen_principal, visible, destacado
            });

            // ✅ Generar slug único basado en el título
            const slug = titulo.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 100);

            // ✅ USAR CURDATE() AUTOMÁTICAMENTE - SIN fecha manual
            const result = await execute(`
                INSERT INTO noticias (titulo, slug, contenido, resumen, fecha_publicacion, autor, categoria, 
                                    imagen_principal, visible, destacado)
                VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?)
            `, [titulo, slug, contenido, resumen, autor, categoria, imagen_principal, visible, destacado]);

            const insertId = result.insertId || (result[0] && result[0].insertId);
            console.log('✅ Noticia creada con ID:', insertId);
            
            return insertId;
        } catch (error) {
            console.error('❌ Error en create:', error);
            throw error;
        }
    }

    // Actualizar noticia
    static async update(id, noticiaData) {
        try {
            const {
                titulo, contenido, resumen, autor, categoria,
                imagen_principal, visible, destacado
            } = noticiaData;

            const result = await execute(`
                UPDATE noticias SET
                    titulo = ?, contenido = ?, resumen = ?, autor = ?, categoria = ?,
                    imagen_principal = ?, visible = ?, destacado = ?
                WHERE id_noticia = ?
            `, [titulo, contenido, resumen, autor, categoria, imagen_principal, visible, destacado, id]);

            const affectedRows = result.affectedRows || (result[0] && result[0].affectedRows);
            return affectedRows > 0;
        } catch (error) {
            console.error('❌ Error en update:', error);
            throw error;
        }
    }

    // Eliminar noticia
    static async delete(id) {
        try {
            const result = await execute(`
                DELETE FROM noticias WHERE id_noticia = ?
            `, [id]);

            const affectedRows = result.affectedRows || (result[0] && result[0].affectedRows);
            return affectedRows > 0;
        } catch (error) {
            console.error('❌ Error en delete:', error);
            throw error;
        }
    }

    // Incrementar vistas
    static async incrementarVistas(slug) {
        try {
            await execute(`
                UPDATE noticias SET vistas = vistas + 1 
                WHERE slug = ? AND visible = TRUE
            `, [slug]);
            console.log('👀 Vistas incrementadas para:', slug);
        } catch (error) {
            console.error('❌ Error incrementando vistas:', error);
            throw error;
        }
    }

    // ✅ MÉTODO PARA AGREGAR IMAGEN CON CAMPOS CORRECTOS
    static async agregarImagen(noticiaId, imagenData) {
        try {
            const { 
                imagen_url, 
                imagen_alt, 
                orden = 0, 
                es_principal = false,
                tipo_archivo = 'imagen',
                tipo_mime = null,
                tamaño_archivo = null 
            } = imagenData;
            
            console.log('📷 Insertando imagen en BD:', {
                noticiaId,
                imagen_url,
                imagen_alt,
                orden,
                es_principal
            });
            
            const result = await execute(`
                INSERT INTO noticias_imagenes (
                    noticia_id, 
                    imagen_url, 
                    imagen_alt, 
                    orden, 
                    es_principal, 
                    tipo_archivo,
                    tipo_mime,
                    tamaño_archivo
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                noticiaId, 
                imagen_url, 
                imagen_alt || '', 
                orden, 
                es_principal ? 1 : 0, 
                tipo_archivo,
                tipo_mime,
                tamaño_archivo
            ]);

            const insertId = result.insertId || (result[0] && result[0].insertId);
            console.log('✅ Imagen insertada con ID:', insertId);
            
            return insertId;
            
        } catch (error) {
            console.error('❌ Error en agregarImagen:', error);
            throw error;
        }
    }

    // ✅ MÉTODO OBTENER IMÁGENES CON CAMPOS CORRECTOS
    static async obtenerImagenes(noticiaId) {
        try {
            console.log('🔍 Buscando imágenes para noticia ID:', noticiaId);
            
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
                ORDER BY orden ASC, fecha_subida ASC
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

    // ✅ MÉTODO PARA ELIMINAR IMAGEN CON CAMPO CORRECTO
    static async eliminarImagen(imagenId) {
        try {
            console.log('🗑️ Eliminando imagen ID:', imagenId);
            
            // Primero obtener la URL para eliminar el archivo físico
            const imagenQuery = `
                SELECT imagen_url, noticia_id 
                FROM noticias_imagenes 
                WHERE id_imagen = ?
            `;
            
            const imagenResult = await execute(imagenQuery, [imagenId]);
            
            if (!imagenResult || imagenResult.length === 0) {
                throw new Error('Imagen no encontrada');
            }
            
            const imagen = Array.isArray(imagenResult) ? imagenResult[0] : imagenResult;
            
            // Eliminar de la base de datos
            const deleteQuery = `DELETE FROM noticias_imagenes WHERE id_imagen = ?`;
            const deleteResult = await execute(deleteQuery, [imagenId]);
            
            // Eliminar archivo físico
            if (imagen.imagen_url) {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const filePath = path.join(__dirname, '../uploads/noticias', path.basename(imagen.imagen_url));
                    
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log('🗑️ Archivo físico eliminado:', filePath);
                    }
                } catch (fileError) {
                    console.warn('⚠️ Error eliminando archivo físico:', fileError.message);
                }
            }
            
            return {
                success: true,
                message: 'Imagen eliminada correctamente',
                noticia_id: imagen.noticia_id
            };
            
        } catch (error) {
            console.error('❌ Error eliminando imagen:', error);
            throw error;
        }
    }

    // Obtener noticias destacadas
    static async getDestacadas(limit = 6) {
        try {
            const query = `
                SELECT 
                    id_noticia,
                    titulo,
                    slug,
                    resumen,
                    imagen_principal,
                    autor,
                    categoria,
                    fecha_publicacion,
                    vistas,
                    destacado,
                    visible
                FROM noticias 
                WHERE visible = TRUE AND destacado = TRUE
                ORDER BY fecha_publicacion DESC
                LIMIT ?
            `;
            
            const result = await execute(query, [limit]);
            return Array.isArray(result) ? result : (result[0] || []);
        } catch (error) {
            console.error('❌ Error obteniendo noticias destacadas:', error);
            throw error;
        }
    }

    // Obtener noticias recientes
    static async getRecientes(limit = 5) {
        try {
            const query = `
                SELECT 
                    id_noticia,
                    titulo,
                    slug,
                    resumen,
                    imagen_principal,
                    autor,
                    categoria,
                    fecha_publicacion,
                    vistas,
                    destacado,
                    visible
                FROM noticias 
                WHERE visible = TRUE
                ORDER BY fecha_publicacion DESC
                LIMIT ?
            `;
            
            const result = await execute(query, [limit]);
            return Array.isArray(result) ? result : (result[0] || []);
        } catch (error) {
            console.error('❌ Error obteniendo noticias recientes:', error);
            throw error;
        }
    }

    // ✅ MÉTODO PARA OBTENER NOTICIA POR ID
    static async getById(id) {
        try {
            console.log('🔍 Buscando noticia por ID:', id);
            
            const query = `
                SELECT 
                    id_noticia,
                    titulo,
                    slug,
                    contenido,
                    resumen,
                    fecha_publicacion,
                    autor,
                    categoria,
                    imagen_principal,
                    visible,
                    destacado,
                    vistas
                FROM noticias 
                WHERE id_noticia = ?
            `;
            
            const result = await execute(query, [id]);
            
            if (Array.isArray(result) && result.length > 0) {
                return result[0];
            } else if (result && result[0] && result[0].length > 0) {
                return result[0][0];
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Error obteniendo noticia por ID:', error);
            throw error;
        }
    }

    // ✅ AGREGAR: Método para guardar imágenes en BD
    static async agregarImagen(noticiaId, imagenData) {
        const query = `
            INSERT INTO noticias_imagenes 
            (noticia_id, imagen_url, imagen_alt, orden, es_principal, tipo_archivo, tipo_mime, tamaño_archivo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            noticiaId,
            imagenData.imagen_url,
            imagenData.imagen_alt || '',
            imagenData.orden || 0,
            imagenData.es_principal || false,
            imagenData.tipo_archivo || 'imagen',
            imagenData.tipo_mime || null,
            imagenData.tamaño_archivo || null
        ];
        
        const result = await execute(query, values);
        return result.insertId;
    }

    // ✅ SOLO AGREGAR: Método para guardar archivos en BD
    static async guardarArchivosEnBD(noticiaId, archivos) {
        if (!archivos || archivos.length === 0) return;
        
        console.log(`📸 Guardando ${archivos.length} archivos en BD para noticia ${noticiaId}`);
        
        for (let i = 0; i < archivos.length; i++) {
            const archivo = archivos[i];
            const tipoArchivo = archivo.mimetype.startsWith('video/') ? 'video' : 'imagen';
            
            const query = `
                INSERT INTO noticias_imagenes 
                (noticia_id, imagen_url, imagen_alt, orden, es_principal, tipo_archivo, tipo_mime, tamaño_archivo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            try {
                await execute(query, [
                    noticiaId,
                    `/uploads/noticias/${archivo.filename}`,
                    archivo.originalname || `Archivo ${i + 1}`,
                    i,
                    i === 0, // Primera imagen es principal
                    tipoArchivo,
                    archivo.mimetype,
                    archivo.size
                ]);
                
                console.log(`✅ Archivo ${i + 1} guardado: ${archivo.filename}`);
            } catch (error) {
                console.error(`❌ Error guardando archivo ${i + 1}:`, error);
            }
        }
    }

    // ✅ AGREGAR: Método para obtener imágenes de una noticia
    static async getImagenes(noticiaId) {
        const query = `
            SELECT * FROM noticias_imagenes 
            WHERE noticia_id = ? 
            ORDER BY orden ASC, id_imagen ASC
        `;
        return await execute(query, [noticiaId]);
    }
}

module.exports = Noticias;