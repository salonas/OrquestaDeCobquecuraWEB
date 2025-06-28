const { execute } = require('../config/database');

class Tarea {
    // Obtener todas las tareas de un estudiante
    static async getByEstudiante(estudianteRut) {
        const [rows] = await execute(`
            SELECT t.*, p.nombres as profesor_nombres, p.apellidos as profesor_apellidos
            FROM tareas t
            JOIN profesores p ON t.profesor_rut = p.rut
            WHERE t.estudiante_rut = ?
            ORDER BY t.fecha_asignacion DESC
        `, [estudianteRut]);
        return rows;
    }

    // Obtener todas las tareas de un profesor
    static async getByProfesor(profesorRut) {
        const [rows] = await execute(`
            SELECT t.*, e.nombres as estudiante_nombres, e.apellidos as estudiante_apellidos
            FROM tareas t
            JOIN estudiantes e ON t.estudiante_rut = e.rut
            WHERE t.profesor_rut = ?
            ORDER BY t.fecha_asignacion DESC
        `, [profesorRut]);
        return rows;
    }

    // Obtener tarea por ID
    static async getById(id) {
        const [rows] = await execute(
            'SELECT * FROM tareas WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    // Crear nueva tarea
    static async create(tareaData) {
        const {
            profesor_rut,
            estudiante_rut,
            titulo,
            descripcion,
            tipo,
            fecha_asignacion,
            fecha_entrega,
            prioridad = 'media',
            tiempo_estimado_minutos
        } = tareaData;

        const [result] = await execute(`
            INSERT INTO tareas (
                profesor_rut, estudiante_rut, titulo, descripcion, tipo,
                fecha_asignacion, fecha_entrega, prioridad, tiempo_estimado_minutos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            profesor_rut, estudiante_rut, titulo, descripcion, tipo,
            fecha_asignacion, fecha_entrega, prioridad, tiempo_estimado_minutos
        ]);

        return result.insertId;
    }

    // Actualizar tarea
    static async update(id, tareaData) {
        const fields = [];
        const values = [];

        Object.keys(tareaData).forEach(key => {
            if (tareaData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(tareaData[key]);
            }
        });

        if (fields.length === 0) return false;

        values.push(id);
        const [result] = await execute(
            `UPDATE tareas SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    // Cambiar estado de la tarea
    static async updateEstado(id, estado) {
        const [result] = await execute(
            'UPDATE tareas SET estado = ? WHERE id = ?',
            [estado, id]
        );
        return result.affectedRows > 0;
    }

    // Eliminar tarea
    static async delete(id) {
        const [result] = await execute(
            'DELETE FROM tareas WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Tarea;