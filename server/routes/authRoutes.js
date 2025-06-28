const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { execute } = require('../config/database');
const { TokenRegistroService } = require('../models/TokenRegistro');
const router = express.Router();

// Login UNIFICADO para todos los tipos de usuario
router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    console.log('Ejecutando query: SELECT * FROM usuarios WHERE email = ? AND userType = ?');
    console.log('Parámetros:', [email, userType]);

    // Buscar SIEMPRE en la tabla usuarios
    const query = 'SELECT * FROM usuarios WHERE email = ? AND userType = ?';
    const params = [email, userType];

    const results = await execute(query, params); // Cambiar esta línea
    console.log('Resultado completo:', results);
    console.log('Filas obtenidas:', results.length);

    if (!results || results.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    const user = results[0]; // Cambiar esta línea
    console.log('Usuario encontrado:', user);
    console.log('Campos del usuario:', Object.keys(user));

    // Verificar contraseña
    if (!user.password_hash) {
      console.log('Error: password_hash no existe en el usuario');
      return res.status(401).json({ success: false, error: 'Cuenta sin contraseña' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    // Crear token
    const token = jwt.sign(
      { userId: user.id_usuario, userType: user.userType, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id_usuario,
        email: user.email,
        userType: user.userType,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Registro - ACTUALIZADO
router.post('/register', async (req, res) => {
  try {
    const { 
      userType, 
      rut, 
      nombres, 
      apellidos, 
      email, 
      telefono, 
      password, 
      especialidad, 
      anosExperiencia,
      tokenRegistro 
    } = req.body;

    console.log('🔄 Iniciando registro para:', { userType, email, tokenRegistro });

    // Validar token de registro
    const tokenQuery = 'SELECT * FROM token_registro WHERE token = ? AND activo = TRUE AND fecha_expiracion > NOW()';
    const tokenResults = await execute(tokenQuery, [tokenRegistro]);
    
    if (!tokenResults || tokenResults.length === 0) {
      console.log('❌ Token inválido o expirado');
      return res.status(400).json({ error: 'Token de registro inválido o expirado' });
    }

    const token = tokenResults[0];
    console.log('✅ Token encontrado:', token);

    if (token.tipo_usuario !== userType) {
      console.log('❌ Token no válido para este tipo de usuario');
      return res.status(400).json({ error: 'Token no válido para este tipo de usuario' });
    }

    // Verificar usos del token
    if (token.usos_actuales >= token.usos_maximos) {
      console.log('❌ Token agotado');
      return res.status(400).json({ error: 'Token de registro agotado' });
    }

    // Encriptar contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    let result;
    
    if (userType === 'administrador') {
      // Insertar solo en usuarios
      const adminResult = await execute(
        'INSERT INTO usuarios (username, email, password_hash, userType) VALUES (?, ?, ?, ?)',
        [email, email, passwordHash, userType]
      );
      result = adminResult;
    } else if (userType === 'profesor') {
      // Insertar en profesores Y en usuarios
      const profesorResult = await execute(
        'INSERT INTO profesores (rut, nombres, apellidos, email, telefono, password_hash, especialidad, anos_experiencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [rut, nombres, apellidos, email, telefono, passwordHash, especialidad || '', anosExperiencia || 0]
      );
      
      // También insertar en tabla usuarios para login unificado
      await execute(
        'INSERT INTO usuarios (username, email, password_hash, userType) VALUES (?, ?, ?, ?)',
        [email, email, passwordHash, userType]
      );
      
      result = profesorResult;
    } else if (userType === 'estudiante') {
      // Insertar en estudiantes Y en usuarios
      const estudianteResult = await execute(
        'INSERT INTO estudiantes (rut, nombres, apellidos, email, telefono, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
        [rut, nombres, apellidos, email, telefono, passwordHash]
      );
      
      // También insertar en tabla usuarios para login unificado
      await execute(
        'INSERT INTO usuarios (username, email, password_hash, userType) VALUES (?, ?, ?, ?)',
        [email, email, passwordHash, userType]
      );
      
      result = estudianteResult;
    }

    // Actualizar usos del token
    await execute(
      'UPDATE token_registro SET usos_actuales = usos_actuales + 1 WHERE token = ?',
      [tokenRegistro]
    );

    console.log('✅ Usuario registrado exitosamente:', userType);

    res.status(201).json({ 
      message: 'Usuario registrado exitosamente',
      userType 
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'El email o RUT ya existe en el sistema' });
    } else {
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Obtener profesores para vista pública
router.get('/profesores', async (req, res) => {
  try {
    const [profesores] = await execute(
      'SELECT nombres, apellidos, especialidad FROM profesores WHERE estado = "activo" ORDER BY nombres'
    );
    res.json(profesores);
  } catch (error) {
    console.error('Error obteniendo profesores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ENDPOINT DE ESTADÍSTICAS - CORREGIR COMPLETAMENTE
router.get('/estadisticas', async (req, res) => {
  try {
    console.log('🔄 Obteniendo estadísticas...');
    
    // Consultas simples - la BD tiene datos
    const estudiantesQuery = await execute('SELECT COUNT(*) as total FROM estudiantes WHERE estado = "activo"');
    const profesoresQuery = await execute('SELECT COUNT(*) as total FROM profesores WHERE estado = "activo"');
    const instrumentosQuery = await execute('SELECT COUNT(*) as total FROM instrumentos WHERE estado_fisico != "reparacion"');
    
    console.log('📊 Resultados raw:', {
      estudiantes: estudiantesQuery,
      profesores: profesoresQuery,
      instrumentos: instrumentosQuery
    });

    const estadisticas = {
      estudiantes: estudiantesQuery[0]?.total || 0,
      profesores: profesoresQuery[0]?.total || 0,
      instrumentos: instrumentosQuery[0]?.total || 0,
      anosExperiencia: 4
    };

    console.log('📊 Estadísticas enviadas:', estadisticas);
    res.json(estadisticas);
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Ruta de prueba
router.get('/', (req, res) => {
  res.json({ mensaje: 'Auth API funcionando correctamente' });
});

module.exports = router;