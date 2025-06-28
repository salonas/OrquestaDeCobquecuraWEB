import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../../../components/providers/AlertProvider';

const Dashboard = () => {
  // Hook para navegación entre rutas
  const navigate = useNavigate();
  
  // Hook para alertas
  const { showSuccess, showError, showWarning, showConfirm } = useAlert();
  
  // Estado para almacenar estadísticas del sistema
  const [stats, setStats] = useState({
    estudiantes: 0,
    profesores: 0,
    instrumentos: 0,
    eventos: 0,
    noticias: 0,
    prestamosActivos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener estadísticas del servidor
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Petición a la API para obtener estadísticas
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
      // Opcional: mostrar mensaje de éxito solo si es necesario
      // showSuccess('Dashboard actualizado', 'Los datos se han cargado correctamente');
    } catch (error) {
      console.error('Error fetching stats:', error);
      showError('Error al cargar dashboard', error.message || 'No se pudieron cargar las estadísticas del sistema');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    fetchStats();
  }, []);

  // Navegar a diferentes secciones del panel
  const handleNavigate = (path) => {
    navigate(`/panel/admin/${path}`);
  };

  // Refrescar datos del dashboard
  const handleRefresh = () => {
    fetchStats();
  };

  // Función de prueba para alertas
  const testAlerts = () => {
    console.log('🔔 Probando alertas...');
    showSuccess('Prueba de Alerta', 'Esta es una prueba de alerta de éxito');
    setTimeout(() => {
      showError('Error de Prueba', 'Esta es una prueba de alerta de error');
    }, 1000);
    setTimeout(() => {
      showWarning('Advertencia de Prueba', 'Esta es una prueba de alerta de advertencia');
    }, 2000);
  };

  // Función de prueba para modal de confirmación
  const testConfirmation = async () => {
    console.log('🔔 Probando modal de confirmación...');
    const result = await showConfirm(
      'Confirmar Acción',
      '¿Estás seguro de que deseas realizar esta acción? Esta acción no se puede deshacer.',
      {
        confirmText: 'Sí, continuar',
        cancelText: 'Cancelar'
      }
    );
    
    if (result) {
      showSuccess('Confirmado', 'Has confirmado la acción correctamente');
    } else {
      showWarning('Cancelado', 'La operación ha sido cancelada');
    }
  };

  // Mostrar loading mientras cargan los datos
  if (loading) {
    return (
      <div className="admin-section">
        <div className="loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando dashboard...</span>
          </div>
          <p>Cargando estadísticas del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      {/* Encabezado del dashboard con botón de actualización */}
      <div className="admin-header">
        <h2>Dashboard Administrativo</h2>
        <div className="header-actions">
          <div className="stats">
            Última actualización: {new Date().toLocaleString('es-CL')}
          </div>
          <button
            onClick={handleRefresh}
            className="btn btn-outline-primary btn-sm"
          >
            <i className="fas fa-sync-alt"></i> Actualizar
          </button>
        </div>
      </div>

      {/* Panel de resumen estadístico */}
      <div className="filtros-busqueda">
        <h6><i className="fas fa-chart-pie"></i> Resumen General del Sistema</h6>
        <div className="dashboard-stats-grid">
          {/* Tarjeta de estadísticas - Estudiantes */}
          <div 
            className="stat-card estudiantes clickeable" 
            onClick={() => handleNavigate('estudiantes')}
            title="Ver gestión de estudiantes"
          >
            <div className="stat-icon">
              <i className="fas fa-user-graduate"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.estudiantes}</h3>
              <p>Estudiantes Activos</p>
              <small>Gestionar estudiantes</small>
            </div>
            <div className="stat-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>

          {/* Tarjeta de estadísticas - Profesores */}
          <div 
            className="stat-card profesores clickeable" 
            onClick={() => handleNavigate('profesores')}
            title="Ver gestión de profesores"
          >
            <div className="stat-icon">
              <i className="fas fa-chalkboard-teacher"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.profesores}</h3>
              <p>Profesores Activos</p>
              <small>Gestionar profesores</small>
            </div>
            <div className="stat-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>

          {/* Tarjeta de estadísticas - Instrumentos */}
          <div 
            className="stat-card instrumentos clickeable" 
            onClick={() => handleNavigate('instrumentos')}
            title="Ver gestión de instrumentos"
          >
            <div className="stat-icon">
              <i className="fas fa-music"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.instrumentos}</h3>
              <p>Instrumentos Disponibles</p>
              <small>Gestionar inventario</small>
            </div>
            <div className="stat-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>

          {/* Tarjeta de estadísticas - Eventos */}
          <div 
            className="stat-card eventos clickeable" 
            onClick={() => handleNavigate('eventos')}
            title="Ver gestión de eventos"
          >
            <div className="stat-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.eventos}</h3>
              <p>Eventos Próximos</p>
              <small>Gestionar eventos</small>
            </div>
            <div className="stat-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>

          {/* Tarjeta de estadísticas - Noticias */}
          <div 
            className="stat-card noticias clickeable" 
            onClick={() => handleNavigate('noticias')}
            title="Ver gestión de noticias"
          >
            <div className="stat-icon">
              <i className="fas fa-newspaper"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.noticias}</h3>
              <p>Noticias Publicadas</p>
              <small>Gestionar noticias</small>
            </div>
            <div className="stat-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>

          {/* Tarjeta de estadísticas - Préstamos */}
          <div 
            className="stat-card prestamos clickeable" 
            onClick={() => handleNavigate('prestamos')}
            title="Ver gestión de préstamos"
          >
            <div className="stat-icon">
              <i className="fas fa-handshake"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.prestamosActivos}</h3>
              <p>Préstamos Activos</p>
              <small>Gestionar préstamos</small>
            </div>
            <div className="stat-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de acciones rápidas usando el estilo de tabla */}
      <div className="tabla-container">
        <div className="dashboard-actions-header">
          <h5><i className="fas fa-bolt"></i> Acciones Rápidas</h5>
          <small>Accede directamente a las funciones más utilizadas</small>
        </div>
        
        <div className="dashboard-actions-grid">
          {/* Acción rápida - Nueva noticia */}
          <div className="action-card" onClick={() => handleNavigate('noticias')}>
            <div className="action-icon">
              <i className="fas fa-plus-circle"></i>
            </div>
            <div className="action-content">
              <h6>Nueva Noticia</h6>
              <p>Crear y publicar una nueva noticia</p>
            </div>
          </div>

          {/* Acción rápida - Nuevo evento */}
          <div className="action-card" onClick={() => handleNavigate('eventos')}>
            <div className="action-icon">
              <i className="fas fa-calendar-plus"></i>
            </div>
            <div className="action-content">
              <h6>Nuevo Evento</h6>
              <p>Programar un nuevo evento</p>
            </div>
          </div>

          {/* Acción rápida - Nuevo estudiante */}
          <div className="action-card" onClick={() => handleNavigate('estudiantes')}>
            <div className="action-icon">
              <i className="fas fa-user-plus"></i>
            </div>
            <div className="action-content">
              <h6>Nuevo Estudiante</h6>
              <p>Registrar un nuevo estudiante</p>
            </div>
          </div>

          {/* Acción rápida - Nuevo profesor */}
          <div className="action-card" onClick={() => handleNavigate('profesores')}>
            <div className="action-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <div className="action-content">
              <h6>Nuevo Profesor</h6>
              <p>Registrar un nuevo profesor</p>
            </div>
          </div>

          {/* Acción rápida - Nuevo préstamo */}
          <div className="action-card" onClick={() => handleNavigate('prestamos')}>
            <div className="action-icon">
              <i className="fas fa-hand-holding"></i>
            </div>
            <div className="action-content">
              <h6>Nuevo Préstamo</h6>
              <p>Registrar préstamo de instrumento</p>
            </div>
          </div>

          {/* Acción rápida - Ver reportes */}
          <div className="action-card" onClick={() => handleNavigate('reportes')}>
            <div className="action-icon">
              <i className="fas fa-chart-bar"></i>
            </div>
            <div className="action-content">
              <h6>Ver Reportes</h6>
              <p>Consultar estadísticas y reportes</p>
            </div>
          </div>

          {/* Acción rápida - Nueva asignación */}
          <div className="action-card" onClick={() => handleNavigate('asignaciones')}>
            <div className="action-icon">
              <i className="fas fa-users-cog"></i>
            </div>
            <div className="action-content">
              <h6>Nueva Asignación</h6>
              <p>Asignar profesor a estudiante</p>
            </div>
          </div>

          {/* Acción rápida - Gestionar tokens */}
          <div className="action-card" onClick={() => handleNavigate('tokens')}>
            <div className="action-icon">
              <i className="fas fa-key"></i>
            </div>
            <div className="action-content">
              <h6>Gestionar Tokens</h6>
              <p>Crear tokens de registro</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos CSS embebidos para el dashboard */}
      <style jsx>{`
        /* ========================================
           DASHBOARD STATS GRID - CONSISTENTE
        ======================================== */
        .dashboard-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .stat-card {
          background: white;
          border: 2px solid rgba(92, 107, 192, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--azul-marino), var(--azul-claro));
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          border-color: var(--azul-accent);
          background: var(--azul-card-hover);
          transform: translateY(-2px);
          box-shadow: var(--sombra-hover);
        }

        .stat-card:hover::before {
          transform: scaleX(1);
        }

        .stat-card.clickeable:active {
          transform: translateY(0);
          box-shadow: var(--sombra-suave);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Colores específicos para cada tipo de estadística */
        .stat-card.estudiantes .stat-icon { background: linear-gradient(45deg, #007bff, #0056b3); }
        .stat-card.profesores .stat-icon { background: linear-gradient(45deg, #28a745, #1e7e34); }
        .stat-card.instrumentos .stat-icon { background: linear-gradient(45deg, #ffc107, #e0a800); }
        .stat-card.eventos .stat-icon { background: linear-gradient(45deg, #17a2b8, #138496); }
        .stat-card.noticias .stat-icon { background: linear-gradient(45deg, #6f42c1, #5a32a3); }
        .stat-card.prestamos .stat-icon { background: linear-gradient(45deg, #fd7e14, #e55a00); }

        .stat-content {
          flex: 1;
        }

        .stat-content h3 {
          margin: 0 0 0.25rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: var(--azul-marino);
          line-height: 1;
        }

        .stat-content p {
          margin: 0 0 0.25rem 0;
          color: #666;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .stat-content small {
          color: var(--azul-accent);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .stat-arrow {
          color: var(--azul-accent);
          font-size: 1.2rem;
          opacity: 0.7;
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-arrow {
          opacity: 1;
          transform: translateX(4px);
        }

        /* ========================================
           DASHBOARD ACTIONS - ESTILO TABLA
        ======================================== */
        .dashboard-actions-header {
          padding: 1.5rem;
          background: linear-gradient(135deg, var(--azul-marino) 0%, var(--azul-claro) 100%);
          color: white;
          border-radius: 16px 16px 0 0;
          margin: 0;
        }

        .dashboard-actions-header h5 {
          margin: 0 0 0.5rem 0;
          font-weight: 700;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dashboard-actions-header small {
          opacity: 0.9;
          font-size: 0.85rem;
        }

        .dashboard-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 0;
          background: white;
          border-radius: 0 0 16px 16px;
        }

        .action-card {
          padding: 1.5rem;
          border-right: 1px solid rgba(92, 107, 192, 0.1);
          border-bottom: 1px solid rgba(92, 107, 192, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .action-card:hover {
          background: var(--azul-card-hover);
          transform: scale(1.02);
          z-index: 2;
          box-shadow: 0 4px 12px rgba(26, 35, 126, 0.15);
        }

        .action-card:nth-child(even) {
          background: rgba(248, 249, 255, 0.5);
        }

        .action-card:nth-child(even):hover {
          background: var(--azul-card-hover);
        }

        .action-icon {
          width: 50px;
          height: 50px;
          background: linear-gradient(45deg, var(--azul-accent), var(--azul-claro));
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(92, 107, 192, 0.3);
        }

        .action-content h6 {
          margin: 0 0 0.25rem 0;
          color: var(--azul-marino);
          font-weight: 600;
          font-size: 0.95rem;
        }

        .action-content p {
          margin: 0;
          color: #666;
          font-size: 0.85rem;
          line-height: 1.3;
        }

        /* ========================================
           LOADING Y ERRORES CONSISTENTES
        ======================================== */
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }

        .loading .spinner-border {
          width: 40px;
          height: 40px;
          margin-bottom: 1rem;
        }

        .loading p {
          color: var(--azul-accent);
          font-weight: 600;
          margin: 0;
        }

        .alert {
          padding: 1rem 1.5rem;
          border-radius: 12px;
          border: none;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .alert-success {
          background: linear-gradient(45deg, #d4edda, #c3e6cb);
          color: #155724;
          border-left: 4px solid #28a745;
        }

        .alert-danger {
          background: linear-gradient(45deg, #f8d7da, #f5c6cb);
          color: #721c24;
          border-left: 4px solid #dc3545;
        }

        .alert h5 {
          margin: 0 0 0.5rem 0;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .alert p {
          margin: 0 0 1rem 0;
        }

        .alert .btn {
          margin-top: 0.5rem;
        }

        /* ========================================
           RESPONSIVE
        ======================================== */
        @media (max-width: 768px) {
          .dashboard-stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .dashboard-actions-grid {
            grid-template-columns: 1fr;
          }

          .stat-card,
          .action-card {
            padding: 1rem;
          }

          .stat-content h3 {
            font-size: 1.5rem;
          }

          .stat-icon {
            width: 50px;
            height: 50px;
            font-size: 1.2rem;
          }

          .action-icon {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .admin-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .header-actions {
            justify-content: space-between;
          }

          .stat-card {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
          }

          .stat-arrow {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;