const { execute } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Ajusta según tu estructura

// Registro de usuarios
exports.register = async (req, res) => {
  try {
    const { username, email, password, userType, rutReferencia } = req.body;

    // Verificar si el usuario ya existe
    const [existingUsers] = await execute(
      'SELECT * FROM usuarios WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }

    // Encriptar contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Insertar nuevo usuario
    const [result] = await execute(
      'INSERT INTO usuarios (username, email, password_hash, rol, rut_referencia) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, userType, rutReferencia]
    );

    const token = jwt.sign(
      { userId: result.insertId, userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        username,
        email,
        userType
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Inicio de sesión
exports.login = async (req, res) => {
  const { email, password, userType } = req.body;

  try {
    // Buscar solo en la tabla usuarios
    const [users] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? AND userType = ?',
      [email, userType]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    const user = users[0];

    // Validar contraseña
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
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};