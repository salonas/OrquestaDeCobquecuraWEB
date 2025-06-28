# 🎼 Orquesta Juvenil de Cobquecura - Sitio Web

Sistema web para la gestión administrativa y educativa de la Orquesta Juvenil de Cobquecura.

## 🚀 Características

- **Panel de Administración**: Gestión completa de estudiantes, profesores y eventos
- **Panel de Profesores**: Seguimiento de clases, evaluaciones y progreso
- **Panel de Estudiantes**: Acceso a horarios, tareas y recursos
- **Sistema de Noticias**: Publicación de noticias y eventos
- **Gestión de Instrumentos**: Control de préstamos y mantenimiento

## 🛠️ Tecnologías

### Frontend
- React 18
- Tailwind CSS
- React Router DOM

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- Multer (carga de archivos)

## 📋 Prerrequisitos

- Node.js (v16 o superior)
- MySQL (v8.0 o superior)
- Git

## ⚙️ Configuración del Proyecto

### 1. Clonar el repositorio
```bash
git clone https://github.com/salonas/OrquestaDeCobquecuraWEB.git
cd OrquestaDeCobquecuraWEB
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Configuración de la Base de Datos
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_contraseña_db
DB_NAME=orquesta_cobquecura
DB_PORT=3306

# Configuración JWT (IMPORTANTE: Cambia por una clave segura)
JWT_SECRET=tu_clave_secreta_jwt_muy_larga_y_segura_de_al_menos_64_caracteres

# Configuración del Servidor
PORT=5000
NODE_ENV=development
```

### 3. Configurar la Base de Datos

1. Crea la base de datos en MySQL:
```sql
CREATE DATABASE orquesta_cobquecura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Importa el esquema de la base de datos (si tienes un archivo SQL) o ejecuta las migraciones.

### 4. Instalar dependencias

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

### 5. Ejecutar el proyecto

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

## 🔒 Configuración de Seguridad

### Variables de Entorno Críticas

1. **JWT_SECRET**: Debe ser una cadena aleatoria de al menos 64 caracteres
   - Generar con: `openssl rand -base64 64`
   - Nunca compartir esta clave

2. **Credenciales de Base de Datos**: Nunca incluir en el código fuente
   - Usar un usuario específico para la aplicación
   - Configurar permisos mínimos necesarios

### Recomendaciones adicionales

- Cambiar contraseñas por defecto
- Configurar HTTPS en producción
- Implementar rate limiting
- Configurar logs de seguridad

## 📁 Estructura del Proyecto

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
├── .env.example         # Plantilla de variables de entorno
└── README.md
```

## 🚀 Despliegue

### Producción

1. Configurar variables de entorno de producción
2. Construir el frontend: `npm run build` (en /client)
3. Configurar servidor web (nginx/apache)
4. Configurar SSL/HTTPS
5. Configurar base de datos de producción

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Contacto

**Orquesta Juvenil de Cobquecura**
- Email: contacto@orquestacobquecura.cl
- Sitio Web: [www.orquestacobquecura.cl](http://www.orquestacobquecura.cl)

---

⭐ ¡Si este proyecto te fue útil, considera darle una estrella en GitHub!

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
