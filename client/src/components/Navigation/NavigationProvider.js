import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { navigationMenus, userTypeConfig } from './navigationConfig'; // <-- Cambia aquí

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation debe usarse dentro de NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const { user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState([]);

  // Obtener configuración del usuario actual
  const getUserConfig = () => {
    if (!user || !user.userType) return userTypeConfig.administrador.settings;
    return userTypeConfig[user.userType]?.settings || userTypeConfig.administrador.settings;
  };

  // Obtener navegación del usuario actual
  const getUserNavigation = () => {
    if (!user || !user.userType) return [];
    return navigationMenus[user.userType] || [];
  };

  // Obtener tema del usuario actual
  const getUserTheme = () => {
    if (!user || !user.userType) return userTypeConfig.administrador.theme;
    return userTypeConfig[user.userType]?.theme || userTypeConfig.administrador.theme;
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Guardar preferencia por tipo de usuario
    localStorage.setItem(
      `sidebarCollapsed_${user.userType}`, 
      (!isCollapsed).toString()
    );
  };

  // Toggle sección específica
  const toggleSection = (sectionName) => {
    setOpenSections(prev => {
      const newSections = prev.includes(sectionName)
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName];
      
      // Guardar por tipo de usuario
      localStorage.setItem(
        `openSections_${user.userType}`, 
        JSON.stringify(newSections)
      );
      
      return newSections;
    });
  };

  // Cargar preferencias guardadas cuando cambie el usuario
  useEffect(() => {
    if (!user?.userType) return;

    // Cargar estado del sidebar
    const savedCollapsed = localStorage.getItem(`sidebarCollapsed_${user.userType}`);
    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === 'true');
    } else {
      setIsCollapsed(false);
    }

    // Cargar secciones abiertas
    const savedSections = localStorage.getItem(`openSections_${user.userType}`);
    if (savedSections) {
      try {
        setOpenSections(JSON.parse(savedSections));
      } catch (error) {
        console.error('Error parsing saved sections:', error);
        setOpenSections([]);
      }
    } else {
      // Abrir todas las secciones por defecto
      const allSections = getUserNavigation().map(section => section.section);
      setOpenSections(allSections);
    }
  }, [user?.userType]);

  // Verificar si una sección está abierta
  const isSectionOpen = (sectionName) => {
    return openSections.includes(sectionName);
  };

  // Obtener estadísticas del usuario
  const getNavigationStats = () => {
    const navigation = getUserNavigation();
    return {
      totalSections: navigation.length,
      totalItems: navigation.reduce((acc, section) => acc + section.items.length, 0),
      openSections: openSections.length,
      userType: user?.userType || 'unknown'
    };
  };

  // Asegúrate de que las rutas de navegación para admin tengan el prefijo correcto
  const getNavigationForUser = (userType) => {
    switch (userType) {
      case 'administrador':
        return [
          {
            section: 'Principal',
            items: [
              { name: 'Dashboard', path: '/admin/inicio', icon: 'fas fa-tachometer-alt' },
              { name: 'Estudiantes', path: '/admin/estudiantes', icon: 'fas fa-user-graduate' },
              { name: 'Profesores', path: '/admin/profesores', icon: 'fas fa-chalkboard-teacher' },
            ]
          },
          {
            section: 'Gestión',
            items: [
              { name: 'Instrumentos', path: '/admin/instrumentos', icon: 'fas fa-music' },
              { name: 'Eventos', path: '/admin/eventos', icon: 'fas fa-calendar-alt' },
              { name: 'Noticias', path: '/admin/noticias', icon: 'fas fa-newspaper' },
              { name: 'Préstamos', path: '/admin/prestamos', icon: 'fas fa-hand-holding' },
            ]
          },
          {
            section: 'Académico',
            items: [
              { name: 'Asignaciones', path: '/admin/asignaciones', icon: 'fas fa-users-cog' },
              { name: 'Evaluaciones', path: '/admin/evaluaciones', icon: 'fas fa-clipboard-check' },
              { name: 'Reportes', path: '/admin/reportes', icon: 'fas fa-chart-bar' },
            ]
          },
          {
            section: 'Sistema',
            items: [
              { name: 'Tokens', path: '/admin/tokens', icon: 'fas fa-key' },
            ]
          }
        ];
      // ...otros casos...
    }
  };

  const value = {
    // Estado
    isCollapsed,
    openSections,
    userNavigation: getUserNavigation(),
    userTheme: getUserTheme(),
    userConfig: getUserConfig(),
    user: user,
    
    // Acciones
    toggleSidebar,
    toggleSection,
    
    // Utilidades
    isSectionOpen,
    getNavigationStats,
    
    // Datos calculados
    sidebarWidth: isCollapsed ? 
      getUserConfig().sidebarCollapsedWidth : 
      getUserConfig().sidebarDefaultWidth
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};