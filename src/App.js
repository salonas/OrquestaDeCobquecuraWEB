import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { AlertProvider } from './components/providers/AlertProvider';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import VistaPublica from './pages/Publico/VistaPublica';
import EquipoContacto from './pages/Publico/EquipoContacto';
import IniciarSesion from './pages/Autenticacion/IniciarSesion';
import Registro from './pages/Autenticacion/Registro';
import EstudiantePanel from './pages/Panel/Estudiante/EstudiantePanel';
import ProfesorPanel from './pages/Panel/Profesor/ProfesorPanel';
import AdminPanel from './pages/Panel/Admin/AdminPanel';
import NoticiaDetalle from './pages/Publico/NoticiaDetalle';
import TodasLasNoticias from './pages/Publico/TodasLasNoticias';
import TodosLosEventos from './pages/Publico/TodosLosEventos';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <AlertProvider>
      <UserProvider>
      <Router>
        <Routes>
          {/* RUTAS PROTEGIDAS */}
          <Route path="/panel/admin/*" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminPanel />
            </ProtectedRoute>
          } />
          
          <Route path="/panel/profesor/*" element={
            <ProtectedRoute allowedRoles={['profesor']}>
              <ProfesorPanel />
            </ProtectedRoute>
          } />
          
          <Route path="/panel/estudiante/*" element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <EstudiantePanel />
            </ProtectedRoute>
          } />

          {/* Rutas de autenticación */}
          <Route path="/iniciar-sesion" element={<IniciarSesion />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas públicas */}
          <Route path="/" element={<VistaPublica />} />
          <Route path="/noticia/:slug" element={<NoticiaDetalle />} />
          <Route path="/equipo-contacto" element={<EquipoContacto />} />
          <Route path="/noticias" element={<TodasLasNoticias />} />
          <Route path="/eventos" element={<TodosLosEventos />} />
        </Routes>
      </Router>
    </UserProvider>
    </AlertProvider>
  );
}

export default App;
