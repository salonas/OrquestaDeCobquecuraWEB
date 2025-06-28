const { execute } = require('../config/database');

class Asistencia {
    // Obtener todas las asistencias (para admin)
    static async getAll() {
        try {
            console.log('🔍 Modelo Asistencia.getAll() - Iniciando consulta');
            
            const query = `
                SELECT 
                    a.id,
                    a.estudiante_rut,
                    a.profesor_rut,
                    a.fecha_clase,
                    a.hora_clase,
                    a.asistio as presente,
                    a.llego_tarde,
                    a.minutos_tardanza,
                    a.justificacion,
                    a.observaciones,
                    a.fecha_registro,
                    CONCAT(e.nombres, ' ', e.apellidos) as estudiante_nombre,
                    e.nombres as estudiante_nombres,
                    e.apellidos as estudiante_apellidos,
                    CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre,
                    p.nombres as profesor_nombres,
                    p.apellidos as profesor_apellidos
                FROM asistencia a
                LEFT JOIN estudiantes e ON a.estudiante_rut = e.rut
                LEFT JOIN profesores p ON a.profesor_rut = p.rut
                ORDER BY a.fecha_clase DESC, a.hora_clase DESC
            `;
            
            console.log('📝 Ejecutando query...');
            
            const rows = await execute(query);
            
            console.log('✅ Query ejecutada. Resultados:', rows?.length || 0);
            
            if (rows && rows.length > 0) {
                console.log('📋 Primera asistencia:', JSON.stringify(rows[0], null, 2));
            }
            
            return rows || [];
        } catch (error) {
            console.error('❌ Error en Asistencia.getAll():', error);
            throw error;
        }
    }

    // Obtener asistencia de un estudiante
    static async getByEstudiante(estudianteRut, fechaInicio = null, fechaFin = null) {
        let query = `
            SELECT a.*, p.nombres as profesor_nombres, p.apellidos as profesor_apellidos
            FROM asistencia a
            JOIN profesores p ON a.profesor_rut = p.rut
            WHERE a.estudiante_rut = ?
        `;
        const params = [estudianteRut];

        if (fechaInicio && fechaFin) {
            query += ' AND a.fecha_clase BETWEEN ? AND ?';
            params.push(fechaInicio, fechaFin);
        }

        query += ' ORDER BY a.fecha_clase DESC, a.hora_clase DESC';

        const rows = await execute(query, params);
        return rows;
    }

    // Obtener asistencia de las clases de un profesor
    static async getByProfesor(profesorRut, fechaInicio = null, fechaFin = null) {
        let query = `
            SELECT a.*, e.nombres as estudiante_nombres, e.apellidos as estudiante_apellidos
            FROM asistencia a
            JOIN estudiantes e ON a.estudiante_rut = e.rut
            WHERE a.profesor_rut = ?
        `;
        const params = [profesorRut];

        if (fechaInicio && fechaFin) {
            query += ' AND a.fecha_clase BETWEEN ? AND ?';
            params.push(fechaInicio, fechaFin);
        }

        query += ' ORDER BY a.fecha_clase DESC, a.hora_clase DESC';

        const rows = await execute(query, params);
        return rows;
    }

    // Registrar asistencia
    static async registrar(asistenciaData) {
        const {
            estudiante_rut,
            profesor_rut,
            fecha_clase,
            hora_clase,
            asistio,
            llego_tarde = false,
            minutos_tardanza = 0,
            justificacion,
            observaciones
        } = asistenciaData;

        // Verificar si ya existe registro para esta clase
        const existing = await execute(
            'SELECT id FROM asistencia WHERE estudiante_rut = ? AND profesor_rut = ? AND fecha_clase = ? AND hora_clase = ?',
            [estudiante_rut, profesor_rut, fecha_clase, hora_clase]
        );

        if (existing.length > 0) {
            // Actualizar registro existente
            const result = await execute(`
                UPDATE asistencia SET
                    asistio = ?,
                    llego_tarde = ?,
                    minutos_tardanza = ?,
                    justificacion = ?,
                    observaciones = ?
                WHERE id = ?
            `, [asistio, llego_tarde, minutos_tardanza, justificacion, observaciones, existing[0].id]);
            
            return existing[0].id;
        } else {
            // Crear nuevo registro
            const result = await execute(`
                INSERT INTO asistencia (
                    estudiante_rut, profesor_rut, fecha_clase, hora_clase,
                    asistio, llego_tarde, minutos_tardanza, justificacion, observaciones
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                estudiante_rut, profesor_rut, fecha_clase, hora_clase,
                asistio, llego_tarde, minutos_tardanza, justificacion, observaciones
            ]);

            return result.insertId;
        }
    }

    // Actualizar asistencia existente
    static async update(id, asistenciaData) {
        const {
            estudiante_rut,
            profesor_rut,
            fecha_clase,
            hora_clase,
            presente,
            observaciones
        } = asistenciaData;

        // ✅ CORRECCIÓN: Mapear 'presente' a 'asistio' que es la columna real en la BD
        const result = await execute(`
            UPDATE asistencia 
            SET estudiante_rut = ?, profesor_rut = ?, fecha_clase = ?, 
                hora_clase = ?, asistio = ?, observaciones = ?
            WHERE id = ?
        `, [estudiante_rut, profesor_rut, fecha_clase, hora_clase, presente ? 1 : 0, observaciones, id]);

        return result.affectedRows > 0;
    }

    // Eliminar registro de asistencia
    static async delete(id) {
        const result = await execute(
            'DELETE FROM asistencia WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Obtener estadísticas de asistencia
    static async getEstadisticas(estudianteRut, profesorRut = null, fechaInicio = null, fechaFin = null) {
        let query = `
            SELECT 
                COUNT(*) as total_clases,
                SUM(CASE WHEN asistio = 1 THEN 1 ELSE 0 END) as clases_asistidas,
                SUM(CASE WHEN asistio = 0 THEN 1 ELSE 0 END) as clases_faltadas,
                SUM(CASE WHEN llego_tarde = 1 THEN 1 ELSE 0 END) as llegadas_tarde,
                AVG(CASE WHEN llego_tarde = 1 THEN minutos_tardanza ELSE 0 END) as promedio_tardanza,
                ROUND((SUM(CASE WHEN asistio = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as porcentaje_asistencia
            FROM asistencia
            WHERE estudiante_rut = ?
        `;
        
        const params = [estudianteRut];

        if (profesorRut) {
            query += ' AND profesor_rut = ?';
            params.push(profesorRut);
        }

        if (fechaInicio && fechaFin) {
            query += ' AND fecha_clase BETWEEN ? AND ?';
            params.push(fechaInicio, fechaFin);
        }

        const rows = await execute(query, params);
        return rows[0];
    }
}

module.exports = Asistencia;