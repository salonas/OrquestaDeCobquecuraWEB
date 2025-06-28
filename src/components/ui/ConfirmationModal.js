import React from 'react';
import ModalPortal from '../ModalPortal';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel 
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={handleCancel}>
      <div className="orquesta-confirm-modal">
        <div className="orquesta-confirm-content">
          <div className="orquesta-confirm-header">
            <div className="orquesta-confirm-icon">
              <i className="fas fa-question-circle"></i>
            </div>
            <div className="orquesta-confirm-title">
              {title}
            </div>
          </div>

          {description && (
            <div className="orquesta-confirm-description">
              {description}
            </div>
          )}

          <div className="orquesta-confirm-actions">
            <button
              onClick={handleCancel}
              className="orquesta-btn orquesta-btn-secondary"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className="orquesta-btn orquesta-btn-primary"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ConfirmationModal;
