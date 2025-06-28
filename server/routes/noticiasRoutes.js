const express = require('express');
const router = express.Router();
const noticiasController = require('../controllers/noticiasController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadNoticia } = require('../middleware/upload'); 

// Rutas públicas
router.get('/', noticiasController.getAll);
router.get('/destacadas', noticiasController.getDestacadas);
router.get('/recientes', noticiasController.getRecientes);

// OBTENER IMÁGENES DE UNA NOTICIA (PÚBLICA)
router.get('/:id/imagenes', noticiasController.obtenerImagenesNoticia);

// Usar uploadNoticia en lugar de upload.multiple
router.post('/temporales/upload', uploadNoticia, noticiasController.subirArchivosTemporales);

// Rutas de administración (requieren autenticación)
router.post('/', authenticateToken, requireRole('administrador'), noticiasController.create);
router.put('/:id', authenticateToken, requireRole('administrador'), noticiasController.update);
router.delete('/:id', authenticateToken, requireRole('administrador'), noticiasController.delete);

// RUTAS PARA SUBIR IMÁGENES 
router.post('/:id/upload/imagenes', 
    authenticateToken, 
    requireRole('administrador'), 
    uploadNoticia, 
    noticiasController.subirImagenesANoticia
);

router.delete('/imagenes/:imagenId', 
    authenticateToken, 
    requireRole('administrador'), 
    noticiasController.eliminarImagen
);

// OBTENER NOTICIA POR SLUG 
router.get('/:slug', noticiasController.getBySlug);

// AGREGAR: Solo esta nueva ruta al final del archivo
router.get('/:slug/imagenes', noticiasController.getImagenesNoticia);

module.exports = router;