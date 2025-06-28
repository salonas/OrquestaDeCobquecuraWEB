const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// RUTAS ESPECÍFICAS PRIMERO
router.get('/publicos', eventosController.getPublicos);
router.get('/proximos', eventosController.getProximos);
router.get('/destacados', eventosController.getDestacados);

// RUTAS EXISTENTES
router.get('/admin/todos', eventosController.getAllEventos);
router.get('/tipo/:tipo', eventosController.getEventosPorTipo);
router.get('/search', eventosController.buscarEventos);
router.get('/estadisticas', eventosController.getEstadisticasEventos);

// RUTAS GENERALES
router.get('/', eventosController.getEventos);

// RUTAS CON PARÁMETROS AL FINAL (siempre últimas)
router.get('/:id', eventosController.getEvento);

// RUTAS ADMINISTRATIVAS
router.post('/', requireRole(['admin']), eventosController.crearEvento);
router.put('/:id', requireRole(['admin']), eventosController.actualizarEvento);
router.delete('/:id', requireRole(['admin']), eventosController.eliminarEvento);
router.patch('/:id/visibilidad', requireRole(['admin']), eventosController.cambiarVisibilidad);

// RUTA TEMPORAL PARA CREAR EVENTOS DE EJEMPLO
router.get('/crear-ejemplos', eventosController.crearEventosEjemplo);

module.exports = router;