import React, { useEffect, useState } from 'react';

const Clases = () => {
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClases();
  }, []);

  const fetchClases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profesor/clases', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClases(data);
      } else {
        setError('Error al cargar clases');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando clases...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="profesor-section">
      <div className="profesor-header">
        <h2>Mis Clases</h2>
        <div className="stats">
          Total: {clases.length}
        </div>
      </div>

      <div className="clases-grid">
        {clases.map(clase => (
          <div key={clase.id_clase} className="clase-card">
            <div className="clase-header">
              <h3>{clase.materia}</h3>
              <span className={`estado ${clase.estado}`}>
                {clase.estado}
              </span>
            </div>
            <div className="clase-info">
              <p><strong>Estudiante:</strong> {clase.estudiante_nombre}</p>
              <p><strong>Fecha:</strong> {new Date(clase.fecha).toLocaleDateString()}</p>
              <p><strong>Hora:</strong> {clase.hora_inicio} - {clase.hora_fin}</p>
              <p><strong>Aula:</strong> {clase.aula}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Clases;