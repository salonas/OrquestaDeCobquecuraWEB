import React, { useEffect, useState } from 'react';

const Progreso = () => {
  const [progreso, setProgreso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgreso();
  }, []);

  const fetchProgreso = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/estudiante/progreso', {
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

  if (!progreso) return <div>No hay datos de progreso disponibles</div>;

  return (
    <div className="estudiante-section">
      <div className="estudiante-header">
        <h2>Mi Progreso</h2>
      </div>

      <div className="progreso-container">
        <div className="progreso-card">
          <h3>Promedio General</h3>
          <div className="promedio-numero">{progreso.promedioGeneral || 0}</div>
          <div className="progreso-barra">
            <div 
              className="progreso-fill" 
              style={{ width: `${(progreso.promedioGeneral / 7) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="materias-progreso">
          <h3>Progreso por Materia</h3>
          {progreso.materias && progreso.materias.map(materia => (
            <div key={materia.id} className="materia-item">
              <div className="materia-info">
                <span className="materia-nombre">{materia.nombre}</span>
                <span className="materia-promedio">{materia.promedio}</span>
              </div>
              <div className="progreso-barra">
                <div 
                  className="progreso-fill" 
                  style={{ width: `${(materia.promedio / 7) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Progreso;