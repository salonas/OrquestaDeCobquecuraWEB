const { execute } = require('../config/database');

// Modelo para manejo de eventos
class Evento {
    // Obtener todos los eventos
    static async getAll() {
        const [rows] = await execute(
            'SELECT * FROM eventos ORDER BY fecha DESC'
        );
        return rows;
    }

    // Obtener eventos visibles y futuros para el público
    static async getVisible() {
        const [rows] = await execute(
            'SELECT * FROM eventos WHERE visible = TRUE AND fecha >= CURDATE() ORDER BY fecha ASC LIMIT 5'
        );
        return rows;
    }

    // Obtener evento por ID
    static async getById(id) {
        const [rows] = await execute(
            'SELECT * FROM eventos WHERE id_evento = ?',
            [id]
        );
        return rows[0];
    }

    // Crear nuevo evento
    static async create(eventoData) {
        const { nombre, descripcion, fecha, lugar, visible = true } = eventoData;
        const [result] = await execute(
            'INSERT INTO eventos (nombre, descripcion, fecha, lugar, visible) VALUES (?, ?, ?, ?, ?)',
            [nombre, descripcion, fecha, lugar, visible]
        );
        return result.insertId;
    }

    // Actualizar evento existente
    static async update(id, eventoData) {
        const { nombre, descripcion, fecha, lugar, visible } = eventoData;
        const [result] = await execute(
            'UPDATE eventos SET nombre = ?, descripcion = ?, fecha = ?, lugar = ?, visible = ? WHERE id_evento = ?',
            [nombre, descripcion, fecha, lugar, visible, id]
        );
        return result.affectedRows > 0;
    }

    // Eliminar evento
    static async delete(id) {
        const [result] = await execute(
            'DELETE FROM eventos WHERE id_evento = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Cambiar visibilidad del evento
    static async toggleVisibility(id) {
        const [result] = await execute(
            'UPDATE eventos SET visible = NOT visible WHERE id_evento = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Evento;