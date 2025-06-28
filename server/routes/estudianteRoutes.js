const express = require('express');
const estudianteController = require('../controllers/estudianteController');
const { verificarEstudiante } = require('../middleware/auth'); // ✅ IMPORTACIÓN CORREGIDA
const router = express.Router();

// Aplicar el middleware de verificación a todas las rutas
router.use(verificarEstudiante);

// Rutas usando el controller
router.get('/perfil', estudianteController.getPerfil);
router.put('/perfil', estudianteController.actualizarPerfil);
router.get('/dashboard', estudianteController.getDashboard);
router.get('/mi-profesor', estudianteController.getMiProfesor);
router.get('/horarios', estudianteController.getHorarios);
router.get('/evaluaciones', estudianteController.getEvaluaciones);
router.get('/tareas', estudianteController.getTareas);
router.patch('/tareas/:id/completar', estudianteController.completarTarea);
router.patch('/tareas/:id/progreso', estudianteController.actualizarProgresoTarea);
router.get('/repertorio', estudianteController.getRepertorio);
router.get('/progreso', estudianteController.getProgreso);
router.get('/prestamos', estudianteController.getPrestamos);
router.get('/asistencia', estudianteController.getAsistencia);
router.get('/notificaciones', estudianteController.getNotificaciones);
router.patch('/notificaciones/:id/leida', estudianteController.marcarNotificacionLeida);

module.exports = router;