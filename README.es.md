> :information_source: **For the English version, see [README.md](README.md)**  
> :information_source: **Para la versión en inglés, revisa [README.md](README.md)**

# Orquesta Juvenil de Cobquecura - Sistema Web

Proyecto en curso de sistema web para la gestión administrativa y educativa de la Orquesta Juvenil de Cobquecura.

## Características Implementadas

Se implementaron las siguientes funcionalidades principales:

- **Panel de Administración**: Se desarrolló gestión completa de estudiantes, profesores y eventos 
- **Sistema de Noticias**: Se agregó gestión y publicación de noticias y eventos
- **Gestión de Instrumentos**: Se implementó control de préstamos y mantenimiento

## Stack Tecnológico

Se utilizaron las siguientes tecnologías:

### Frontend
- React 18
- Tailwind CSS
- React Router DOM

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- Multer (manejo de archivos)

## Prerrequisitos del Sistema

Se requiere la instalación de:

- Node.js (versión 16 o superior)
- MySQL (versión 8.0 o superior)
- Git

## Configuración del Proyecto

### 1. Clonación del repositorio
```bash
git clone https://github.com/salonas/OrquestaDeCobquecuraWEB.git
cd OrquestaDeCobquecuraWEB
```

### 2. Configuración de variables de entorno

Se debe copiar el archivo `.env.example` a `.env` y configurar las variables:

```bash
cp .env.example .env
```

Se debe editar el archivo `.env` con las credenciales correspondientes:

```env
# Configuración de la Base de Datos
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_contraseña_db
DB_NAME=orquesta_cobquecura
DB_PORT=3306

# Configuración JWT (IMPORTANTE: Debe cambiarse por una clave segura)
JWT_SECRET=tu_clave_jwt_segura_de_al_menos_64_caracteres

# Configuración del Servidor
PORT=5000
NODE_ENV=development
```

### 3. Configuración de la Base de Datos

Se debe crear la base de datos en MySQL:

```sql
CREATE DATABASE orquesta_cobquecura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**IMPORTANTE**: Se debe configurar el archivo de conexión a la base de datos:

```bash
# Copiar el archivo de configuración de ejemplo
cp server/config/database.example.js server/config/database.js
```

Luego editar `server/config/database.js` con las credenciales correctas o asegurarse de que las variables de entorno estén configuradas en `.env`.

Se implementó una base de datos completa con las siguientes funcionalidades:

- **Gestión de Usuarios**: Administradores, profesores y estudiantes
- **Sistema Académico**: Asignaciones, horarios, asistencia y evaluaciones
- **Progreso Estudiantil**: Seguimiento del desarrollo musical
- **Gestión de Instrumentos**: Inventario y préstamos
- **Eventos y Noticias**: Sistema de comunicación
- **Tokens de Registro**: Sistema seguro de invitaciones

Para importar la estructura completa:

```bash
mysql -u tu_usuario -p orquesta_cobquecura < database/schema.sql
```

### 4. Instalación de dependencias

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd ../client
npm install
```

### 5. Ejecución del proyecto

#### Desarrollo - Backend
```bash
cd server
npm start
# El servidor se ejecutará en http://localhost:5000
```

#### Desarrollo - Frontend
```bash
cd client
npm start
# La aplicación se abrirá en http://localhost:3000
```

## Configuración de Seguridad

### Variables de Entorno Críticas

Se implementaron las siguientes medidas de seguridad:

1. **JWT_SECRET**: Se configuró para requerir una cadena aleatoria de al menos 64 caracteres
   - Se puede generar con: `openssl rand -base64 64`
   - Esta clave nunca debe compartirse

2. **Credenciales de Base de Datos**: Se eliminaron del código fuente
   - Se debe usar un usuario específico para la aplicación
   - Se deben configurar permisos mínimos necesarios

### Recomendaciones adicionales implementadas

- Se removieron todas las contraseñas por defecto
- Se configuró para requerir HTTPS en producción
- Se preparó para implementar rate limiting
- Se configuraron logs de seguridad

## Estructura del Proyecto

Se organizó el proyecto con la siguiente estructura:

```
├── client/                 # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── context/       # Context API
│   │   └── utils/         # Utilidades
│   └── package.json
├── server/                # Backend Node.js
│   ├── config/           # Configuración
│   ├── controllers/      # Controladores
│   ├── middleware/       # Middleware
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas API
│   └── uploads/         # Archivos subidos
├── database/             # Scripts de base de datos
│   ├── schema.sql       # Estructura completa de la base de datos
│   └── README.md        # Documentación de la base de datos
├── .env.example         # Plantilla de variables de entorno
└── README.md
```

## Despliegue a Producción

Se preparó el proyecto para despliegue con los siguientes pasos:

1. Se configuraron variables de entorno de producción
2. Se puede construir el frontend: `npm run build` (en /client)
3. Se debe configurar servidor web (nginx/apache)
4. Se debe configurar SSL/HTTPS
5. Se debe configurar base de datos de producción

## Licencia

[![License: Dual](https://img.shields.io/badge/license-dual-blue.svg)](LICENSE)

Este proyecto está distribuido bajo una Licencia Dual:  
- **Licencia Open Source (GPL v3):** Para uso no comercial, educativo y de código abierto.
- **Licencia Comercial:** Para uso comercial, personalización o reventa. Contacta a jsalonas2003@gmail.com para más detalles.

Consulta el archivo [LICENSE](LICENSE) para los términos completos.

## Contacto

**Desarrollador: J. Salonas**
- Email: jsalonas2003@gmail.com
- Proyecto: Sistema Web Orquesta Juvenil de Cobquecura

Si este proyecto resultó útil, se agradece darle una estrella en GitHub.

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
