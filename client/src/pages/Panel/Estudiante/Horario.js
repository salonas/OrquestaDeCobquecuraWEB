import React, { useEffect, useState } from 'react';

const Horario = () => {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHorarios();
  }, []);

  const fetchHorarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/estudiante/horarios', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHorarios(data);
      } else {
        setError('Error al cargar horarios');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando horarios...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="estudiante-section">
      <div className="estudiante-header">
        <h2>Mi Horario</h2>
      </div>

      <div className="horario-grid">
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(dia => (
          <div key={dia} className="dia-columna">
            <h3>{dia}</h3>
            {horarios
              .filter(h => h.dia === dia.toLowerCase())
              .map(horario => (
                <div key={horario.id} className="horario-item">
                  <div className="hora">{horario.hora_inicio} - {horario.hora_fin}</div>
                  <div className="materia">{horario.materia}</div>
                  <div className="profesor">{horario.profesor_nombre}</div>
                </div>
              ))
            }
          </div>
        ))}
      </div>
    </div>
  );
};

export default Horario;