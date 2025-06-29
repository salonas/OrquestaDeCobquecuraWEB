import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';
import { useNavigation } from '../../Navigation/NavigationProvider';
import { LogoColor } from '../../../utils/images';
import './Sidebar.css';

const SidebarEstudiante = () => {
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
  
  if (!userNavigation.length || !user || user.userType !== 'estudiante') {
    return null;
  }

  return (
    <aside 
      className={`sidebar sidebar-estudiante ${isCollapsed ? 'collapsed' : 'expanded'}`}
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
              <span className="sidebar-title">Mi Panel</span>
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
        {/* Progreso rápido para estudiante */}
        {!isCollapsed && (
          <div className="sidebar-progress">
            <div className="progress-card">
              <div className="progress-item">
                <span className="progress-label">
                  <i className="fas fa-star me-2"></i>
                  Promedio:
                </span>
                <span className="progress-value">6.5</span>
              </div>
              <div className="progress-item">
                <span className="progress-label">
                  <i className="fas fa-check-circle me-2"></i>
                  Asistencia:
                </span>
                <span className="progress-value">92%</span>
              </div>
              <div className="progress-item">
                <span className="progress-label">
                  <i className="fas fa-tasks me-2"></i>
                  Tareas:
                </span>
                <span className="progress-value">8/10</span>
              </div>
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
            <i className="fas fa-user-graduate"></i>
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.nombres || 'Estudiante'}</div>
              <div className="sidebar-user-role">
                <span className="user-type-badge badge-estudiante">Estudiante</span>
              </div>
              <div className="sidebar-user-instrument">Instrumento Principal</div>
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

export default SidebarEstudiante;