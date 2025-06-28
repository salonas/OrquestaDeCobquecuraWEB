const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarAdmin } = require('../middleware/auth');
const { upload, uploadNoticia } = require('../middleware/upload');

// ==================== NOTICIAS ====================
router.get('/noticias', adminController.getNoticias);
router.post('/noticias',
  verificarAdmin,
  uploadNoticia,
  adminController.crearNoticia
);
router.put('/noticias/:id',
  verificarAdmin,
  uploadNoticia,
  adminController.actualizarNoticia
);
router.delete('/noticias/:id', verificarAdmin, adminController.eliminarNoticia);
router.get('/noticias/:id/imagenes', adminController.getImagenesNoticia);

// ✅ CORREGIR: Endpoints para manejo de imágenes
router.delete('/noticias/imagenes/:imagenId', verificarAdmin, adminController.eliminarImagenNoticia);
router.put('/noticias/:id/imagen-principal', verificarAdmin, adminController.cambiarImagenPrincipal);
router.delete('/noticias/:id/imagen-principal', verificarAdmin, adminController.quitarImagenPrincipal);

// ==================== DASHBOARD ====================
router.get('/dashboard', adminController.getDashboard);                  

// ==================== ESTUDIANTES ====================
router.get('/estudiantes', adminController.getEstudiantes);            
router.post('/estudiantes', adminController.crearEstudiante);           
router.put('/estudiantes/:rut', adminController.actualizarEstudiante);
router.delete('/estudiantes/:rut', adminController.eliminarEstudiante);
router.patch('/estudiantes/:rut/estado', adminController.cambiarEstadoEstudiante);

// ==================== PROFESORES ====================
router.get('/profesores', adminController.getProfesores);
router.post('/profesores', adminController.crearProfesor);
router.put('/profesores/:rut', adminController.actualizarProfesor);
router.delete('/profesores/:rut', adminController.eliminarProfesor);
router.patch('/profesores/:rut/estado', adminController.cambiarEstadoProfesor);

// ==================== INSTRUMENTOS ====================
router.get('/instrumentos', adminController.getInstrumentos);
router.post('/instrumentos', adminController.crearInstrumento);
router.put('/instrumentos/:id', adminController.actualizarInstrumento);
router.delete('/instrumentos/:id', adminController.eliminarInstrumento);
router.patch('/instrumentos/:id/disponibilidad', adminController.actualizarDisponibilidad);

// ==================== ASIGNACIONES ====================
router.get('/asignaciones', adminController.getAsignaciones);
router.post('/asignaciones', adminController.crearAsignacion);
router.put('/asignaciones/:id', adminController.actualizarAsignacion);
router.delete('/asignaciones/:id', adminController.eliminarAsignacion);

// ==================== PRÉSTAMOS ====================
router.get('/prestamos', adminController.getPrestamos);
router.post('/prestamos', adminController.crearPrestamo);
router.put('/prestamos/:id', adminController.actualizarPrestamo);
router.delete('/prestamos/:id', adminController.eliminarPrestamo);
router.patch('/prestamos/:id/devolver', adminController.devolverPrestamo);
router.patch('/prestamos/:id/estado', adminController.cambiarEstadoPrestamo);

// ==================== ASISTENCIA ====================
router.get('/asistencias', adminController.getAsistencias);
router.post('/asistencias', adminController.crearAsistencia);
router.put('/asistencias/:id', adminController.actualizarAsistencia);
router.delete('/asistencias/:id', adminController.eliminarAsistencia);
router.get('/horarios', adminController.getHorarios);

// ==================== EVALUACIONES ====================
router.get('/evaluaciones', adminController.getEvaluaciones);
router.post('/evaluaciones', adminController.crearEvaluacion);
router.put('/evaluaciones/:id', adminController.actualizarEvaluacion);
router.delete('/evaluaciones/:id', adminController.eliminarEvaluacion);

// ==================== TOKENS ====================
router.get('/tokens', adminController.getTokens);
router.post('/tokens', adminController.crearToken);
router.patch('/tokens/:id/desactivar', adminController.desactivarToken);
router.delete('/tokens/:id', adminController.eliminarToken);

// ==================== EVENTOS ====================
router.get('/eventos', adminController.getEventos);
router.post('/eventos', adminController.crearEvento);
router.put('/eventos/:id', adminController.actualizarEvento);
router.delete('/eventos/:id', adminController.eliminarEvento);
router.patch('/eventos/:id/toggle', adminController.toggleVisibilidadEvento);

// ==================== REPORTES ====================
router.get('/reportes/:tipo', adminController.generarReporte);

// ==================== REPERTORIO ====================
router.get('/repertorio', adminController.getRepertorio);

// ==================== USUARIOS ====================
router.post('/usuarios', adminController.crearUsuarioAdmin);

module.exports = router;