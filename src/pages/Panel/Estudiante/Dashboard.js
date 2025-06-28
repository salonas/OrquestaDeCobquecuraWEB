import React, { useEffect, useState } from 'react';
import { useUser } from '../../../context/UserContext';

const Dashboard = () => {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      // CORREGIR: Cambiar la URL para que coincida con el backend
      const response = await fetch('http://localhost:5000/api/estudiante/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        setError('Error al cargar el dashboard');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (hora) => {
    return hora.substring(0, 5); // HH:MM
  };

  if (loading) return <div className="loading">Cargando dashboard...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  if (!dashboardData) return <div>No hay datos disponibles</div>;

  const { stats, proximasClases, tareasPendientes, ultimasEvaluaciones } = dashboardData;

  return (
    <div className="estudiante-section">
      <div className="estudiante-header">
        <h2>¡Hola, {user?.nombres}! 👋</h2>
        <div className="stats">
          Bienvenido/a a tu panel de control musical
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="dashboard-grid">
        <div className="dashboard-card tareas">
          <div className="card-icon">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="card-content">
            <h3>Tareas Pendientes</h3>
            <div className="stat-number">{stats.tareas_pendientes || 0}</div>
            <small>Por completar</small>
          </div>
        </div>

        <div className="dashboard-card clases">
          <div className="card-icon">
            <i className="fas fa-calendar-week"></i>
          </div>
          <div className="card-content">
            <h3>Clases Esta Semana</h3>
            <div className="stat-number">{stats.clases_semana || 0}</div>
            <small>Programadas</small>
          </div>
        </div>

        <div className="dashboard-card evaluaciones">
          <div className="card-icon">
            <i className="fas fa-star"></i>
          </div>
          <div className="card-content">
            <h3>Evaluaciones Este Mes</h3>
            <div className="stat-number">{stats.evaluaciones_mes || 0}</div>
            <small>Realizadas</small>
          </div>
        </div>

        <div className="dashboard-card prestamos">
          <div className="card-icon">
            <i className="fas fa-guitar"></i>
          </div>
          <div className="card-content">
            <h3>Instrumentos en Préstamo</h3>
            <div className="stat-number">{stats.prestamos_activos || 0}</div>
            <small>Activos</small>
          </div>
        </div>
      </div>

      {/* Próximas clases */}
      <div className="dashboard-row">
        <div className="dashboard-widget">
          <div className="widget-header">
            <h3><i className="fas fa-calendar-alt"></i> Próximas Clases</h3>
          </div>
          <div className="widget-content">
            {proximasClases && proximasClases.length > 0 ? (
              proximasClases.map((clase, index) => (
                <div key={index} className="clase-item">
                  <div className="clase-dia">
                    <strong>{clase.dia.charAt(0).toUpperCase() + clase.dia.slice(1)}</strong>
                  </div>
                  <div className="clase-info">
                    <div className="clase-hora">
                      <i className="fas fa-clock"></i>
                      {formatearHora(clase.hora_inicio)} - {formatearHora(clase.hora_fin)}
                    </div>
                    <div className="clase-materia">
                      <i className="fas fa-music"></i>
                      {clase.materia} ({clase.instrumento})
                    </div>
                    <div className="clase-profesor">
                      <i className="fas fa-user"></i>
                      {clase.profesor_nombre}
                    </div>
                    <div className="clase-aula">
                      <i className="fas fa-map-marker-alt"></i>
                      {clase.aula}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <i className="fas fa-calendar-times"></i>
                <p>No tienes clases programadas próximamente</p>
              </div>
            )}
          </div>
        </div>

        {/* Tareas pendientes */}
        <div className="dashboard-widget">
          <div className="widget-header">
            <h3><i className="fas fa-tasks"></i> Tareas Urgentes</h3>
          </div>
          <div className="widget-content">
            {tareasPendientes && tareasPendientes.length > 0 ? (
              tareasPendientes.map((tarea, index) => (
                <div key={index} className="tarea-item-mini">
                  <div className="tarea-titulo">
                    <i className="fas fa-exclamation-circle"></i>
                    {tarea.titulo}
                  </div>
                  <div className="tarea-descripcion">
                    {tarea.descripcion?.substring(0, 80)}...
                  </div>
                  <div className="tarea-fecha">
                    <i className="fas fa-calendar"></i>
                    Vence: {formatearFecha(tarea.fecha_limite)}
                  </div>
                  <div className="tarea-profesor">
                    <i className="fas fa-user"></i>
                    {tarea.profesor_nombre}
                  </div>
                  <span className={`tarea-prioridad ${tarea.prioridad}`}>
                    {tarea.prioridad?.toUpperCase()}
                  </span>
                </div>
              ))
            ) : (
              <div className="no-data">
                <i className="fas fa-check-circle"></i>
                <p>¡Excelente! No tienes tareas pendientes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Últimas evaluaciones */}
      <div className="dashboard-widget full-width">
        <div className="widget-header">
          <h3><i className="fas fa-star"></i> Mis Últimas Evaluaciones</h3>
        </div>
        <div className="widget-content">
          {ultimasEvaluaciones && ultimasEvaluaciones.length > 0 ? (
            <div className="evaluaciones-grid">
              {ultimasEvaluaciones.map((evaluacion, index) => (
                <div key={index} className="evaluacion-card">
                  <div className="evaluacion-header">
                    <span className="evaluacion-tipo">{evaluacion.tipo}</span>
                    <span className={`evaluacion-nota ${evaluacion.calificacion >= 4.0 ? 'aprobado' : 'reprobado'}`}>
                      {evaluacion.calificacion}
                    </span>
                  </div>
                  <div className="evaluacion-titulo">{evaluacion.titulo}</div>
                  <div className="evaluacion-fecha">
                    <i className="fas fa-calendar"></i>
                    {formatearFecha(evaluacion.fecha)}
                  </div>
                  <div className="evaluacion-profesor">
                    <i className="fas fa-user"></i>
                    {evaluacion.profesor_nombre}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">
              <i className="fas fa-star"></i>
              <p>Aún no tienes evaluaciones registradas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;