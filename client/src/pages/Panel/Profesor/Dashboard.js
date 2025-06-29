import React, { useEffect, useState } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profesor/dashboard', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando dashboard...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!stats) {
    return <div>No hay datos disponibles</div>;
  }

  return (
    <div className="profesor-section">
      <div className="profesor-header">
        <h2>Dashboard del Profesor</h2>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Estudiantes Asignados</h3>
          <div className="stat-number">{stats.estudiantesAsignados || 0}</div>
        </div>

        <div className="dashboard-card">
          <h3>Clases Pendientes</h3>
          <div className="stat-number">{stats.clasesPendientes || 0}</div>
        </div>

        <div className="dashboard-card">
          <h3>Evaluaciones Por Revisar</h3>
          <div className="stat-number">{stats.evaluacionesPendientes || 0}</div>
        </div>

        <div className="dashboard-card">
          <h3>Tareas Asignadas</h3>
          <div className="stat-number">{stats.tareasAsignadas || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;