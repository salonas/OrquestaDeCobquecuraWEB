import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';
import { useNavigation } from '../../Navigation/NavigationProvider';
import { LogoColor } from '../../../utils/images';
import './Sidebar.css';

const SidebarAdmin = () => {
  // Extrae datos de navegación y configuración del usuario
  const { 
    isCollapsed, 
    userNavigation, 
    userTheme, 
    userConfig,
    user,
    toggleSidebar,
    sidebarWidth
  } = useNavigation();
  
  // Hook para cerrar sesión
  const { logout } = useUser();
  // Obtiene la ruta actual para marcar elemento activo
  const location = useLocation();
  
  // Renderiza null si no hay navegación o el usuario no es administrador
  if (!userNavigation.length || !user || user.userType !== 'administrador') {
    return null;
  }

  return (
    <aside 
      className={`sidebar sidebar-admin ${isCollapsed ? 'collapsed' : 'expanded'}`}
      style={{ 
        width: sidebarWidth,
        backgroundColor: userTheme.primaryColor,
        borderRight: `2px solid ${userTheme.accentColor}`
      }}
    >
      {/* Encabezado con logo y botón para contraer/expandir */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={LogoColor} alt="Logo" className="sidebar-logo-img" />
          {!isCollapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-title">Admin Panel</span>
              <span className="sidebar-subtitle">Orquesta Cobquecura</span>
            </div>
          )}
        </div>
        {/* Botón para contraer/expandir sidebar */}
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expandir' : 'Contraer'}
        >
          <i className={`fas fa-${isCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
        </button>
      </div>

      {/* Contenido principal - elementos de navegación */}
      <div className="sidebar-content">
        {userNavigation.map((section, index) => (
          <div key={index} className="sidebar-section">
            {/* Título de sección (solo si no está colapsado) */}
            {!isCollapsed && (
              <div className="sidebar-section-title">
                {section.section}
              </div>
            )}
            {/* Lista de elementos de navegación */}
            <ul className="sidebar-items">
              {section.items.map((item, itemIndex) => (
                <li 
                  key={itemIndex} 
                  className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <Link to={item.path} className="sidebar-link">
                    <div className="sidebar-link-icon">
                      <i className={item.icon}></i>
                    </div>
                    {/* Texto del enlace (solo si no está colapsado) */}
                    {!isCollapsed && (
                      <div className="sidebar-link-content">
                        <span className="sidebar-link-text">{item.name}</span>
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Pie con información del usuario y botón de salir */}
      <div className="sidebar-footer">
        {/* Información del usuario administrador */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <i className="fas fa-user-shield"></i>
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.username || 'Admin'}</div>
              <div className="sidebar-user-role">
                <span className="user-type-badge badge-admin">
                  <i className="fas fa-shield-alt"></i>
                  ADMINISTRADOR
                </span>
              </div>
            </div>
          )}
        </div>
        {/* Botón para cerrar sesión */}
        <button 
          className="sidebar-logout"
          onClick={logout}
          title="Cerrar Sesión"
        >
          <i className="fas fa-sign-out-alt"></i>
          {!isCollapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  );
};

export default SidebarAdmin;