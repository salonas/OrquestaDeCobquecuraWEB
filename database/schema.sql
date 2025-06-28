-- ===========================================================
-- BASE DE DATOS - ORQUESTA JUVENIL DE COBQUECURA
-- Sistema de Gestión Educativa y Administrativa
-- ===========================================================
-- Autor: J. Salinas
-- Versión: 1.0
-- Fecha: 2025
-- ===========================================================

DROP DATABASE IF EXISTS orquesta_cobquecura;
CREATE DATABASE orquesta_cobquecura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE orquesta_cobquecura;

-- =======================
-- TABLAS DE USUARIOS
-- =======================

-- Tabla principal de usuarios (administradores)
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    userType ENUM('administrador', 'profesor', 'estudiante') NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de profesores
CREATE TABLE profesores (
    rut VARCHAR(12) PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(15),
    especialidad VARCHAR(100),
    anos_experiencia INT DEFAULT 0,
    estado ENUM('activo', 'inactivo', 'licencia', 'vacaciones') DEFAULT 'activo',
    password_hash VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(255),
    fecha_ingreso DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de estudiantes
CREATE TABLE estudiantes (
    rut VARCHAR(12) PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(15),
    fecha_nacimiento DATE,
    estado ENUM('activo', 'inactivo', 'egresado', 'suspendido') DEFAULT 'activo',
    password_hash VARCHAR(255) NOT NULL,
    fecha_ingreso DATE,
    notas_adicionales TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =======================
-- SISTEMA ACADÉMICO
-- =======================

CREATE TABLE asignaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profesor_rut VARCHAR(12) NOT NULL,
    estudiante_rut VARCHAR(12) NOT NULL,
    instrumento VARCHAR(50) NOT NULL,
    fecha_asignacion DATE NOT NULL DEFAULT (CURRENT_DATE),
    estado ENUM('activa', 'finalizada', 'suspendida') DEFAULT 'activa',
    UNIQUE KEY unique_asignacion (profesor_rut, estudiante_rut, instrumento),
    FOREIGN KEY (profesor_rut) REFERENCES profesores(rut) ON DELETE CASCADE,
    FOREIGN KEY (estudiante_rut) REFERENCES estudiantes(rut) ON DELETE CASCADE
);

-- Tabla de horarios de clases
CREATE TABLE horarios_clases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profesor_rut VARCHAR(12) NOT NULL,
    estudiante_rut VARCHAR(12) NOT NULL,
    dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    materia VARCHAR(100),
    aula VARCHAR(50),
    estado ENUM('activo', 'suspendido', 'cancelado') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profesor_rut) REFERENCES profesores(rut) ON DELETE CASCADE,
    FOREIGN KEY (estudiante_rut) REFERENCES estudiantes(rut) ON DELETE CASCADE
);

-- Tabla de asistencia
CREATE TABLE asistencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_rut VARCHAR(12) NOT NULL,
    profesor_rut VARCHAR(12) NOT NULL,
    fecha_clase DATE NOT NULL,
    hora_clase TIME NOT NULL,
    asistio BOOLEAN DEFAULT FALSE,
    llego_tarde BOOLEAN DEFAULT FALSE,
    minutos_tardanza INT DEFAULT 0,
    justificacion TEXT,
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estudiante_rut) REFERENCES estudiantes(rut) ON DELETE CASCADE,
    FOREIGN KEY (profesor_rut) REFERENCES profesores(rut) ON DELETE CASCADE,
    UNIQUE KEY unique_asistencia (estudiante_rut, profesor_rut, fecha_clase, hora_clase)
);

-- Tabla de repertorio musical
CREATE TABLE repertorio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    compositor VARCHAR(100),
    genero VARCHAR(50),
    duracion_minutos INT,
    nivel ENUM('principiante', 'intermedio', 'avanzado') NOT NULL,
    dificultad INT CHECK (dificultad BETWEEN 1 AND 10),
    notas TEXT,
    partitura_url VARCHAR(255),
    audio_referencia_url VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tareas y práctica
CREATE TABLE tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profesor_rut VARCHAR(12) NOT NULL,
    estudiante_rut VARCHAR(12) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo ENUM('practica', 'estudio', 'repertorio', 'tecnica') NOT NULL,
    fecha_asignacion DATE NOT NULL,
    fecha_limite DATE,
    estado ENUM('pendiente', 'en_progreso', 'completada', 'vencida') DEFAULT 'pendiente',
    prioridad ENUM('baja', 'media', 'alta') DEFAULT 'media',
    tiempo_estimado_minutos INT,
    notas_profesor TEXT,
    notas_estudiante TEXT,
    fecha_completada DATETIME,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profesor_rut) REFERENCES profesores(rut) ON DELETE CASCADE,
    FOREIGN KEY (estudiante_rut) REFERENCES estudiantes(rut) ON DELETE CASCADE
);

-- Tabla de evaluaciones
CREATE TABLE evaluaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_rut VARCHAR(12) NOT NULL,
    profesor_rut VARCHAR(12) NOT NULL,
    tipo ENUM('tecnica', 'interpretacion', 'teoria', 'repertorio', 'examen') NOT NULL,
    titulo VARCHAR(200),
    descripcion TEXT,
    fecha_evaluacion DATE NOT NULL,
    calificacion DECIMAL(3,1) CHECK (calificacion BETWEEN 1.0 AND 7.0),
    observaciones TEXT,
    fortalezas TEXT,
    areas_mejora TEXT,
    repertorio_id INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estudiante_rut) REFERENCES estudiantes(rut) ON DELETE CASCADE,
    FOREIGN KEY (profesor_rut) REFERENCES profesores(rut) ON DELETE CASCADE,
    FOREIGN KEY (repertorio_id) REFERENCES repertorio(id) ON DELETE SET NULL
);

-- Tabla de progreso del estudiante
CREATE TABLE progreso_estudiante (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_rut VARCHAR(12) NOT NULL,
    profesor_rut VARCHAR(12) NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    nivel_tecnico ENUM('principiante', 'intermedio', 'avanzado'),
    promedio_calificaciones DECIMAL(3,1),
    asistencia_porcentaje DECIMAL(5,2),
    tareas_completadas INT DEFAULT 0,
    total_tareas INT DEFAULT 0,
    repertorio_dominado INT DEFAULT 0,
    horas_practica_semanal DECIMAL(4,1),
    observaciones_generales TEXT,
    metas_periodo TEXT,
    logros TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estudiante_rut) REFERENCES estudiantes(rut) ON DELETE CASCADE,
    FOREIGN KEY (profesor_rut) REFERENCES profesores(rut) ON DELETE CASCADE,
    UNIQUE KEY unique_progreso (estudiante_rut, profesor_rut, periodo)
);

-- =======================
-- GESTIÓN DE INSTRUMENTOS
-- =======================

CREATE TABLE instrumentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('Violín', 'Viola', 'Violoncello', 'Contrabajo', 'Piano', 'Guitarra', 'Flauta', 'Clarinete', 'Saxofón', 'Trompeta', 'Trombón', 'Percusión', 'Otros') NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100) UNIQUE,
    estado_fisico ENUM('excelente', 'bueno', 'regular', 'malo', 'reparacion') DEFAULT 'bueno',
    disponible BOOLEAN DEFAULT TRUE,
    ubicacion VARCHAR(100),
    valor_estimado DECIMAL(10,2),
    fecha_adquisicion DATE,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_disponible (disponible),
    INDEX idx_estado_fisico (estado_fisico)
);

-- Tabla de préstamos
CREATE TABLE prestamos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instrumento_id INT NOT NULL,
    estudiante_rut VARCHAR(12),
    profesor_rut VARCHAR(12),
    fecha_prestamo DATE NOT NULL,
    fecha_devolucion_programada DATE,
    fecha_devolucion_real DATE,
    estado ENUM('activo', 'devuelto', 'vencido', 'perdido') DEFAULT 'activo',
    observaciones_prestamo TEXT,
    observaciones_devolucion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instrumento_id) REFERENCES instrumentos(id) ON DELETE CASCADE,
    FOREIGN KEY (estudiante_rut) REFERENCES estudiantes(rut) ON DELETE SET NULL,
    FOREIGN KEY (profesor_rut) REFERENCES profesores(rut) ON DELETE SET NULL
);

-- =======================
-- EVENTOS Y COMUNICACIÓN
-- =======================

-- Tabla de eventos
CREATE TABLE eventos (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    lugar VARCHAR(200),
    tipo ENUM('concierto', 'ensayo', 'masterclass', 'competencia', 'presentacion') NOT NULL,
    estado ENUM('programado', 'realizado', 'cancelado', 'pospuesto') DEFAULT 'programado',
    visible BOOLEAN DEFAULT TRUE,
    capacidad_maxima INT,
    costo DECIMAL(8,2),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de noticias
CREATE TABLE noticias (
    id_noticia INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    contenido TEXT NOT NULL,
    resumen TEXT,
    fecha_publicacion DATE NOT NULL,
    autor VARCHAR(100),
    categoria VARCHAR(50),
    imagen_url VARCHAR(255),
    imagen_principal VARCHAR(255),
    imagenes_galeria JSON,
    tipo_archivo VARCHAR(20) DEFAULT 'imagen',
    tipo_mime VARCHAR(100),
    visible BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    vistas INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla para galería de imágenes
CREATE TABLE noticias_imagenes (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    noticia_id INT NOT NULL,
    imagen_url VARCHAR(500) NOT NULL,
    imagen_alt TEXT,
    orden INT DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    tipo_archivo VARCHAR(20) DEFAULT 'imagen',
    tipo_mime VARCHAR(100),
    tamaño_archivo BIGINT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (noticia_id) REFERENCES noticias(id_noticia) ON DELETE CASCADE
);

-- Tabla de tokens de registro
CREATE TABLE token_registro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    tipo_usuario ENUM('estudiante', 'profesor') NOT NULL,
    usos_maximos INT DEFAULT 1,
    usos_actuales INT DEFAULT 0,
    fecha_expiracion DATETIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_por INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destinatario_rut VARCHAR(12) NOT NULL,
    remitente_rut VARCHAR(12),
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('tarea', 'evaluacion', 'recordatorio', 'felicitacion', 'evento', 'sistema') NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (destinatario_rut) REFERENCES estudiantes(rut) ON DELETE CASCADE,
    FOREIGN KEY (remitente_rut) REFERENCES profesores(rut) ON DELETE SET NULL
);

-- =======================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =======================

CREATE INDEX idx_asignaciones_profesor ON asignaciones(profesor_rut);
CREATE INDEX idx_asignaciones_estudiante ON asignaciones(estudiante_rut);
CREATE INDEX idx_horarios_profesor ON horarios_clases(profesor_rut);
CREATE INDEX idx_horarios_estudiante ON horarios_clases(estudiante_rut);
CREATE INDEX idx_asistencia_fecha ON asistencia(fecha_clase);
CREATE INDEX idx_evaluaciones_estudiante ON evaluaciones(estudiante_rut);
CREATE INDEX idx_evaluaciones_profesor ON evaluaciones(profesor_rut);
CREATE INDEX idx_tareas_estudiante ON tareas(estudiante_rut);
CREATE INDEX idx_tareas_profesor ON tareas(profesor_rut);
CREATE INDEX idx_prestamos_activos ON prestamos(estado, fecha_prestamo);
CREATE INDEX idx_eventos_fecha ON eventos(fecha, visible);
CREATE INDEX idx_noticias_visible ON noticias(visible, fecha_publicacion);
CREATE INDEX idx_instrumentos_disponible_tipo ON instrumentos(disponible, tipo);
CREATE INDEX idx_noticias_slug ON noticias(slug);
CREATE INDEX idx_noticias_categoria ON noticias(categoria, visible);
CREATE INDEX idx_noticias_destacado ON noticias(destacado, visible, fecha_publicacion DESC);

-- =======================
-- FUNCIONES Y TRIGGERS
-- =======================

DROP FUNCTION IF EXISTS GenerarSlugUnico;
DELIMITER //
CREATE FUNCTION GenerarSlugUnico(titulo_input VARCHAR(255))
RETURNS VARCHAR(255)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE slug_base VARCHAR(255);
    DECLARE slug_final VARCHAR(255);
    DECLARE counter INT DEFAULT 0;
    
    SET slug_base = LOWER(titulo_input);
    SET slug_base = REGEXP_REPLACE(slug_base, '[^a-z0-9\\s]', '');
    SET slug_base = REGEXP_REPLACE(slug_base, '\\s+', '-');
    SET slug_base = SUBSTRING(slug_base, 1, 100);
    
    IF slug_base = '' OR slug_base IS NULL THEN
        SET slug_base = 'noticia';
    END IF;
    
    SET slug_final = slug_base;
    
    WHILE EXISTS(SELECT 1 FROM noticias WHERE slug = slug_final) DO
        SET counter = counter + 1;
        SET slug_final = CONCAT(slug_base, '-', counter);
    END WHILE;
    
    RETURN slug_final;
END //
DELIMITER ;

-- Trigger para generar slug automáticamente
DROP TRIGGER IF EXISTS before_insert_noticias_slug;
DELIMITER //
CREATE TRIGGER before_insert_noticias_slug
    BEFORE INSERT ON noticias
    FOR EACH ROW
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        SET NEW.slug = GenerarSlugUnico(NEW.titulo);
    END IF;
    
    IF NEW.fecha_publicacion IS NULL THEN
        SET NEW.fecha_publicacion = CURDATE();
    END IF;
END //
DELIMITER ;

-- =======================
-- VISTAS OPTIMIZADAS
-- =======================

-- Vista para noticias públicas
CREATE VIEW vista_noticias_publicas AS
SELECT 
    id_noticia,
    titulo,
    slug,
    resumen,
    fecha_publicacion,
    autor,
    categoria,
    imagen_principal,
    destacado,
    vistas,
    fecha_actualizacion
FROM noticias 
WHERE visible = TRUE
ORDER BY destacado DESC, fecha_publicacion DESC;

-- =======================
-- DATOS INICIALES
-- =======================

-- ⚠️ IMPORTANTE: Los datos de ejemplo se han removido por seguridad
-- Para datos de prueba, consultar la documentación o contactar al administrador

-- Usuario administrador inicial (DEBE CAMBIAR LA CONTRASEÑA)
INSERT INTO usuarios (username, email, password_hash, userType) VALUES 
('admin', 'admin@orquesta.local', 'dummy', 'administrador');

-- Token de registro inicial
INSERT INTO token_registro (token, tipo_usuario, usos_maximos, fecha_expiracion, activo)
VALUES ('tokenejemplo', 'estudiante', 999, DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE);

-- =======================
-- CONFIGURACIÓN FINAL
-- =======================

-- Mensaje de confirmación
SELECT 'Base de datos creada exitosamente' as Status;
SELECT 'IMPORTANTE: Cambiar credenciales por defecto antes de usar en producción' as Aviso;

-- ===========================================================
-- FIN DEL SCRIPT
-- ===========================================================
