const multer = require('multer');
const path = require('path');
const fs = require('fs');

// CREAR DIRECTORIO SI NO EXISTE
const uploadDir = path.join(__dirname, '..', 'uploads', 'noticias');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Directorio de uploads creado:', uploadDir);
}

// CONFIGURACIÓN DE ALMACENAMIENTO
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const newFilename = `${file.fieldname}-${uniqueSuffix}${extension}`;
    cb(null, newFilename);
  }
});

// FILTRO DE ARCHIVOS
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

// CONFIGURACIÓN DE MULTER
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

// MIDDLEWARE
const uploadNoticia = upload.fields([
  { name: 'imagen', maxCount: 1 },           // Imagen principal
  { name: 'imagenes_galeria', maxCount: 20 }, // Galería
  { name: 'videos', maxCount: 10 },          // Videos
  { name: 'archivos', maxCount: 30 }         // Otros archivos
]);

module.exports = {
  upload,
  uploadNoticia
};