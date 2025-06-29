import React, { createContext, useContext, useState, useEffect } from 'react';
import ConfirmationModal from '../ui/ConfirmationModal';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTimesCircle, 
  FaInfoCircle,
  FaQuestionCircle,
  FaTimes 
} from 'react-icons/fa';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  // Estado para confirmaciones (modales)
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
  });

  // Estado para notificaciones toast
  const [toasts, setToasts] = useState([]);

  // Función para generar ID único
  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Función para agregar toast
  const addToast = (toast) => {
    const id = generateId();
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove después del tiempo especificado
    if (toast.autoClose !== false) {
      const duration = toast.duration || 4000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  // Función para remover toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Función principal para mostrar toasts
  const showToast = ({
    title,
    description,
    type = 'info',
    duration = 4000,
    autoClose = true,
    action = null
  }) => {
    return addToast({
      title,
      description,
      type,
      duration: autoClose ? duration : false,
      autoClose,
      action
    });
  };

  // Función para confirmaciones (usa modal)
  const showConfirm = (title, description, options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        description,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          if (options.onConfirm) options.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          if (options.onCancel) options.onCancel();
          resolve(false);
        },
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
      });
    });
  };

  // Funciones de conveniencia para toasts
  const showInfo = (title, description, options = {}) => {
    return showToast({ title, description, type: 'info', ...options });
  };

  const showSuccess = (title, description, options = {}) => {
    return showToast({ title, description, type: 'success', ...options });
  };

  const showWarning = (title, description, options = {}) => {
    return showToast({ title, description, type: 'warning', ...options });
  };

  const showError = (title, description, options = {}) => {
    return showToast({ title, description, type: 'error', duration: 6000, ...options });
  };

  // Función legacy (mantiene compatibilidad)
  const showAlert = ({ title, description, type = 'info', ...options }) => {
    if (type === 'confirm') {
      return showConfirm(title, description, options);
    }
    return showToast({ title, description, type, ...options });
  };

  // Función para obtener iconos
  const getIconForType = (type) => {
    const iconProps = { size: 18 };
    
    switch (type) {
      case 'success':
        return <FaCheckCircle {...iconProps} />;
      case 'error':
        return <FaTimesCircle {...iconProps} />;
      case 'warning':
        return <FaExclamationTriangle {...iconProps} />;
      case 'confirm':
        return <FaQuestionCircle {...iconProps} />;
      default:
        return <FaInfoCircle {...iconProps} />;
    }
  };

  // Componente Toast individual
  const ToastItem = ({ toast }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
      setIsExiting(true);
      setTimeout(() => {
        removeToast(toast.id);
      }, 400); // Tiempo de la animación de salida
    };

    useEffect(() => {
      if (toast.autoClose !== false) {
        const timer = setTimeout(() => {
          handleClose();
        }, toast.duration || 4000);

        return () => clearTimeout(timer);
      }
    }, [toast.autoClose, toast.duration]);

    return (
      <div 
        className={`orquesta-toast orquesta-toast-${toast.type} orquesta-toast-enter ${
          isExiting ? 'orquesta-toast-exit' : ''
        }`}
      >
        <div className="orquesta-toast-content">
          <div className="orquesta-toast-header">
            <div className="orquesta-toast-icon-container">
              {getIconForType(toast.type)}
            </div>
            <div className="orquesta-toast-text">
              <h4 className="orquesta-toast-title">{toast.title}</h4>
              {toast.description && (
                <p className="orquesta-toast-description">{toast.description}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="orquesta-toast-close"
              aria-label="Cerrar notificación"
            >
              <FaTimes size={14} />
            </button>
          </div>
          
          {toast.action && (
            <div className="orquesta-toast-actions">
              {toast.action}
            </div>
          )}
        </div>
        
        {toast.autoClose && (
          <div className="orquesta-toast-progress">
            <div 
              className="orquesta-toast-progress-bar" 
              style={{ 
                animationDuration: `${toast.duration || 4000}ms`,
                animationName: 'orquesta-toast-progress'
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const value = {
    showAlert,
    showConfirm,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showToast,
    removeToast,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      
      {/* Container de Toasts */}
      <div className="orquesta-toast-container">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>

      {/* Modal de Confirmación */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </AlertContext.Provider>
  );
};

export default AlertProvider;
