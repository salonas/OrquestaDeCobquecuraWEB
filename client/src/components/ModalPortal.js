import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const ModalPortal = ({ isOpen, onClose, children, className = '' }) => {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Agregar clase al body para prevenir scroll
      document.body.classList.add('modal-open');
      
      // Agregar clase de desenfoque al layout principal
      const adminLayout = document.querySelector('.admin-layout');
      if (adminLayout) {
        adminLayout.classList.add('modal-blur');
      }

      // Manejar tecla ESC
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      // Remover clases cuando se cierra el modal
      document.body.classList.remove('modal-open');
      
      const adminLayout = document.querySelector('.admin-layout');
      if (adminLayout) {
        adminLayout.classList.remove('modal-blur');
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    if (overlayRef.current) {
      overlayRef.current.classList.add('closing');
    }
    
    // Pequeña demora para la animación de cierre
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const handleOverlayClick = (e) => {
    // Mejorar detección de clic en overlay
    if (e.target === overlayRef.current) {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    }
  };

  // Prevenir propagación en el contenido
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={`modal-portal-overlay ${className}`}
      onClick={handleOverlayClick}
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
      style={{ zIndex: 9999 }}
    >
      <div 
        ref={contentRef}
        className="modal-portal-content"
        onClick={handleContentClick}
        onMouseDown={handleContentClick}
        role="document"
        style={{ zIndex: 10000 }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default ModalPortal;