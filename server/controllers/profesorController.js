const { execute } = require('../config/database');

const profesorController = {
    // Obtener perfil del profesor
    async getPerfil(req, res) {
        try {
            const [profesores] = await execute(
                'SELECT rut, nombres, apellidos, email, telefono, especialidad, anos_experiencia, estado, fecha_ingreso FROM profesores WHERE rut = ?',
                [req.profesor.userId]
            );
            
            if (profesores.length === 0) {
                return res.status(404).json({ error: 'Profesor no encontrado' });
            }
            
            res.json(profesores[0]);
        } catch (error) {
            console.error('Error obteniendo perfil profesor:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener dashboard con estadísticas
    async getDashboard(req, res) {
        try {
            const profesorRut = req.profesor.userId;

            // Estudiantes asignados activos
            const [estudiantes] = await execute(
                'SELECT COUNT(*) as total FROM asignaciones WHERE profesor_rut = ? AND estado = "activa"',
                [profesorRut]
            );
            
            // Clases programadas esta semana
            const [clases] = await execute(
                'SELECT COUNT(*) as total FROM horarios_clases WHERE profesor_rut = ? AND estado = "activo"',
                [profesorRut]
            );
            
            // Evaluaciones pendientes (próximas 7 días)
            const [evaluaciones] = await execute(
                'SELECT COUNT(*) as total FROM evaluaciones WHERE profesor_rut = ? AND fecha_evaluacion BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)',
                [profesorRut]
            );
            
            // Tareas asignadas pendientes
            const [tareas] = await execute(
                'SELECT COUNT(*) as total FROM tareas WHERE profesor_rut = ? AND estado IN ("pendiente", "en_progreso")',
                [profesorRut]
            );

            // Asistencia promedio del mes actual
            const [asistencia] = await execute(`
                SELECT ROUND(AVG(CASE WHEN asistio = 1 THEN 100 ELSE 0 END), 2) as promedio_asistencia
                FROM asistencia 
                WHERE profesor_rut = ? 
                AND YEAR(fecha_clase) = YEAR(CURDATE()) 
                AND MONTH(fecha_clase) = MONTH(CURDATE())
            `, [profesorRut]);

            res.json({
                estudiantesAsignados: estudiantes[0].total,
                clasesProgramadas: clases[0].total,
                evaluacionesPendientes: evaluaciones[0].total,
                tareasAsignadas: tareas[0].total,
                promedioAsistencia: asistencia[0].promedio_asistencia || 0
            });
        } catch (error) {
            console.error('Error obteniendo dashboard profesor:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener estudiantes asignados
    async getEstudiantes(req, res) {
        try {
            const [estudiantes] = await execute(`
                SELECT 
                    e.rut,
                    e.nombres,
                    e.apellidos,
                    e.email,
                    e.telefono,
                    e.estado,
                    e.fecha_ingreso,
                    a.instrumento,
                    a.fecha_asignacion,
                    a.estado as estado_asignacion,
                    COALESCE(AVG(ev.calificacion), 0) as promedio_calificaciones,
                    COUNT(DISTINCT t.id) as total_tareas,
                    COUNT(DISTINCT CASE WHEN t.estado = 'completada' THEN t.id END) as tareas_completadas
                FROM estudiantes e
                JOIN asignaciones a ON e.rut = a.estudiante_rut
                LEFT JOIN evaluaciones ev ON e.rut = ev.estudiante_rut AND ev.profesor_rut = ?
                LEFT JOIN tareas t ON e.rut = t.estudiante_rut AND t.profesor_rut = ?
                WHERE a.profesor_rut = ? AND a.estado = 'activa'
                GROUP BY e.rut, a.id
                ORDER BY e.nombres, e.apellidos
            `, [req.profesor.userId, req.profesor.userId, req.profesor.userId]);
            
            res.json(estudiantes);
        } catch (error) {
            console.error('Error obteniendo estudiantes del profesor:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener horarios/clases
    async getClases(req, res) {
        try {
            const [clases] = await execute(`
                SELECT 
                    h.id,
                    h.dia_semana,
                    h.hora_inicio,
                    h.hora_fin,
                    h.materia,
                    h.aula,
                    h.estado,
                    e.nombres as estudiante_nombres,
                    e.apellidos as estudiante_apellidos,
                    e.rut as estudiante_rut,
                    a.instrumento
                FROM horarios_clases h
                JOIN estudiantes e ON h.estudiante_rut = e.rut
                JOIN asignaciones a ON h.estudiante_rut = a.estudiante_rut AND h.profesor_rut = a.profesor_rut
                WHERE h.profesor_rut = ? AND h.estado = 'activo'
                ORDER BY 
                    FIELD(h.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'),
                    h.hora_inicio
            `, [req.profesor.userId]);
            
            res.json(clases);
        } catch (error) {
            console.error('Error obteniendo clases del profesor:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener asistencias
    async getAsistencias(req, res) {
        try {
            const { fecha_inicio, fecha_fin, estudiante_rut } = req.query;
            
            let query = `
                SELECT 
                    a.id,
                    a.fecha_clase,
                    a.hora_clase,
                    a.asistio,
                    a.llego_tarde,
                    a.minutos_tardanza,
                    a.justificacion,
                    a.observaciones,
                    e.nombres as estudiante_nombres,
                    e.apellidos as estudiante_apellidos,
                    e.rut as estudiante_rut
                FROM asistencia a
                JOIN estudiantes e ON a.estudiante_rut = e.rut
                WHERE a.profesor_rut = ?
            `;
            
            const params = [req.profesor.userId];
            
            if (fecha_inicio) {
                query += ' AND a.fecha_clase >= ?';
                params.push(fecha_inicio);
            }
            
            if (fecha_fin) {
                query += ' AND a.fecha_clase <= ?';
                params.push(fecha_fin);
            }
            
            if (estudiante_rut) {
                query += ' AND a.estudiante_rut = ?';
                params.push(estudiante_rut);
            }
            
            query += ' ORDER BY a.fecha_clase DESC, a.hora_clase DESC';
            
            const [asistencias] = await execute(query, params);
            res.json(asistencias);
        } catch (error) {
            console.error('Error obteniendo asistencias:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Registrar asistencia
    async registrarAsistencia(req, res) {
        try {
            const { 
                estudiante_rut, 
                fecha_clase, 
                hora_clase, 
                asistio, 
                llego_tarde, 
                minutos_tardanza, 
                justificacion,
                observaciones 
            } = req.body;

            const [result] = await execute(`
                INSERT INTO asistencia 
                (estudiante_rut, profesor_rut, fecha_clase, hora_clase, asistio, llego_tarde, minutos_tardanza, justificacion, observaciones)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                asistio = VALUES(asistio),
                llego_tarde = VALUES(llego_tarde),
                minutos_tardanza = VALUES(minutos_tardanza),
                justificacion = VALUES(justificacion),
                observaciones = VALUES(observaciones)
            `, [
                estudiante_rut,
                req.profesor.userId,
                fecha_clase,
                hora_clase,
                asistio,
                llego_tarde || false,
                minutos_tardanza || 0,
                justificacion,
                observaciones
            ]);

            res.status(201).json({ 
                message: 'Asistencia registrada exitosamente',
                id: result.insertId 
            });
        } catch (error) {
            console.error('Error registrando asistencia:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener evaluaciones
    async getEvaluaciones(req, res) {
        try {
            const [evaluaciones] = await execute(`
                SELECT 
                    ev.id,
                    ev.tipo,
                    ev.titulo,
                    ev.descripcion,
                    ev.fecha_evaluacion,
                    ev.calificacion,
                    ev.observaciones,
                    ev.fortalezas,
                    ev.areas_mejora,
                    e.nombres as estudiante_nombres,
                    e.apellidos as estudiante_apellidos,
                    e.rut as estudiante_rut,
                    r.titulo as repertorio_titulo
                FROM evaluaciones ev
                JOIN estudiantes e ON ev.estudiante_rut = e.rut
                LEFT JOIN repertorio r ON ev.repertorio_id = r.id
                WHERE ev.profesor_rut = ?
                ORDER BY ev.fecha_evaluacion DESC
            `, [req.profesor.userId]);
            
            res.json(evaluaciones);
        } catch (error) {
            console.error('Error obteniendo evaluaciones:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Crear evaluación
    async crearEvaluacion(req, res) {
        try {
            const {
                estudiante_rut,
                tipo,
                titulo,
                descripcion,
                fecha_evaluacion,
                calificacion,
                observaciones,
                fortalezas,
                areas_mejora,
                repertorio_id
            } = req.body;

            const [result] = await execute(`
                INSERT INTO evaluaciones 
                (estudiante_rut, profesor_rut, tipo, titulo, descripcion, fecha_evaluacion, 
                 calificacion, observaciones, fortalezas, areas_mejora, repertorio_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                estudiante_rut,
                req.profesor.userId,
                tipo,
                titulo,
                descripcion,
                fecha_evaluacion,
                calificacion,
                observaciones,
                fortalezas,
                areas_mejora,
                repertorio_id
            ]);

            res.status(201).json({ 
                message: 'Evaluación creada exitosamente',
                id: result.insertId 
            });
        } catch (error) {
            console.error('Error creando evaluación:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener tareas
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
                    e.nombres as estudiante_nombres,
                    e.apellidos as estudiante_apellidos,
                    e.rut as estudiante_rut
                FROM tareas t
                JOIN estudiantes e ON t.estudiante_rut = e.rut
                WHERE t.profesor_rut = ?
                ORDER BY t.fecha_asignacion DESC
            `, [req.profesor.userId]);
            
            res.json(tareas);
        } catch (error) {
            console.error('Error obteniendo tareas:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Crear tarea
    async crearTarea(req, res) {
        try {
            const profesorRut = req.profesor.userId;
            const {
                estudiante_rut,
                titulo,
                descripcion,
                tipo,
                fecha_entrega,
                prioridad = 'media',
                tiempo_estimado_minutos
            } = req.body;

            const tareaData = {
                profesor_rut: profesorRut,
                estudiante_rut,
                titulo,
                descripcion,
                tipo,
                fecha_asignacion: new Date().toISOString().split('T')[0],
                fecha_entrega,
                prioridad,
                tiempo_estimado_minutos
            };

            const tareaId = await Tarea.create(tareaData);
            
            res.status(201).json({ 
                mensaje: 'Tarea creada correctamente',
                id: tareaId 
            });
        } catch (error) {
            console.error('Error creando tarea:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener repertorio
    async getRepertorio(req, res) {
        try {
            const profesorRut = req.profesor.userId;
            
            const [repertorio] = await execute(`
                SELECT r.*, 
                       COUNT(ar.estudiante_rut) as estudiantes_asignados
                FROM repertorio r
                LEFT JOIN asignaciones_repertorio ar ON r.id = ar.repertorio_id
                WHERE r.creado_por = ? OR r.publico = 1
                GROUP BY r.id
                ORDER BY r.fecha_creacion DESC
            `, [profesorRut]);
            
            res.json(repertorio);
        } catch (error) {
            console.error('Error obteniendo repertorio:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener progreso de estudiantes
    async getProgreso(req, res) {
        try {
            const profesorRut = req.profesor.userId;
            
            const progreso = await Progreso.getByProfesor(profesorRut);
            res.json(progreso);
        } catch (error) {
            console.error('Error obteniendo progreso:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener préstamos relacionados al profesor
    async getPrestamos(req, res) {
        try {
            const profesorRut = req.profesor.userId;
            
            const [prestamos] = await execute(`
                SELECT p.*, 
                       i.nombre as instrumento_nombre,
                       i.tipo as instrumento_tipo,
                       e.nombres as estudiante_nombres,
                       e.apellidos as estudiante_apellidos
                FROM prestamos p
                JOIN instrumentos i ON p.instrumento_id = i.id
                JOIN estudiantes e ON p.estudiante_rut = e.rut
                WHERE p.profesor_rut = ?
                ORDER BY p.fecha_prestamo DESC
            `, [profesorRut]);
            
            res.json(prestamos);
        } catch (error) {
            console.error('Error obteniendo préstamos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Marcar asistencia
    async marcarAsistencia(req, res) {
        try {
            const { id } = req.params;
            const profesorRut = req.profesor.userId;
            const {
                estudiante_rut,
                fecha_clase,
                hora_clase,
                asistio,
                llego_tarde = false,
                minutos_tardanza = 0,
                justificacion,
                observaciones
            } = req.body;

            const asistenciaData = {
                estudiante_rut,
                profesor_rut: profesorRut,
                fecha_clase,
                hora_clase,
                asistio,
                llego_tarde,
                minutos_tardanza,
                justificacion,
                observaciones
            };

            const asistenciaId = await Asistencia.registrar(asistenciaData);
            
            res.json({ 
                mensaje: 'Asistencia registrada correctamente',
                id: asistenciaId 
            });
        } catch (error) {
            console.error('Error registrando asistencia:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
};

module.exports = profesorController;