import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useUser();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  // Si hay roles específicos requeridos, verificar que el usuario tenga el rol correcto
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.userType)) {
    // Redirigir según el tipo de usuario - USAR LAS RUTAS CORRECTAS
    switch (user.userType) {
      case 'administrador':
        return <Navigate to="/panel/admin/inicio" replace />;
      case 'profesor':
        return <Navigate to="/panel/profesor/inicio" replace />;
      case 'estudiante':
        return <Navigate to="/panel/estudiante/inicio" replace />;
      default:
        return <Navigate to="/iniciar-sesion" replace />;
    }
  }

  // Si todo está correcto, mostrar el componente hijo
  return children;
};

export default ProtectedRoute;