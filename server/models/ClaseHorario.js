const { execute } = require('../config/database');

class ClaseHorario {
    // Obtener todos los horarios de un profesor
    static async getByProfesor(profesorRut) {
        const [rows] = await execute(`
            SELECT h.*, e.nombres as estudiante_nombres, e.apellidos as estudiante_apellidos
            FROM horarios_clases h
            JOIN estudiantes e ON h.estudiante_rut = e.rut
            WHERE h.profesor_rut = ? AND h.estado = 'activo'
            ORDER BY 
                CASE h.dia_semana
                    WHEN 'lunes' THEN 1
                    WHEN 'martes' THEN 2
                    WHEN 'miercoles' THEN 3
                    WHEN 'jueves' THEN 4
                    WHEN 'viernes' THEN 5
                    WHEN 'sabado' THEN 6
                    WHEN 'domingo' THEN 7
                END,
                h.hora_inicio
        `, [profesorRut]);
        return rows;
    }

    // Obtener horarios de un estudiante
    static async getByEstudiante(estudianteRut) {
        const [rows] = await execute(`
            SELECT h.*, p.nombres as profesor_nombres, p.apellidos as profesor_apellidos,
                   p.especialidad
            FROM horarios_clases h
            JOIN profesores p ON h.profesor_rut = p.rut
            WHERE h.estudiante_rut = ? AND h.estado = 'activo'
            ORDER BY 
                CASE h.dia_semana
                    WHEN 'lunes' THEN 1
                    WHEN 'martes' THEN 2
                    WHEN 'miercoles' THEN 3
                    WHEN 'jueves' THEN 4
                    WHEN 'viernes' THEN 5
                    WHEN 'sabado' THEN 6
                    WHEN 'domingo' THEN 7
                END,
                h.hora_inicio
        `, [estudianteRut]);
        return rows;
    }

    // Obtener horario por ID
    static async getById(id) {
        const [rows] = await execute(`
            SELECT h.*, p.nombres as profesor_nombres, p.apellidos as profesor_apellidos,
                   e.nombres as estudiante_nombres, e.apellidos as estudiante_apellidos
            FROM horarios_clases h
            JOIN profesores p ON h.profesor_rut = p.rut
            JOIN estudiantes e ON h.estudiante_rut = e.rut
            WHERE h.id = ?
        `, [id]);
        return rows[0];
    }

    // Crear nuevo horario
    static async create(horarioData) {
        const {
            profesor_rut,
            estudiante_rut,
            dia_semana,
            hora_inicio,
            hora_fin,
            aula,
            fecha_inicio,
            fecha_fin
        } = horarioData;

        const [result] = await execute(`
            INSERT INTO horarios_clases (
                profesor_rut, estudiante_rut, dia_semana, hora_inicio,
                hora_fin, aula, fecha_inicio, fecha_fin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            profesor_rut, estudiante_rut, dia_semana, hora_inicio,
            hora_fin, aula, fecha_inicio, fecha_fin
        ]);

        return result.insertId;
    }

    // Actualizar horario
    static async update(id, horarioData) {
        const fields = [];
        const values = [];

        Object.keys(horarioData).forEach(key => {
            if (horarioData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(horarioData[key]);
            }
        });

        if (fields.length === 0) return false;

        values.push(id);
        const [result] = await execute(
            `UPDATE horarios_clases SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    // Cambiar estado del horario
    static async updateEstado(id, estado) {
        const [result] = await execute(
            'UPDATE horarios_clases SET estado = ? WHERE id = ?',
            [estado, id]
        );
        return result.affectedRows > 0;
    }

    // Eliminar horario
    static async delete(id) {
        const [result] = await execute(
            'DELETE FROM horarios_clases WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Verificar conflictos de horario
    static async verificarConflictos(profesorRut, estudianteRut, diaSemana, horaInicio, horaFin, excluirId = null) {
        let query = `
            SELECT COUNT(*) as conflictos
            FROM horarios_clases
            WHERE (profesor_rut = ? OR estudiante_rut = ?)
            AND dia_semana = ?
            AND estado = 'activo'
            AND (
                (hora_inicio <= ? AND hora_fin > ?) OR
                (hora_inicio < ? AND hora_fin >= ?) OR
                (hora_inicio >= ? AND hora_fin <= ?)
            )
        `;
        
        const params = [
            profesorRut, estudianteRut, diaSemana,
            horaInicio, horaInicio,
            horaFin, horaFin,
            horaInicio, horaFin
        ];

        if (excluirId) {
            query += ' AND id != ?';
            params.push(excluirId);
        }

        const [rows] = await execute(query, params);
        return rows[0].conflictos > 0;
    }
}

module.exports = ClaseHorario;