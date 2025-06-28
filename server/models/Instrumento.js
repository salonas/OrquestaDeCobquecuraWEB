const { execute } = require('../config/database');

class Instrumento {
    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.tipo = data.tipo;
        this.marca = data.marca;
        this.modelo = data.modelo;
        this.numero_serie = data.numero_serie;
        this.estado_fisico = data.estado_fisico;
        this.disponible = data.disponible;
        this.ubicacion = data.ubicacion;
        this.valor_estimado = data.valor_estimado;
        this.fecha_adquisicion = data.fecha_adquisicion;
        this.observaciones = data.observaciones;
        this.fecha_creacion = data.fecha_creacion;
    }

    static async getAll() {
        try {
            console.log('🔍 Instrumento.getAll() - Iniciando consulta');
            
            const query = `
                SELECT 
                    id,
                    nombre,
                    tipo,
                    marca,
                    modelo,
                    numero_serie,
                    estado_fisico,
                    disponible,
                    ubicacion,
                    valor_estimado,
                    fecha_adquisicion,
                    observaciones,
                    fecha_creacion
                FROM instrumentos
                ORDER BY tipo, nombre
            `;
            
            const rows = await execute(query);
            console.log('✅ Instrumento.getAll() - Filas obtenidas:', rows?.length || 0);
            
            // Verificar estructura de datos
            if (rows && rows.length > 0) {
              console.log('🎼 Primer instrumento:', JSON.stringify(rows[0], null, 2));
            }
            
            return Array.isArray(rows) ? rows : [];
        } catch (error) {
            console.error('❌ Error en Instrumento.getAll():', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const query = `SELECT * FROM instrumentos WHERE id = ?`;
            const rows = await execute(query, [id]);
            return rows.length > 0 ? new Instrumento(rows[0]) : null;
        } catch (error) {
            console.error('Error en getById:', error);
            throw error;
        }
    }

    static async create(data) {
        try {
            const query = `
                INSERT INTO instrumentos (
                    nombre, tipo, marca, modelo, numero_serie, 
                    estado_fisico, disponible, ubicacion, 
                    valor_estimado, fecha_adquisicion, observaciones
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                data.nombre,
                data.tipo,
                data.marca || null,
                data.modelo || null,
                data.numero_serie || null,
                data.estado_fisico || 'bueno',
                data.disponible !== undefined ? data.disponible : true,
                data.ubicacion || null,
                data.valor_estimado || null,
                data.fecha_adquisicion || null,
                data.observaciones || null
            ];
            
            const result = await execute(query, params);
            return await this.getById(result.insertId);
        } catch (error) {
            console.error('Error en create:', error);
            throw error;
        }
    }

    static async update(id, data) {
        try {
            const query = `
                UPDATE instrumentos SET
                    nombre = ?, tipo = ?, marca = ?, modelo = ?, numero_serie = ?,
                    estado_fisico = ?, disponible = ?, ubicacion = ?,
                    valor_estimado = ?, fecha_adquisicion = ?, observaciones = ?
                WHERE id = ?
            `;
            
            const params = [
                data.nombre,
                data.tipo,
                data.marca,
                data.modelo,
                data.numero_serie,
                data.estado_fisico,
                data.disponible,
                data.ubicacion,
                data.valor_estimado,
                data.fecha_adquisicion,
                data.observaciones,
                id
            ];
            
            await execute(query, params);
            return await this.getById(id);
        } catch (error) {
            console.error('Error en update:', error);
            throw error;
        }
    }

    static async updateDisponibilidad(id, disponible) {
        try {
            const query = `UPDATE instrumentos SET disponible = ? WHERE id = ?`;
            await execute(query, [disponible, id]);
            return await this.getById(id);
        } catch (error) {
            console.error('Error en updateDisponibilidad:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const query = `DELETE FROM instrumentos WHERE id = ?`;
            const result = await execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en delete:', error);
            throw error;
        }
    }
}

module.exports = Instrumento;