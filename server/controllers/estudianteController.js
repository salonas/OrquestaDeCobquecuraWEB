const { execute } = require('../config/database');

const estudianteController = {
    // Dashboard del estudiante
    async getDashboard(req, res) {
        try {
            const estudiante_rut = req.estudiante.userId;
            
            // Estadísticas generales
            const [stats] = await execute(`
                SELECT 
                    (SELECT COUNT(*) FROM tareas WHERE estudiante_rut = ? AND estado = 'pendiente') as tareas_pendientes,
                    (SELECT COUNT(*) FROM horarios_clases WHERE estudiante_rut = ? AND estado = 'activo') as clases_semana,
                    (SELECT COUNT(*) FROM evaluaciones WHERE estudiante_rut = ? AND MONTH(fecha_evaluacion) = MONTH(CURRENT_DATE())) as evaluaciones_mes,
                    (SELECT COUNT(*) FROM prestamos WHERE estudiante_rut = ? AND estado = 'activo') as prestamos_activos
            `, [estudiante_rut, estudiante_rut, estudiante_rut, estudiante_rut]);

            // Próximas clases
            const [proximasClases] = await execute(`
                SELECT 
                    h.dia_semana as dia,
                    h.hora_inicio,
                    h.hora_fin,
                    h.materia,
                    h.aula,
                    CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre,
                    a.instrumento
                FROM horarios_clases h
                JOIN profesores p ON h.profesor_rut = p.rut
                JOIN asignaciones a ON h.profesor_rut = a.profesor_rut AND h.estudiante_rut = a.estudiante_rut
                WHERE h.estudiante_rut = ? AND h.estado = 'activo'
                ORDER BY 
                    FIELD(h.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'),
                    h.hora_inicio
                LIMIT 3
            `, [estudiante_rut]);

            // Tareas pendientes urgentes
            const [tareasPendientes] = await execute(`
                SELECT 
                    t.id,
                    t.titulo,
                    t.descripcion,
                    t.fecha_limite,
                    t.prioridad,
                    CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre
                FROM tareas t
                JOIN profesores p ON t.profesor_rut = p.rut
                WHERE t.estudiante_rut = ? AND t.estado = 'pendiente'
                ORDER BY t.fecha_limite ASC
                LIMIT 5
            `, [estudiante_rut]);

            // Últimas evaluaciones
            const [ultimasEvaluaciones] = await execute(`
                SELECT 
                    e.id,
                    e.tipo,
                    e.titulo,
                    e.fecha_evaluacion as fecha,
                    e.calificacion,
                    CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre
                FROM evaluaciones e
                JOIN profesores p ON e.profesor_rut = p.rut
                WHERE e.estudiante_rut = ?
                ORDER BY e.fecha_evaluacion DESC
                LIMIT 3
            `, [estudiante_rut]);

            res.json({
                stats: stats[0] || {
                    tareas_pendientes: 0,
                    clases_semana: 0,
                    evaluaciones_mes: 0,
                    prestamos_activos: 0
                },
                proximasClases: proximasClases || [],
                tareasPendientes: tareasPendientes || [],
                ultimasEvaluaciones: ultimasEvaluaciones || []
            });
        } catch (error) {
            console.error('Error obteniendo dashboard del estudiante:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener mi profesor principal
    async getMiProfesor(req, res) {
        try {
            const [profesores] = await execute(`
                SELECT 
                    p.rut,
                    p.nombres,
                    p.apellidos,
                    p.email,
                    p.telefono,
                    p.especialidad,
                    p.anos_experiencia,
                    p.estado,
                    a.instrumento,
                    a.fecha_asignacion
                FROM profesores p
                JOIN asignaciones a ON p.rut = a.profesor_rut
                WHERE a.estudiante_rut = ? AND a.estado = 'activa'
                LIMIT 1
            `, [req.estudiante.userId]);
            
            if (profesores.length === 0) {
                return res.status(404).json({ error: 'No tienes profesor asignado' });
            }
            
            res.json(profesores[0]);
        } catch (error) {
            console.error('Error obteniendo profesor del estudiante:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener horarios del estudiante
    async getHorarios(req, res) {
        try {
            const [horarios] = await execute(`
                SELECT 
                    h.id,
                    h.dia_semana as dia,
                    h.hora_inicio,
                    h.hora_fin,
                    h.materia,
                    h.aula,
                    h.estado,
                    CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre,
                    p.rut as profesor_rut,
                    a.instrumento
                FROM horarios_clases h
                JOIN profesores p ON h.profesor_rut = p.rut
                JOIN asignaciones a ON h.profesor_rut = a.profesor_rut AND h.estudiante_rut = a.estudiante_rut
                WHERE h.estudiante_rut = ? AND h.estado = 'activo'
                ORDER BY 
                    FIELD(h.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'),
                    h.hora_inicio
            `, [req.estudiante.userId]);
            
            res.json(horarios);
        } catch (error) {
            console.error('Error obteniendo horarios del estudiante:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener evaluaciones del estudiante
    async getEvaluaciones(req, res) {
        try {
            const [evaluaciones] = await execute(`
                SELECT 
                    e.id,
                    e.tipo,
                    e.titulo,
                    e.descripcion,
                    e.fecha_evaluacion as fecha,
                    e.calificacion,
                    e.observaciones,
                    e.fortalezas,
                    e.areas_mejora,
                    CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre,
                    r.titulo as repertorio_titulo
                FROM evaluaciones e
                JOIN profesores p ON e.profesor_rut = p.rut
                LEFT JOIN repertorio r ON e.repertorio_id = r.id
                WHERE e.estudiante_rut = ?
                ORDER BY e.fecha_evaluacion DESC
            `, [req.estudiante.userId]);
            
            res.json(evaluaciones);
        } catch (error) {
            console.error('Error obteniendo evaluaciones del estudiante:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener tareas del estudiante
    async getTareas(req, res) {
        try {
            const [tareas] = await execute(`
                SELECT 
                    t.id,
                    t.titulo,
                    t.descripcion,
                    t.tipo,
                    t.fecha_asignacion,
                    t.fecha_limite,
                    t.estado,
                    t.prioridad,
                    t.tiempo_estimado_minutos,
                    t.notas_profesor,
                    t.notas_estudiante,
                    t.fecha_completada,
                    CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre
                FROM tareas t
                JOIN profesores p ON t.profesor_rut = p.rut
                WHERE t.estudiante_rut = ?
                ORDER BY 
                    FIELD(t.estado, 'pendiente', 'en_progreso', 'completada', 'vencida'),
                    t.fecha_limite ASC
            `, [req.estudiante.userId]);
            
            res.json(tareas);
        } catch (error) {
            console.error('Error obteniendo tareas del estudiante:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Marcar tarea como completada
    async completarTarea(req, res) {
        try {
            const { id } = req.params;
            
            await execute(
                'UPDATE tareas SET estado = "completada", fecha_completada = NOW() WHERE id = ? AND estudiante_rut = ?',
                [id, req.estudiante.userId]
            );
            
            res.json({ mensaje: 'Tarea marcada como completada' });
        } catch (error) {
            console.error('Error completando tarea:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Actualizar progreso de tarea
    async actualizarProgresoTarea(req, res) {
        try {
            const { id } = req.params;
            const { progreso, notas_estudiante } = req.body;
            
            await execute(
                'UPDATE tareas SET progreso = ?, notas_estudiante = ? WHERE id = ? AND estudiante_rut = ?',
                [progreso, notas_estudiante, id, req.estudiante.userId]
            );
            
            res.json({ mensaje: 'Progreso actualizado' });
        } catch (error) {
            console.error('Error actualizando progreso:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener repertorio del estudiante
    async getRepertorio(req, res) {
        try {
            const [repertorio] = await execute(`
                SELECT 
                    r.id as id_pieza,
                    r.titulo,
                    r.compositor,
                    r.genero,
                    r.dificultad as nivel,
                    r.duracion_estimada as duracion,
                    r.notas,
                    r.partitura_url,
                    r.audio_referencia_url,
                    r.estado,
                    a.instrumento
                FROM repertorio r
                JOIN asignaciones a ON r.instrumento_categoria = a.instrumento
                WHERE a.estudiante_rut = ? AND a.estado = 'activa'
                ORDER BY r.fecha_creacion DESC
            `, [req.estudiante.userId]);
            
            res.json(repertorio);
        } catch (error) {
            console.error('Error obteniendo repertorio del estudiante:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener asistencia del estudiante
    async getAsistencia(req, res) {
        try {
            const { mes, año } = req.query;
            let whereClause = 'WHERE a.estudiante_rut = ?';
            let params = [req.estudiante.userId];
            
            if (mes && año) {
                whereClause += ' AND MONTH(a.fecha_clase) = ? AND YEAR(a.fecha_clase) = ?';
                params.push(mes, año);
            }
            
            const [asistencia] = await execute(`
                SELECT 
                    a.id,
                    a.fecha_clase,
                    a.hora_clase,
                    a.asistio,
                    a.llego_tarde,
                    a.minutos_tardanza,
                    a.justificacion,
                    a.observaciones,
                    CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre,
                    h.materia,
                    h.aula
                FROM asistencia a
                JOIN profesores p ON a.profesor_rut = p.rut
                LEFT JOIN horarios_clases h ON a.estudiante_rut = h.estudiante_rut 
                    AND a.profesor_rut = h.profesor_rut
                    AND h.dia_semana = DAYNAME(a.fecha_clase)
                    AND h.hora_inicio <= a.hora_clase 
                    AND h.hora_fin > a.hora_clase
                ${whereClause}
                ORDER BY a.fecha_clase DESC, a.hora_clase DESC
            `, params);
            
            res.json(asistencia);
        } catch (error) {
            console.error('Error obteniendo asistencia del estudiante:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener préstamos del estudiante
    async getPrestamos(req, res) {
        try {
            const [prestamos] = await execute(`
                SELECT 
                    p.id as id_prestamo,
                    p.fecha_prestamo,
                    p.fecha_devolucion_programada,
                    p.fecha_devolucion_real as fecha_devolucion,
                    p.estado,
                    p.observaciones_prestamo as observaciones,
                    p.observaciones_devolucion,
                    i.nombre as instrumento_nombre,
                    i.tipo as instrumento_tipo,
                    i.marca,
                    i.modelo,
                    CONCAT(pr.nombres, ' ', pr.apellidos) as profesor_nombres
                FROM prestamos p
                JOIN instrumentos i ON p.instrumento_id = i.id
                LEFT JOIN profesores pr ON p.profesor_rut = pr.rut
                WHERE p.estudiante_rut = ?
                ORDER BY p.fecha_prestamo DESC
            `, [req.estudiante.userId]);
            
            res.json(prestamos);
        } catch (error) {
            console.error('Error obteniendo préstamos del estudiante:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener notificaciones del estudiante
    async getNotificaciones(req, res) {
        try {
            const [notificaciones] = await execute(`
                SELECT 
                    n.id,
                    n.titulo,
                    n.mensaje,
                    n.tipo,
                    n.fecha_creacion,
                    n.leida,
                    CONCAT(p.nombres, ' ', p.apellidos) as remitente
                FROM notificaciones n
                LEFT JOIN profesores p ON n.remitente_rut = p.rut
                WHERE n.destinatario_rut = ? 
                ORDER BY n.fecha_creacion DESC
                LIMIT 20
            `, [req.estudiante.userId]);
            
            res.json(notificaciones);
        } catch (error) {
            console.error('Error obteniendo notificaciones del estudiante:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Marcar notificación como leída
    async marcarNotificacionLeida(req, res) {
        try {
            const { id } = req.params;
            
            await execute(
                'UPDATE notificaciones SET leida = TRUE WHERE id = ? AND destinatario_rut = ?',
                [id, req.estudiante.userId]
            );
            
            res.json({ mensaje: 'Notificación marcada como leída' });
        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener perfil del estudiante
    async getPerfil(req, res) {
        try {
            const [estudiante] = await execute(`
                SELECT 
                    e.rut,
                    e.nombres,
                    e.apellidos,
                    e.email,
                    e.telefono,
                    e.fecha_nacimiento,
                    e.fecha_ingreso,
                    e.estado,
                    e.notas_adicionales,
                    a.instrumento,
                    CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre
                FROM estudiantes e
                LEFT JOIN asignaciones a ON e.rut = a.estudiante_rut AND a.estado = 'activa'
                LEFT JOIN profesores p ON a.profesor_rut = p.rut
                WHERE e.rut = ?
            `, [req.estudiante.userId]);
            
            if (estudiante.length === 0) {
                return res.status(404).json({ error: 'Estudiante no encontrado' });
            }
            
            res.json(estudiante[0]);
        } catch (error) {
            console.error('Error obteniendo perfil del estudiante:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Actualizar perfil del estudiante
    async actualizarPerfil(req, res) {
        try {
            const { email, telefono } = req.body;
            
            await execute(
                'UPDATE estudiantes SET email = ?, telefono = ? WHERE rut = ?',
                [email, telefono, req.estudiante.userId]
            );
            
            res.json({ mensaje: 'Perfil actualizado correctamente' });
        } catch (error) {
            console.error('Error actualizando perfil del estudiante:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener progreso del estudiante
    async getProgreso(req, res) {
        try {
            const estudiante_rut = req.estudiante.userId;
            
            // Obtener progreso general
            const [progresoGeneral] = await execute(`
                SELECT 
                    AVG(e.calificacion) as promedio_general,
                    COUNT(DISTINCT e.id) as total_evaluaciones,
                    COUNT(DISTINCT t.id) as total_tareas,
                    COUNT(DISTINCT CASE WHEN t.estado = 'completada' THEN t.id END) as tareas_completadas
                FROM estudiantes est
                LEFT JOIN evaluaciones e ON est.rut = e.estudiante_rut
                LEFT JOIN tareas t ON est.rut = t.estudiante_rut
                WHERE est.rut = ?
                GROUP BY est.rut
            `, [estudiante_rut]);

            // Obtener progreso por materia (simulado con base en evaluaciones)
            const materias = [
                { id: 1, nombre: 'Técnica Instrumental', promedio: progresoGeneral[0]?.promedio_general || 0 },
                { id: 2, nombre: 'Teoría Musical', promedio: (progresoGeneral[0]?.promedio_general || 0) * 0.9 },
                { id: 3, nombre: 'Repertorio', promedio: (progresoGeneral[0]?.promedio_general || 0) * 1.1 }
            ];

            res.json({
                promedioGeneral: parseFloat(progresoGeneral[0]?.promedio_general || 0).toFixed(1),
                totalEvaluaciones: progresoGeneral[0]?.total_evaluaciones || 0,
                totalTareas: progresoGeneral[0]?.total_tareas || 0,
                tareasCompletadas: progresoGeneral[0]?.tareas_completadas || 0,
                materias: materias
            });
        } catch (error) {
            console.error('Error obteniendo progreso:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

module.exports = estudianteController;