import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SidebarFactory from '../../../components/Layout/Sidebar/SidebarFactory';
import Dashboard from './Dashboard';
import Estudiantes from './Estudiantes';
import Clases from './Clases';
import Asistencia from './Asistencia';
import Evaluaciones from './Evaluaciones';
import Tareas from './Tareas';
import Repertorio from './Repertorio';
import Progreso from './Progreso';
import Prestamos from './Prestamos';
import './ProfesorPanel.css';

const ProfesorPanel = () => {
  return (
    <div className="profesor-layout">
      {/* Sidebar usando SidebarFactory */}
      <SidebarFactory />
      
      {/* Contenido principal usando la clase específica del CSS */}
      <div className="profesor-main">
        <Routes>
          <Route path="inicio" element={<Dashboard />} />
          <Route path="estudiantes" element={<Estudiantes />} />
          <Route path="clases" element={<Clases />} />
          <Route path="asistencia" element={<Asistencia />} />
          <Route path="evaluaciones" element={<Evaluaciones />} />
          <Route path="tareas" element={<Tareas />} />
          <Route path="repertorio" element={<Repertorio />} />
          <Route path="progreso" element={<Progreso />} />
          <Route path="prestamos" element={<Prestamos />} />
          {/* Redirección por defecto */}
          <Route path="" element={<Navigate to="inicio" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default ProfesorPanel;