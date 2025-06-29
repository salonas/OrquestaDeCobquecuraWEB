/* Configuración por tipo de usuario */
export const userTypeConfig = {
  administrador: {
    theme: {
      primaryColor: '#1a237e',
      secondaryColor: '#3949ab',
      accentColor: '#5c6bc0',
      backgroundColor: '#f5f6fa'
    },
    settings: {
      sidebarDefaultWidth: '280px',
      sidebarCollapsedWidth: '70px',
      showQuickActions: true,
      showStats: true
    }
  },
  profesor: {
    theme: {
      primaryColor: '#2c3e50',
      secondaryColor: '#34495e',
      accentColor: '#3498db',
      backgroundColor: '#f4f6f9'
    },
    settings: {
      sidebarDefaultWidth: '270px',
      sidebarCollapsedWidth: '65px',
      showQuickActions: true,
      showStudentProgress: true
    }
  },
  estudiante: {
    theme: {
      primaryColor: '#4e73df',
      secondaryColor: '#6c5ce7',
      accentColor: '#74b9ff',
      backgroundColor: '#f8f9fc'
    },
    settings: {
      sidebarDefaultWidth: '260px',
      sidebarCollapsedWidth: '60px',
      showProgress: true,
      showUpcomingTasks: true
    }
  }
};

/* Menús de navegación específicos por usuario */
export const navigationMenus = {
  administrador: [
    {
      section: 'Gestión Principal',
      items: [
        { name: 'Dashboard', path: '/panel/admin/inicio', icon: 'fas fa-tachometer-alt', description: 'Panel de control principal' },
        { name: 'Estudiantes', path: '/panel/admin/estudiantes', icon: 'fas fa-user-graduate', description: 'Gestión de estudiantes' },
        { name: 'Profesores', path: '/panel/admin/profesores', icon: 'fas fa-chalkboard-teacher', description: 'Gestión de profesores' },
        { name: 'Asignaciones', path: '/panel/admin/asignaciones', icon: 'fas fa-link', description: 'Asignaciones profesor-estudiante' }
      ]
    },
    {
      section: 'Recursos y Control',
      items: [
        { name: 'Instrumentos', path: '/panel/admin/instrumentos', icon: 'fas fa-guitar', description: 'Gestión de instrumentos' },
        { name: 'Asistencia', path: '/panel/admin/asistencia', icon: 'fas fa-user-check', description: 'Control de asistencia' },
        { name: 'Evaluaciones', path: '/panel/admin/evaluaciones', icon: 'fas fa-clipboard-list', description: 'Gestión de evaluaciones' },
        { name: 'Préstamos', path: '/panel/admin/prestamos', icon: 'fas fa-handshake', description: 'Préstamos de instrumentos' }
      ]
    },
    {
      section: 'Contenido y Sistema',
      items: [
        { name: 'Eventos', path: '/panel/admin/eventos', icon: 'fas fa-calendar-alt', description: 'Gestión de eventos' },
        { name: 'Noticias', path: '/panel/admin/noticias', icon: 'fas fa-newspaper', description: 'Gestión de noticias' },
        { name: 'Reportes', path: '/panel/admin/reportes', icon: 'fas fa-chart-line', description: 'Reportes del sistema' },
        { name: 'Tokens', path: '/panel/admin/tokens', icon: 'fas fa-key', description: 'Tokens de registro' }
      ]
    }
  ],

  profesor: [
    {
      section: 'Mi Panel',
      items: [
        { name: 'Dashboard', path: '/panel/profesor/inicio', icon: 'fas fa-home' },
        { name: 'Mi Perfil', path: '/panel/profesor/perfil', icon: 'fas fa-user' }
      ]
    },
    {
      section: 'Gestión Académica',
      items: [
        { name: 'Mis Estudiantes', path: '/panel/profesor/estudiantes', icon: 'fas fa-users' },
        { name: 'Clases', path: '/panel/profesor/clases', icon: 'fas fa-chalkboard' },
        { name: 'Evaluaciones', path: '/panel/profesor/evaluaciones', icon: 'fas fa-star' },
        { name: 'Tareas', path: '/panel/profesor/tareas', icon: 'fas fa-tasks' },
        { name: 'Asistencia', path: '/panel/profesor/asistencia', icon: 'fas fa-check-circle' },
        { name: 'Progreso', path: '/panel/profesor/progreso', icon: 'fas fa-chart-line' }
      ]
    },
    {
      section: 'Gestión de Instrumentos',
      items: [
        { name: 'Préstamos', path: '/panel/profesor/prestamos', icon: 'fas fa-handshake' },
        { name: 'Repertorio', path: '/panel/profesor/repertorio', icon: 'fas fa-music' }
      ]
    }
  ],

  estudiante: [
    {
      section: 'Mi Panel',
      items: [
        { name: 'Dashboard', path: '/panel/estudiante/inicio', icon: 'fas fa-home' },
        { name: 'Mi Perfil', path: '/panel/estudiante/perfil', icon: 'fas fa-user' }
      ]
    },
    {
      section: 'Mi Aprendizaje',
      items: [
        { name: 'Mi Profesor', path: '/panel/estudiante/mi-profesor', icon: 'fas fa-chalkboard-teacher' },
        { name: 'Horario', path: '/panel/estudiante/horario', icon: 'fas fa-calendar' },
        { name: 'Tareas', path: '/panel/estudiante/tareas', icon: 'fas fa-tasks' },
        { name: 'Evaluaciones', path: '/panel/estudiante/evaluaciones', icon: 'fas fa-star' },
        { name: 'Repertorio', path: '/panel/estudiante/repertorio', icon: 'fas fa-music' },
        { name: 'Mi Progreso', path: '/panel/estudiante/progreso', icon: 'fas fa-chart-line' }
      ]
    },
    {
      section: 'Recursos',
      items: [
        { name: 'Préstamos', path: '/panel/estudiante/prestamos', icon: 'fas fa-handshake' }
      ]
    }
  ]
};

/* Configuraciones globales */
export const globalConfig = {
  appName: 'Orquesta de Cobquecura',
  defaultRedirects: {
    administrador: '/panel/admin/inicio',
    profesor: '/panel/profesor/inicio',
    estudiante: '/panel/estudiante/inicio'
  },
  sidebarTransitionDuration: '0.3s',
  enableAnimations: true,
  showUserStats: true,
  autoSave: true,
  autoSaveInterval: 30000
};

/* Utilidades */
export const getNavigationForUser = (userType) => {
  return navigationMenus[userType] || navigationMenus.administrador;
};

export const getConfigForUser = (userType) => {
  return userTypeConfig[userType] || userTypeConfig.administrador;
};

export const getRedirectForUser = (userType) => {
  return globalConfig.defaultRedirects[userType] || globalConfig.defaultRedirects.administrador;
};