const express = require('express');
const jwt = require('jsonwebtoken');
const { execute } = require('../config/database');
const estudianteController = require('../controllers/estudianteController');
const router = express.Router();

// Middleware para verificar token general
const verificarToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error en verificación de token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar token de estudiante
const verificarEstudiante = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.userType !== 'estudiante') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    req.estudiante = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar administrador
const verificarAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.userType === 'administrador') {
      req.admin = {
        userId: decoded.userId,
        userType: decoded.userType,
        email: decoded.email
      };
    } else {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }

    next();
  } catch (error) {
    console.error('Error en verificación de admin:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar profesor
const verificarProfesor = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.userType === 'profesor') {
      const [profesores] = await execute(
        'SELECT * FROM profesores WHERE rut = ?',
        [decoded.userId]
      );
      
      if (profesores.length === 0) {
        return res.status(404).json({ error: 'Profesor no encontrado' });
      }

      req.profesor = {
        userId: decoded.userId,
        userType: decoded.userType,
        email: decoded.email,
        profesor: profesores[0]
      };
    } else {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de profesor.' });
    }

    next();
  } catch (error) {
    console.error('Error en verificación de profesor:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; 
        
        if (!token) {
            return res.status(401).json({ error: 'Token de acceso requerido' });
        }

        jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta', (err, user) => {
            if (err) {
                console.error('❌ Error verificando token:', err);
                return res.status(403).json({ error: 'Token inválido' });
            }
            
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('❌ Error en authenticateToken:', error);
        res.status(401).json({ error: 'Error de autenticación' });
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }
            
            // Verificar rol (puede ser 'administrador' o 'admin')
            if (req.user.userType !== role && req.user.userType !== 'administrador' && req.user.rol !== 'admin') {
                return res.status(403).json({ 
                    error: 'Acceso denegado. Se requieren permisos de administrador.',
                    userRole: req.user.userType || req.user.rol,
                    requiredRole: role
                });
            }
            
            next();
        } catch (error) {
            console.error('❌ Error en requireRole:', error);
            res.status(500).json({ error: 'Error verificando permisos' });
        }
    };
};

// Rutas usando el controller
router.get('/perfil', verificarEstudiante, estudianteController.getPerfil);
router.put('/perfil', verificarEstudiante, estudianteController.actualizarPerfil);
router.get('/dashboard', verificarEstudiante, estudianteController.getDashboard);
router.get('/mi-profesor', verificarEstudiante, estudianteController.getMiProfesor);
router.get('/horarios', verificarEstudiante, estudianteController.getHorarios);
router.get('/evaluaciones', verificarEstudiante, estudianteController.getEvaluaciones);
router.get('/tareas', verificarEstudiante, estudianteController.getTareas);
router.patch('/tareas/:id/completar', verificarEstudiante, estudianteController.completarTarea);
router.patch('/tareas/:id/progreso', verificarEstudiante, estudianteController.actualizarProgresoTarea);
router.get('/repertorio', verificarEstudiante, estudianteController.getRepertorio);
router.get('/asistencia', verificarEstudiante, estudianteController.getAsistencia);
router.get('/prestamos', verificarEstudiante, estudianteController.getPrestamos);
router.get('/notificaciones', verificarEstudiante, estudianteController.getNotificaciones);
router.patch('/notificaciones/:id/leida', verificarEstudiante, estudianteController.marcarNotificacionLeida);
router.get('/progreso', verificarEstudiante, estudianteController.getProgreso);

module.exports = {
  router,
  authenticateToken,
  requireRole,
  verificarToken,     
  verificarAdmin,    
  verificarProfesor,  
  verificarEstudiante
};