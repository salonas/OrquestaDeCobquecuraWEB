import React, { useEffect, useState } from 'react';

const Evaluaciones = () => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvaluaciones();
  }, []);

  const fetchEvaluaciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/estudiante/evaluaciones', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluaciones(data);
      } else {
        setError('Error al cargar evaluaciones');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando evaluaciones...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="estudiante-section">
      <div className="estudiante-header">
        <h2>Mis Evaluaciones</h2>
      </div>

      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Calificación</th>
              <th>Comentarios</th>
              <th>Profesor</th>
            </tr>
          </thead>
          <tbody>
            {evaluaciones.map(evaluacion => (
              <tr key={evaluacion.id}>
                <td>{new Date(evaluacion.fecha).toLocaleDateString()}</td>
                <td>{evaluacion.tipo}</td>
                <td>
                  <span className={`calificacion ${evaluacion.calificacion >= 4 ? 'aprobado' : 'reprobado'}`}>
                    {evaluacion.calificacion}
                  </span>
                </td>
                <td>{evaluacion.comentarios || 'Sin comentarios'}</td>
                <td>{evaluacion.profesor_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Evaluaciones;