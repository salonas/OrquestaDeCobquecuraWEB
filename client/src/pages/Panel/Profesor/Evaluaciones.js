import React, { useEffect, useState } from 'react';

const Evaluaciones = () => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    fetchEvaluaciones();
  }, []);

  const fetchEvaluaciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profesor/evaluaciones', {
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
    <div className="profesor-section">
      <div className="profesor-header">
        <h2>Evaluaciones</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          Nueva Evaluación
        </button>
      </div>

      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estudiante</th>
              <th>Tipo</th>
              <th>Calificación</th>
              <th>Comentarios</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {evaluaciones.map(evaluacion => (
              <tr key={evaluacion.id_evaluacion}>
                <td>{new Date(evaluacion.fecha).toLocaleDateString()}</td>
                <td>{evaluacion.estudiante_nombre}</td>
                <td>{evaluacion.tipo}</td>
                <td>
                  <span className={`calificacion ${evaluacion.calificacion >= 4 ? 'aprobado' : 'reprobado'}`}>
                    {evaluacion.calificacion}
                  </span>
                </td>
                <td>{evaluacion.comentarios}</td>
                <td className="acciones">
                  <button className="btn btn-warning btn-sm">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Evaluaciones;