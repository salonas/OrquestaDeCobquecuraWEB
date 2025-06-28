import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';
import { useNavigation } from '../../Navigation/NavigationProvider';
import { LogoColor } from '../../../utils/images';
import './Sidebar.css';

const SidebarProfesor = () => {
  const { 
    isCollapsed, 
    userNavigation, 
    userTheme, 
    userConfig,
    user,
    toggleSidebar,
    sidebarWidth
  } = useNavigation();
  
  const { logout } = useUser();
  const location = useLocation();
  
  if (!userNavigation.length || !user || user.userType !== 'profesor') {
    return null;
  }

  return (
    <aside 
      className={`sidebar sidebar-profesor ${isCollapsed ? 'collapsed' : 'expanded'}`}
      style={{ 
        width: sidebarWidth,
        backgroundColor: userTheme.primaryColor,
        borderRight: `2px solid ${userTheme.accentColor}`
      }}
    >
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={LogoColor} alt="Logo" className="sidebar-logo-img" />
          {!isCollapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-title">Panel Profesor</span>
              <span className="sidebar-subtitle">Orquesta Cobquecura</span>
            </div>
          )}
        </div>
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expandir' : 'Contraer'}
        >
          <i className={`fas fa-${isCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
        </button>
      </div>

      {/* Contenido */}
      <div className="sidebar-content">
        {/* Herramientas rápidas para profesor */}
        {!isCollapsed && (
          <div className="sidebar-profesor-tools">
            <div className="sidebar-quick-actions">
              <button className="quick-action-btn">
                <i className="fas fa-plus"></i>
                Nueva Tarea
              </button>
              <button className="quick-action-btn">
                <i className="fas fa-check"></i>
                Asistencia
              </button>
            </div>
          </div>
        )}

        {userNavigation.map((section, index) => (
          <div key={index} className="sidebar-section">
            {!isCollapsed && (
              <div className="sidebar-section-title">
                {section.section}
              </div>
            )}
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

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <i className="fas fa-chalkboard-teacher"></i>
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.nombres || 'Profesor'}</div>
              <div className="sidebar-user-role">
                <span className="user-type-badge badge-profesor">Profesor</span>
              </div>
              <div className="sidebar-user-specialty">Especialidad Musical</div>
            </div>
          )}
        </div>
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

export default SidebarProfesor;