import React, { useEffect, useState } from 'react';

const Progreso = () => {
  const [progreso, setProgreso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgreso();
  }, []);

  const fetchProgreso = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profesor/progreso', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProgreso(data);
      } else {
        setError('Error al cargar progreso');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando progreso...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="profesor-section">
      <div className="profesor-header">
        <h2>Progreso de Estudiantes</h2>
      </div>

      <div className="progreso-container">
        {progreso.map(estudiante => (
          <div key={estudiante.rut} className="estudiante-progreso-card">
            <div className="estudiante-header">
              <h3>{estudiante.nombre} {estudiante.apellido}</h3>
              <div className="promedio-general">{estudiante.promedio_general}</div>
            </div>
            <div className="progreso-barra">
              <div 
                className="progreso-fill" 
                style={{ width: `${(estudiante.promedio_general / 7) * 100}%` }}
              ></div>
            </div>
            <div className="materias-detalle">
              {estudiante.materias && estudiante.materias.map(materia => (
                <div key={materia.id} className="materia-item">
                  <span className="materia-nombre">{materia.nombre}</span>
                  <span className="materia-promedio">{materia.promedio}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Progreso;