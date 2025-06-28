# 🗄️ Base de Datos - Orquesta Juvenil de Cobquecura

Este directorio contiene los scripts SQL necesarios para configurar la base de datos del sistema.

## Archivos incluidos

### `schema.sql`
- **Estructura completa** de la base de datos
- **Tablas principales**: usuarios, profesores, estudiantes, instrumentos, etc.
- **Índices optimizados** para mejor rendimiento
- **Triggers y funciones** para automatización
- **Sin datos sensibles** - Seguro para repositorios públicos

## Instalación

### 1. Crear la base de datos
```bash
mysql -u root -p < database/schema.sql
```

### 2. Configurar variables de entorno
Asegúrate de tener configurado tu archivo `.env`:
```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=orquesta_cobquecura
```

### 3. Verificar conexión
El sistema incluye validaciones automáticas de conexión al iniciar.

## Seguridad

### Lo que está incluido:
- Estructura de tablas completa
- Índices y optimizaciones
- Usuario administrador básico
- Token de registro de ejemplo

### Lo que NO está incluido:
- Contraseñas reales
- Datos personales de estudiantes
- Información sensible

## Estructura Principal

### Módulos del Sistema:
- **Gestión de Usuarios** (administradores, profesores, estudiantes)
- **Sistema Académico** (asignaciones, horarios, tareas, evaluaciones)
- **Gestión de Instrumentos** (inventario, préstamos)
- **Eventos y Comunicación** (noticias, eventos, notificaciones)

### Características Técnicas:
- **Motor**: MySQL 8.0+
- **Codificación**: UTF8MB4 (soporte Unicode completo)
- **Optimización**: Índices estratégicos
- **Automatización**: Triggers para slugs y fechas
- **Integridad**: Claves foráneas y constraints

## Datos de Desarrollo

Para entornos de desarrollo, puedes:

1. **Usar datos ficticios** - El sistema funciona sin datos iniciales
2. **Importar datos de prueba** - Contactar al desarrollador
3. **Generar datos de prueba** - Usar seeders personalizados

## Soporte

Para soporte técnico o datos de ejemplo:
- **Email**: jsalonas2003@gmail.com
- **Desarrollador**: J. Salonas

## Comandos Útiles

```bash
# Respaldar base de datos
mysqldump -u usuario -p orquesta_cobquecura > backup.sql

# Restaurar base de datos
mysql -u usuario -p orquesta_cobquecura < backup.sql

# Verificar estructura
mysql -u usuario -p -e "SHOW TABLES;" orquesta_cobquecura
```

---

**Nota**: Esta base de datos está diseñada para ser escalable y soportar el crecimiento de la organización musical.
