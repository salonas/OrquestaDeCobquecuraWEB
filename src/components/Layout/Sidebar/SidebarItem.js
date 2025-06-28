import React from 'react';
import { Link } from 'react-router-dom';

/* Componente para elementos individuales del sidebar */
const SidebarItem = ({ item, isActive, isCollapsed, userType }) => {
  return (
    <li className={`sidebar-item ${isActive ? 'active' : ''}`}>
      <Link 
        to={item.path} 
        className="sidebar-link"
        title={isCollapsed ? item.name : item.description}
      >
        {/* Icono del item */}
        <div className="sidebar-link-icon">
          <i className={item.icon}></i>
        </div>
        
        {/* Contenido del link (solo visible cuando está expandido) */}
        {!isCollapsed && (
          <div className="sidebar-link-content">
            <span className="sidebar-link-text">{item.name}</span>
            {item.description && (
              <span className="sidebar-link-description">{item.description}</span>
            )}
          </div>
        )}
        
        {/* Indicador de estado activo */}
        {isActive && <div className="sidebar-active-indicator"></div>}
      </Link>
    </li>
  );
};

export default SidebarItem;