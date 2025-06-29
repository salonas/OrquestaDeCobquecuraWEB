import React, { useEffect, useState } from 'react';

const Asistencia = () => {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAsistencias();
  }, []);

  const fetchAsistencias = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profesor/asistencias', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAsistencias(data);
      } else {
        setError('Error al cargar asistencias');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const marcarAsistencia = async (idClase, presente) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/profesor/asistencias/${idClase}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ presente })
      });

      if (response.ok) {
        await fetchAsistencias();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="loading">Cargando asistencias...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="profesor-section">
      <div className="profesor-header">
        <h2>Control de Asistencia</h2>
      </div>

      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estudiante</th>
              <th>Materia</th>
              <th>Asistencia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asistencias.map(asistencia => (
              <tr key={asistencia.id_asistencia}>
                <td>{new Date(asistencia.fecha).toLocaleDateString()}</td>
                <td>{asistencia.estudiante_nombre}</td>
                <td>{asistencia.materia}</td>
                <td>
                  <span className={`estado ${asistencia.presente ? 'presente' : 'ausente'}`}>
                    {asistencia.presente ? 'Presente' : 'Ausente'}
                  </span>
                </td>
                <td className="acciones">
                  <button 
                    onClick={() => marcarAsistencia(asistencia.id_clase, true)}
                    className="btn btn-success btn-sm"
                  >
                    Presente
                  </button>
                  <button 
                    onClick={() => marcarAsistencia(asistencia.id_clase, false)}
                    className="btn btn-danger btn-sm"
                  >
                    Ausente
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Asistencia;