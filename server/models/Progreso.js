const { execute } = require('../config/database');

class Progreso {
    // Obtener progreso de un estudiante en un periodo específico
    static async getByEstudiantePeriodo(estudianteRut, periodo) {
        const [rows] = await execute(`
            SELECT p.*, pr.nombres as profesor_nombres, pr.apellidos as profesor_apellidos
            FROM progreso_estudiante p
            JOIN profesores pr ON p.profesor_rut = pr.rut
            WHERE p.estudiante_rut = ? AND p.periodo = ?
        `, [estudianteRut, periodo]);
        return rows[0];
    }

    // Obtener todo el historial de progreso de un estudiante
    static async getHistorialEstudiante(estudianteRut) {
        const [rows] = await execute(`
            SELECT p.*, pr.nombres as profesor_nombres, pr.apellidos as profesor_apellidos
            FROM progreso_estudiante p
            JOIN profesores pr ON p.profesor_rut = pr.rut
            WHERE p.estudiante_rut = ?
            ORDER BY p.periodo DESC
        `, [estudianteRut]);
        return rows;
    }

    // Obtener progreso de todos los estudiantes de un profesor
    static async getByProfesor(profesorRut, periodo = null) {
        let query = `
            SELECT p.*, e.nombres as estudiante_nombres, e.apellidos as estudiante_apellidos
            FROM progreso_estudiante p
            JOIN estudiantes e ON p.estudiante_rut = e.rut
            WHERE p.profesor_rut = ?
        `;
        const params = [profesorRut];

        if (periodo) {
            query += ' AND p.periodo = ?';
            params.push(periodo);
        }

        query += ' ORDER BY p.periodo DESC, e.nombres';

        const [rows] = await execute(query, params);
        return rows;
    }

    // Crear o actualizar progreso
    static async createOrUpdate(progresoData) {
        const {
            estudiante_rut,
            profesor_rut,
            periodo,
            nivel_tecnico,
            promedio_calificaciones,
            asistencia_porcentaje,
            tareas_completadas,
            total_tareas,
            repertorio_dominado,
            horas_practica_semanal,
            observaciones_generales,
            metas_periodo,
            logros
        } = progresoData;

        // Verificar si ya existe un registro
        const [existing] = await execute(
            'SELECT id FROM progreso_estudiante WHERE estudiante_rut = ? AND profesor_rut = ? AND periodo = ?',
            [estudiante_rut, profesor_rut, periodo]
        );

        if (existing.length > 0) {
            // Actualizar registro existente
            const [result] = await execute(`
                UPDATE progreso_estudiante SET
                    nivel_tecnico = ?,
                    promedio_calificaciones = ?,
                    asistencia_porcentaje = ?,
                    tareas_completadas = ?,
                    total_tareas = ?,
                    repertorio_dominado = ?,
                    horas_practica_semanal = ?,
                    observaciones_generales = ?,
                    metas_periodo = ?,
                    logros = ?
                WHERE estudiante_rut = ? AND profesor_rut = ? AND periodo = ?
            `, [
                nivel_tecnico, promedio_calificaciones, asistencia_porcentaje,
                tareas_completadas, total_tareas, repertorio_dominado,
                horas_practica_semanal, observaciones_generales, metas_periodo,
                logros, estudiante_rut, profesor_rut, periodo
            ]);
            return existing[0].id;
        } else {
            // Crear nuevo registro
            const [result] = await execute(`
                INSERT INTO progreso_estudiante (
                    estudiante_rut, profesor_rut, periodo, nivel_tecnico,
                    promedio_calificaciones, asistencia_porcentaje,
                    tareas_completadas, total_tareas, repertorio_dominado,
                    horas_practica_semanal, observaciones_generales,
                    metas_periodo, logros
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                estudiante_rut, profesor_rut, periodo, nivel_tecnico,
                promedio_calificaciones, asistencia_porcentaje,
                tareas_completadas, total_tareas, repertorio_dominado,
                horas_practica_semanal, observaciones_generales,
                metas_periodo, logros
            ]);
            return result.insertId;
        }
    }

    // Eliminar registro de progreso
    static async delete(id) {
        const [result] = await execute(
            'DELETE FROM progreso_estudiante WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Progreso;