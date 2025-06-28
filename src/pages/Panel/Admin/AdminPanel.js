import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SidebarFactory from '../../../components/Layout/Sidebar/SidebarFactory';
// Componentes del panel administrativo
import Dashboard from './Dashboard';
import Estudiantes from './Estudiantes';
import Profesores from './Profesores';
import Instrumentos from './Instrumentos';
import Eventos from './Eventos';
import Noticias from './Noticias';
import Prestamos from './Prestamos';
import Reportes from './Reportes';
import Tokens from './Tokens';
import Asignaciones from './Asignaciones';
import Evaluaciones from './Evaluaciones';
import Asistencia from './Asistencia';
import './AdminPanel.css';

/**
 * Panel de administración principal
 */
const AdminPanel = () => {
  // Aplica estilos específicos al panel
  useEffect(() => {
    document.body.className = 'admin-panel-active';
    
    return () => {
      document.body.className = '';
    };
  }, []);

  return (
    <div className="admin-panel-container">
      <div className="admin-layout">
        {/* Sidebar de navegación */}
        <SidebarFactory />
        
        {/* Contenido principal */}
        <div className="admin-main">
          <Routes>
            {/* Dashboard */}
            <Route path="inicio" element={<Dashboard />} />
            
            {/* Gestión de usuarios */}
            <Route path="estudiantes" element={<Estudiantes />} />
            <Route path="profesores" element={<Profesores />} />
            
            {/* Gestión de recursos */}
            <Route path="instrumentos" element={<Instrumentos />} />
            <Route path="prestamos" element={<Prestamos />} />
            
            {/* Gestión de contenido */}
            <Route path="eventos" element={<Eventos />} />
            <Route path="noticias" element={<Noticias />} />
            
            {/* Gestión académica */}
            <Route path="asignaciones" element={<Asignaciones />} />
            <Route path="evaluaciones" element={<Evaluaciones />} />
            <Route path="asistencia" element={<Asistencia />} />
            
            {/* Sistema */}
            <Route path="reportes" element={<Reportes />} />
            <Route path="tokens" element={<Tokens />} />
            
            {/* Redirección por defecto */}
            <Route path="" element={<Navigate to="inicio" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;