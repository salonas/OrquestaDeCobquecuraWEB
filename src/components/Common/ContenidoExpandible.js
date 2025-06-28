import React, { useState, useEffect, useRef } from 'react';

const ContenidoExpandible = ({ 
  children, 
  maxLines = 3, 
  className = "",
  mostrarBoton = true 
}) => {
  const [expandido, setExpandido] = useState(false);
  const [necesitaExpansion, setNecesitaExpansion] = useState(false);
  const textoRef = useRef(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textoRef.current) {
        const element = textoRef.current;
        
        // Resetear estilos para medir altura real
        element.style.display = 'block';
        element.style.webkitLineClamp = 'unset';
        element.style.overflow = 'visible';
        
        const computedStyle = window.getComputedStyle(element);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
        const maxHeight = lineHeight * maxLines;
        
        const realHeight = element.scrollHeight;
        
        if (realHeight > maxHeight) {
          setNecesitaExpansion(true);
          // Aplicar truncado si no está expandido
          if (!expandido) {
            element.style.display = '-webkit-box';
            element.style.webkitLineClamp = maxLines;
            element.style.webkitBoxOrient = 'vertical';
            element.style.overflow = 'hidden';
          }
        } else {
          setNecesitaExpansion(false);
        }
      }
    };

    // Pequeño delay para asegurar que el contenido se ha renderizado
    const timer = setTimeout(checkOverflow, 100);
    
    return () => clearTimeout(timer);
  }, [children, maxLines, expandido]);

  const toggleExpansion = () => {
    setExpandido(!expandido);
  };

  return (
    <div className={`contenido-expandible ${className}`}>
      <div 
        ref={textoRef}
        className="texto-contenido"
      >
        {children}
      </div>
      
      {necesitaExpansion && mostrarBoton && (
        <button 
          className="btn-leer-mas mt-2"
          onClick={toggleExpansion}
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#1e3a8a',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '0',
            textDecoration: 'underline'
          }}
        >
          {expandido ? '← Ver menos' : 'Ver más →'}
        </button>
      )}
    </div>
  );
};

export default ContenidoExpandible;