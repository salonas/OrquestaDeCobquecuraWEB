import React from 'react';
import { useUser } from '../../../context/UserContext';
import { NavigationProvider } from '../../Navigation/NavigationProvider';
import SidebarAdmin from './SidebarAdmin';
import SidebarProfesor from './SidebarProfesor';
import SidebarEstudiante from './SidebarEstudiante';

/* Factory para renderizar el sidebar según el tipo de usuario */
const SidebarFactory = () => {
  const { user } = useUser();

  /* No renderizar si no hay usuario */
  if (!user) return null;

  /* Seleccionar componente según tipo de usuario */
  const renderSidebar = () => {
    switch (user.userType) {
      case 'administrador':
        return <SidebarAdmin />;
      case 'profesor':
        return <SidebarProfesor />;
      case 'estudiante':
        return <SidebarEstudiante />;
      default:
        return null;
    }
  };

  return (
    <NavigationProvider>
      {renderSidebar()}
    </NavigationProvider>
  );
};

export default SidebarFactory;