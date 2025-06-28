const { execute } = require('../config/database');

class Evaluacion {
    // Obtener evaluaciones de un estudiante
    static async getByEstudiante(estudianteRut) {
        const [rows] = await execute(`
            SELECT e.*, p.nombres as profesor_nombres, p.apellidos as profesor_apellidos,
                   r.titulo as repertorio_titulo
            FROM evaluaciones e
            JOIN profesores p ON e.profesor_rut = p.rut
            LEFT JOIN repertorio r ON e.repertorio_id = r.id
            WHERE e.estudiante_rut = ?
            ORDER BY e.fecha_evaluacion DESC
        `, [estudianteRut]);
        return rows;
    }

    // Obtener evaluaciones de un profesor
    static async getByProfesor(profesorRut) {
        const [rows] = await execute(`
            SELECT e.*, est.nombres as estudiante_nombres, est.apellidos as estudiante_apellidos,
                   r.titulo as repertorio_titulo
            FROM evaluaciones e
            JOIN estudiantes est ON e.estudiante_rut = est.rut
            LEFT JOIN repertorio r ON e.repertorio_id = r.id
            WHERE e.profesor_rut = ?
            ORDER BY e.fecha_evaluacion DESC
        `, [profesorRut]);
        return rows;
    }

    // Obtener evaluación por ID
    static async getById(id) {
        const [rows] = await execute(`
            SELECT e.*, p.nombres as profesor_nombres, p.apellidos as profesor_apellidos,
                   est.nombres as estudiante_nombres, est.apellidos as estudiante_apellidos,
                   r.titulo as repertorio_titulo
            FROM evaluaciones e
            JOIN profesores p ON e.profesor_rut = p.rut
            JOIN estudiantes est ON e.estudiante_rut = est.rut
            LEFT JOIN repertorio r ON e.repertorio_id = r.id
            WHERE e.id = ?
        `, [id]);
        return rows[0];
    }

    // Crear nueva evaluación
    static async create(evaluacionData) {
        const {
            estudiante_rut,
            profesor_rut,
            tipo,
            titulo,
            descripcion,
            fecha_evaluacion,
            calificacion,
            observaciones,
            fortalezas,
            areas_mejora,
            repertorio_id
        } = evaluacionData;

        const [result] = await execute(`
            INSERT INTO evaluaciones (
                estudiante_rut, profesor_rut, tipo, titulo, descripcion,
                fecha_evaluacion, calificacion, observaciones, fortalezas,
                areas_mejora, repertorio_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            estudiante_rut, profesor_rut, tipo, titulo, descripcion,
            fecha_evaluacion, calificacion, observaciones, fortalezas,
            areas_mejora, repertorio_id
        ]);

        return result.insertId;
    }

    // Actualizar evaluación
    static async update(id, evaluacionData) {
        const fields = [];
        const values = [];

        Object.keys(evaluacionData).forEach(key => {
            if (evaluacionData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(evaluacionData[key]);
            }
        });

        if (fields.length === 0) return false;

        values.push(id);
        const [result] = await execute(
            `UPDATE evaluaciones SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    // Eliminar evaluación
    static async delete(id) {
        const [result] = await execute(
            'DELETE FROM evaluaciones WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Obtener estadísticas de evaluaciones por estudiante
    static async getEstadisticasEstudiante(estudianteRut) {
        const [rows] = await execute(`
            SELECT 
                COUNT(*) as total_evaluaciones,
                AVG(calificacion) as promedio_calificaciones,
                MIN(calificacion) as calificacion_minima,
                MAX(calificacion) as calificacion_maxima,
                tipo,
                COUNT(*) as cantidad_por_tipo
            FROM evaluaciones 
            WHERE estudiante_rut = ? AND calificacion IS NOT NULL
            GROUP BY tipo
        `, [estudianteRut]);
        return rows;
    }
}

module.exports = Evaluacion;