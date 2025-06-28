import React, { useEffect, useState } from 'react';

const Tareas = () => {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/estudiante/tareas', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTareas(data);
      } else {
        setError('Error al cargar tareas');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const marcarCompleta = async (idTarea) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/estudiante/tareas/${idTarea}/completar`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchTareas();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="loading">Cargando tareas...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="estudiante-section">
      <div className="estudiante-header">
        <h2>Mis Tareas</h2>
        <div className="stats">
          Total: {tareas.length} | 
          Pendientes: {tareas.filter(t => t.estado === 'pendiente').length}
        </div>
      </div>

      <div className="tareas-container">
        {tareas.map(tarea => (
          <div key={tarea.id} className={`tarea-card ${tarea.estado}`}>
            <div className="tarea-header">
              <h3>{tarea.titulo}</h3>
              <span className={`estado ${tarea.estado}`}>
                {tarea.estado}
              </span>
            </div>
            <div className="tarea-content">
              <p>{tarea.descripcion}</p>
              <div className="tarea-meta">
                <p><strong>Fecha límite:</strong> {new Date(tarea.fecha_limite).toLocaleDateString()}</p>
                <p><strong>Profesor:</strong> {tarea.profesor_nombre}</p>
              </div>
            </div>
            {tarea.estado === 'pendiente' && (
              <div className="tarea-acciones">
                <button 
                  onClick={() => marcarCompleta(tarea.id_tarea)}
                  className="btn btn-success"
                >
                  Marcar como completada
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tareas;