const { execute } = require('../config/database');

// Servicio para manejo de tokens de registro
class TokenRegistroService {
    // Buscar token por valor
    static async findByToken(token) {
        try {
            const query = 'SELECT * FROM token_registro WHERE token = ? AND activo = TRUE AND fecha_expiracion > NOW()';
            const results = await execute(query, [token]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Error buscando token:', error);
            throw error;
        }
    }

    // Crear nuevo token
    static async create(tokenData) {
        try {
            const query = `
                INSERT INTO token_registro (token, tipo_usuario, usos_maximos, fecha_expiracion, activo, creado_por) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const result = await execute(query, [
                tokenData.token,
                tokenData.tipo_usuario,
                tokenData.usos_maximos || 1,
                tokenData.fecha_expiracion,
                true,
                tokenData.creado_por
            ]);
            return result;
        } catch (error) {
            console.error('Error creando token:', error);
            throw error;
        }
    }

    // Marcar token como usado (incrementar contador)
    static async markAsUsed(token) {
        try {
            const query = 'UPDATE token_registro SET usos_actuales = usos_actuales + 1 WHERE token = ?';
            await execute(query, [token]);
        } catch (error) {
            console.error('Error marcando token como usado:', error);
            throw error;
        }
    }

    // Obtener todos los tokens
    static async getAll() {
        try {
            const [rows] = await execute(
                'SELECT * FROM token_registro ORDER BY fecha_creacion DESC'
            );
            return rows;
        } catch (error) {
            console.error('Error obteniendo tokens:', error);
            throw error;
        }
    }

    // Desactivar token
    static async deactivate(tokenId) {
        try {
            const [result] = await execute(
                'UPDATE token_registro SET activo = FALSE WHERE id = ?',
                [tokenId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error desactivando token:', error);
            throw error;
        }
    }
}

module.exports = { TokenRegistroService };