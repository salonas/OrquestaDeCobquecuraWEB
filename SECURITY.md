# 🔒 CONFIGURACIÓN DE SEGURIDAD - IMPORTANTE

## ⚠️ ANTES DE USAR EN PRODUCCIÓN

Este repositorio ha sido configurado para ser **SEGURO** y **NO** contiene credenciales sensibles. Sin embargo, necesitas configurar las siguientes variables antes de usar el sistema:

### 1. Variables de Entorno Obligatorias

Crea un archivo `.env` en la raíz del proyecto con:

```env
# 🔑 JWT SECRET (CRÍTICO)
# Genera una clave segura con: openssl rand -base64 64
JWT_SECRET=CAMBIA_ESTA_CLAVE_POR_UNA_SEGURA_DE_AL_MENOS_64_CARACTERES

# 🗄️ BASE DE DATOS
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_contraseña_segura_db
DB_NAME=orquesta_cobquecura
DB_PORT=3306

# 🌐 SERVIDOR
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

El sistema incluye validaciones automáticas que impedirán el inicio si:
- ❌ No hay JWT_SECRET configurado
- ⚠️ No hay contraseña de base de datos

### 5. Archivos que NUNCA deben subirse a Git

- ✅ `.env` (ya está en .gitignore)
- ✅ `server/uploads/*` (archivos de usuarios)
- ✅ `*.log` (logs del sistema)
- ✅ `config/local.*` (configuraciones locales)

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

Si encuentras algún problema de seguridad, contacta inmediatamente al administrador del sistema.

---

🔐 **RECUERDA**: La seguridad es responsabilidad de todos. Nunca compartas credenciales y siempre usa contraseñas únicas y seguras.
