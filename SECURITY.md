# SECURITY CONFIGURATION - IMPORTANT

## BEFORE USING IN PRODUCTION

This repository is set up to be SECURE and does NOT contain sensitive credentials. However, you must configure the following variables before using the system:

### 1. Required Environment Variables

You must create a `.env` file at the root of the project with:

```env
# JWT SECRET (CRITICAL)
# Generate a secure key with: openssl rand -base64 64
JWT_SECRET=SECURE_KEY_WITH_AT_LEAST_64_CHARACTERS

# DATABASE
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_password_db
DB_NAME=orquesta_cobquecura
DB_PORT=3306

# SERVER
PORT=5000
NODE_ENV=development
```

### 2. Commands to Generate Secure Keys

#### JWT Secret (Linux/Mac/WSL):
```bash
openssl rand -base64 64
```

#### JWT Secret (PowerShell/Windows):
```powershell
[System.Web.Security.Membership]::GeneratePassword(64, 10)
```

#### JWT Secret (Online - use with caution):
Visit: https://generate-secret.vercel.app/64

### 3. Database Setup

1. **Create a specific user for the application:**
```sql
CREATE USER 'orquesta_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON orquesta_cobquecura.* TO 'orquesta_user'@'localhost';
FLUSH PRIVILEGES;
```

2. **Create the database:**
```sql
CREATE DATABASE orquesta_cobquecura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Security Verification

The system includes automatic checks that will prevent startup if:
- No JWT_SECRET is set
- No database password is set

### 5. Files that should NEVER be uploaded to Git

- `.env` (already in .gitignore)
- `server/uploads/*` (user files)
- `*.log` (system logs)
- `config/local.*` (local configurations)

### 6. Security Checklist for Production

- [ ] Unique and secure JWT_SECRET (64+ characters)
- [ ] Unique and strong database passwords
- [ ] HTTPS configured (SSL/TLS)
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] Security logs configured
- [ ] Automatic database backups
- [ ] Database user with minimum permissions

### 7. Emergency Contact

If you find any security problem, contact the system administrator immediately.

---

NOTE: Security is everyone's responsibility. Never share credentials and always use unique, secure passwords.

---

# CONFIGURACIÓN DE SEGURIDAD - IMPORTANTE

## ANTES DE USAR EN PRODUCCIÓN

Este repositorio se configuró para ser SEGURO y NO contiene credenciales sensibles. Sin embargo, se requiere configurar las siguientes variables antes de usar el sistema:

### 1. Variables de Entorno Obligatorias

Se debe crear un archivo `.env` en la raíz del proyecto con:

```env
# JWT SECRET (CRÍTICO)
# Se genera una clave segura con: openssl rand -base64 64
JWT_SECRET=CLAVE_SEGURA_DE_AL_MENOS_64_CARACTERES

# BASE DE DATOS
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_contraseña_db
DB_NAME=orquesta_cobquecura
DB_PORT=3306

# SERVIDOR
PORT=5000
NODE_ENV=development
```

### 2. Comandos para generar claves seguras

#### JWT Secret (Linux/Mac/WSL):
```bash
openssl rand -base64 64
```

#### JWT Secret (PowerShell/Windows):
```powershell
[System.Web.Security.Membership]::GeneratePassword(64, 10)
```

#### JWT Secret (Online - usar con precaución):
Visita: https://generate-secret.vercel.app/64

### 3. Configuración de Base de Datos

1. **Crear usuario específico para la aplicación:**
```sql
CREATE USER 'orquesta_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
GRANT SELECT, INSERT, UPDATE, DELETE ON orquesta_cobquecura.* TO 'orquesta_user'@'localhost';
FLUSH PRIVILEGES;
```

2. **Crear la base de datos:**
```sql
CREATE DATABASE orquesta_cobquecura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Verificación de Seguridad

El sistema incluye validaciones automáticas que impiden el inicio si:
- No hay JWT_SECRET configurado
- No hay contraseña de base de datos

### 5. Archivos que NUNCA deben subirse a Git

- `.env` (ya está en .gitignore)
- `server/uploads/*` (archivos de usuarios)
- `*.log` (logs del sistema)
- `config/local.*` (configuraciones locales)

### 6. Checklist de Seguridad para Producción

- [ ] JWT_SECRET único y seguro (64+ caracteres)
- [ ] Contraseñas de base de datos únicas y fuertes
- [ ] HTTPS configurado (SSL/TLS)
- [ ] Firewall configurado
- [ ] Rate limiting activado
- [ ] Logs de seguridad configurados
- [ ] Backups automáticos de base de datos
- [ ] Usuario de base de datos con permisos mínimos

### 7. Contacto de Emergencia

Si se encuentra algún problema de seguridad, se debe contactar inmediatamente al administrador del sistema.

---

NOTA: La seguridad es responsabilidad de todos. Nunca se deben compartir credenciales y siempre se deben usar contraseñas únicas y seguras.
