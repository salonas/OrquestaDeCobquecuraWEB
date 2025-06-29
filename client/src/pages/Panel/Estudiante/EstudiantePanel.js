import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SidebarFactory from '../../../components/Layout/Sidebar/SidebarFactory';
import Dashboard from './Dashboard';
import Evaluaciones from './Evaluaciones';
import Horario from './Horario';
import MiProfesor from './MiProfesor';
import Prestamos from './Prestamos';
import Progreso from './Progreso';
import Repertorio from './Repertorio';
import Tareas from './Tareas';
import Perfil from './Perfil';
import './EstudiantePanel.css';

const EstudiantePanel = () => {
  return (
    <div className="estudiante-layout">
      {/* Sidebar usando SidebarFactory */}
      <SidebarFactory />
      
      {/* Contenido principal usando la clase específica del CSS */}
      <div className="estudiante-main">
        <Routes>
          <Route path="inicio" element={<Dashboard />} />
          <Route path="evaluaciones" element={<Evaluaciones />} />
          <Route path="horario" element={<Horario />} />
          <Route path="mi-profesor" element={<MiProfesor />} />
          <Route path="prestamos" element={<Prestamos />} />
          <Route path="progreso" element={<Progreso />} />
          <Route path="repertorio" element={<Repertorio />} />
          <Route path="tareas" element={<Tareas />} />
          <Route path="perfil" element={<Perfil />} />
          {/* Redirección por defecto */}
          <Route path="" element={<Navigate to="inicio" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default EstudiantePanel;