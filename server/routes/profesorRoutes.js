const express = require('express');
const profesorController = require('../controllers/profesorController');
const { verificarProfesor } = require('../middleware/auth'); // ✅ IMPORTACIÓN CORREGIDA
const router = express.Router();

// Aplicar el middleware de verificación a todas las rutas
router.use(verificarProfesor);

// Rutas usando el controller
router.get('/perfil', profesorController.getPerfil);
router.get('/dashboard', profesorController.getDashboard);
router.get('/estudiantes', profesorController.getEstudiantes);
router.get('/clases', profesorController.getClases);
router.get('/asistencias', profesorController.getAsistencias);
router.post('/asistencias', profesorController.registrarAsistencia);
router.patch('/asistencias/:id', profesorController.marcarAsistencia);
router.get('/evaluaciones', profesorController.getEvaluaciones);
router.post('/evaluaciones', profesorController.crearEvaluacion);
router.get('/tareas', profesorController.getTareas);
router.post('/tareas', profesorController.crearTarea);
router.get('/repertorio', profesorController.getRepertorio);
router.get('/progreso', profesorController.getProgreso);
router.get('/prestamos', profesorController.getPrestamos);

module.exports = router;