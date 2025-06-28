import React from 'react';
import SidebarItem from './SidebarItem';

// Componente que renderiza una sección del sidebar con sus elementos
const SidebarSection = ({ section, currentPath, isCollapsed, userType }) => {
  return (
    <div className="sidebar-section">
      {/* Título de la sección (solo visible cuando no está colapsado) */}
      {!isCollapsed && (
        <div className="sidebar-section-title">
          {section.section}
        </div>
      )}
      {/* Lista de elementos de navegación de la sección */}
      <ul className="sidebar-items">
        {section.items.map((item, index) => (
          <SidebarItem
            key={index}
            item={item}
            isActive={currentPath === item.path} // Marca el elemento activo
            isCollapsed={isCollapsed}
            userType={userType}
          />
        ))}
      </ul>
    </div>
  );
};

export default SidebarSection;