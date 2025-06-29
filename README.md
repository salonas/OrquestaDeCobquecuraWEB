> :information_source: **For the Spanish version, see [README.es.md](README.es.md)**  
> :information_source: **Para la versión en español, revisa [README.es.md](README.es.md)**

# Cobquecura Youth Orchestra - Web System

Ongoing web system project for the administrative and educational management of the Cobquecura Youth Orchestra.

## Implemented Features

The following main functionalities have been implemented:

- **Administration Panel**: Complete management of students, teachers, and events.
- **News System**: Management and publication of news and events.
- **Instrument Management**: Control of loans and maintenance.

## Technology Stack

The following technologies have been used:

### Frontend
- React 18
- Tailwind CSS
- React Router DOM

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- Multer (file handling)

## System Prerequisites

Requires installation of:

- Node.js (version 16 or higher)
- MySQL (version 8.0 or higher)
- Git

## Project Setup

### 1. Clone the repository
```bash
git clone https://github.com/salonas/OrquestaDeCobquecuraWEB.git
cd OrquestaDeCobquecuraWEB
```

### 2. Environment variables setup

Copy the `.env.example` file to `.env` and configure the variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
# Database configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=orquesta_cobquecura
DB_PORT=3306

# JWT Configuration (IMPORTANT: Use a secure key)
JWT_SECRET=your_jwt_secret_password_of_at_least_64_characters

# Server configuration
PORT=5000
NODE_ENV=development
```

### 3. Database Setup

You must create the database in MySQL:

```sql
CREATE DATABASE orquesta_cobquecura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**IMPORTANT**: Configure the database connection file:

```bash
# Copy the example config file
cp server/config/database.example.js server/config/database.js
```

Then edit `server/config/database.js` with the correct credentials or ensure that the environment variables are set in `.env`.

A full database is implemented with the following features:

- **User Management**: Admins, teachers, and students
- **Academic System**: Assignments, schedules, attendance, and evaluations
- **Student Progress**: Tracking musical development
- **Instrument Management**: Inventory and loans
- **Events and News**: Communication system
- **Registration Tokens**: Secure invitation system

To import the full structure:

```bash
mysql -u your_user -p orquesta_cobquecura < database/schema.sql
```

### 4. Install dependencies

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

### 5. Run the project

#### Development - Backend
```bash
cd server
npm start
# The server will run at http://localhost:5000
```

#### Development - Frontend
```bash
cd client
npm start
# The application will open at http://localhost:3000
```

## Security Configuration

### Critical Environment Variables

The following security measures were implemented:

1. **JWT_SECRET**: Configured to require a random string of at least 64 characters
   - You can generate it with: `openssl rand -base64 64`
   - This key must never be shared

2. **Database Credentials**: Removed from the source code
   - A specific user for the application must be used
   - Only minimum necessary permissions should be set

### Additional Recommendations Implemented

- All default passwords were removed
- Configured to require HTTPS in production
- Prepared for rate limiting
- Security logs configured

## Project Structure

The project is organized as follows:

```
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Main pages
│   │   ├── context/        # Context API
│   │   └── utils/          # Utilities
│   └── package.json
├── server/                 # Node.js Backend
│   ├── config/             # Configuration
│   ├── controllers/        # Controllers
│   ├── middleware/         # Middleware
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   └── uploads/            # Uploaded files
├── database/               # Database scripts
│   ├── schema.sql          # Full database schema
│   └── README.md           # Database documentation
├── .env.example            # Environment variable template
└── README.md
```

## Production Deployment

The project is prepared for deployment with these steps:

1. Configure production environment variables
2. Build the frontend: `npm run build` (in /client)
3. Set up a web server (nginx/apache)
4. Configure SSL/HTTPS
5. Configure production database

## License

[![License: Dual](https://img.shields.io/badge/license-dual-blue.svg)](LICENSE)

This project is distributed under a Dual License:  
- **Open Source License (GPL v3):** For non-commercial, educational and open-source use.
- **Commercial License:** For commercial use, customization or resale. Contact jsalonas2003@gmail.com for details.

See the [LICENSE](LICENSE) file for complete terms.

## Contact

**Developer: J. Salinas**
- Email: jsalonas2003@gmail.com
- Project: Cobquecura Youth Orchestra Web System

If you find this project useful, please consider giving it a star on GitHub.

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