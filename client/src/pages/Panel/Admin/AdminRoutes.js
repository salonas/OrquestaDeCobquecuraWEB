import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importación de componentes para cada sección del panel administrativo
import AdminInicio from './Inicio';
import AdminEstudiantes from './Estudiantes';
import AdminProfesores from './Profesores';
import AdminInstrumentos from './Instrumentos';
import AdminNoticias from './Noticias';
import AdminEventos from './Eventos';
import AdminPrestamos from './Prestamos';
import AdminEvaluaciones from './Evaluaciones';
import AdminAsignaciones from './Asignaciones';
import AdminReportes from './Reportes';
import AdminTokens from './Tokens';

// Componente que define las rutas del panel administrativo
const AdminRoutes = () => (
  <Routes>
    {/* Ruta principal del panel admin */}
    <Route path="/" element={<AdminInicio />} />
    {/* Gestión de estudiantes */}
    <Route path="estudiantes" element={<AdminEstudiantes />} />
    {/* Gestión de profesores */}
    <Route path="profesores" element={<AdminProfesores />} />
    {/* Gestión de instrumentos */}
    <Route path="instrumentos" element={<AdminInstrumentos />} />
    {/* Gestión de noticias */}
    <Route path="noticias" element={<AdminNoticias />} />
    {/* Gestión de eventos */}
    <Route path="eventos" element={<AdminEventos />} />
    {/* Gestión de préstamos de instrumentos */}
    <Route path="prestamos" element={<AdminPrestamos />} />
    {/* Gestión de evaluaciones */}
    <Route path="evaluaciones" element={<AdminEvaluaciones />} />
    {/* Gestión de asignaciones */}
    <Route path="asignaciones" element={<AdminAsignaciones />} />
    {/* Generación de reportes */}
    <Route path="reportes" element={<AdminReportes />} />
    {/* Gestión de tokens de acceso */}
    <Route path="tokens" element={<AdminTokens />} />
  </Routes>
);

export default AdminRoutes;