const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',  // ⚠️  IMPORTANTE: Configurar en archivo .env
  database: process.env.DB_NAME || 'orquesta_cobquecura',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado a la base de datos MySQL');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
};

// Función para ejecutar consultas - CORREGIDA
const execute = async (query, params = []) => {
  try {
    console.log('🔍 Ejecutando query:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
    console.log('📝 Parámetros:', params);
    
    const [rows] = await pool.execute(query, params);
    console.log('✅ Filas obtenidas:', rows?.length || 0);
    
    // Si no hay filas, mostrar advertencia pero no error
    if (!rows || rows.length === 0) {
      console.log('⚠️  No se encontraron datos para esta consulta');
    }
    
    return rows; // Solo devolver las filas
  } catch (error) {
    console.error('❌ Error en execute:', error.message);
    console.error('Query que falló:', query);
    console.error('Parámetros que fallaron:', params);
    throw error;
  }
}

// Exportar también el pool y testConnection para uso futuro
module.exports = { 
  execute, 
  pool, 
  testConnection 
};