const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ⚠️  VALIDACIONES DE SEGURIDAD
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR CRÍTICO: JWT_SECRET no está configurado en las variables de entorno');
  console.error('🔧 Por favor configura un JWT_SECRET en tu archivo .env');
  console.error('💡 Ejemplo: JWT_SECRET=tu_clave_secreta_muy_larga_y_segura');
  process.exit(1);
}

if (!process.env.DB_PASSWORD) {
  console.warn('⚠️  ADVERTENCIA: DB_PASSWORD no está configurado en las variables de entorno');
  console.warn('🔧 Por favor configura las credenciales de la base de datos en tu archivo .env');
}

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Agregar logging de todas las peticiones
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - Headers:`, req.headers.authorization ? 'Token presente' : 'Sin token');
  next();
});

console.log('📝 Configurando rutas...');

// Cargar rutas una por una con logging detallado
try {
    console.log('🔄 Cargando rutas de autenticación...');
    const authRoutes = require('./routes/authRoutes');
    app.use('/api/auth', authRoutes);
    console.log('✅ Rutas de auth registradas correctamente');
} catch (error) {
    console.error('❌ Error en rutas de auth:', error.message);
    console.error(error.stack);
    process.exit(1);
}

try {
    console.log('🔄 Cargando rutas de administrador...');
    const adminRoutes = require('./routes/adminRoutes');
    app.use('/api/admin', adminRoutes);
    console.log('✅ Rutas de admin registradas correctamente');
} catch (error) {
    console.error('❌ Error en rutas de admin:', error.message);
    console.error(error.stack);
    process.exit(1);
}

try {
    console.log('🔄 Cargando rutas de profesor...');
    const profesorRoutes = require('./routes/profesorRoutes');
    app.use('/api/profesor', profesorRoutes);
    console.log('✅ Rutas de profesor registradas correctamente');
} catch (error) {
    console.error('❌ Error en rutas de profesor:', error.message);
    console.error(error.stack);
    process.exit(1);
}

try {
    console.log('🔄 Cargando rutas de estudiante...');
    const estudianteRoutes = require('./routes/estudianteRoutes');
    app.use('/api/estudiante', estudianteRoutes);
    console.log('✅ Rutas de estudiante registradas correctamente');
} catch (error) {
    console.error('❌ Error en rutas de estudiante:', error.message);
    console.error(error.stack);
    process.exit(1);
}

console.log('✅ Proceso de carga de rutas completado');

// CREAR DIRECTORIOS DE UPLOADS SI NO EXISTEN
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'temp'),
  path.join(__dirname, 'uploads', 'noticias')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('📁 Directorio creado:', dir);
  }
});

// MIDDLEWARE PARA SERVIR ARCHIVOS ESTÁTICOS CON CARACTERES ESPECIALES
app.use('/uploads', (req, res, next) => {
  console.log('📥 GET' + req.originalUrl + ' - Headers: Sin token');
  
  // Decodificar URL correctamente para caracteres especiales
  try {
    const urlOriginal = req.url;
    req.url = decodeURIComponent(req.url);
    console.log('🔄 URL original:', urlOriginal);
    console.log('🔄 URL decodificada:', req.url);
  } catch (error) {
    console.error('❌ Error decodificando URL:', error);
  }
  next();
});

// ASEGURAR QUE SE SIRVAN ARCHIVOS DE uploads/noticias
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MIDDLEWARE PARA MANEJAR ARCHIVOS NO ENCONTRADOS
app.use('/uploads', (req, res) => {
  console.log('❌ Archivo no encontrado en servidor:', req.url);
  const rutaCompleta = path.join(__dirname, 'uploads', req.url);
  console.log('📁 Ruta buscada:', rutaCompleta);
  res.status(404).json({ 
    error: 'Archivo no encontrado',
    path: req.url,
    rutaCompleta: rutaCompleta
  });
});

// Cambiar la importación de las rutas de noticias (si no está así)
const noticiasRoutes = require('./routes/noticiasRoutes');

// Registrar rutas (debería estar ya)
app.use('/api/noticias', noticiasRoutes);

// AGREGAR ESTA LÍNEA si no está
const eventosRoutes = require('./routes/eventosRoutes');

// REGISTRAR LA RUTA si no está
app.use('/api/eventos', eventosRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error en la aplicación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Ruta catch-all para 404 - CORREGIDA
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// CORREGIR PUERTO A 5000
const PORT = process.env.PORT || 5000;

try {
    console.log('🚀 Iniciando servidor...');
    app.listen(PORT, () => {
        console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
    });
} catch (error) {
    console.error('❌ Error al iniciar servidor:', error.message);
    console.error(error.stack);
}