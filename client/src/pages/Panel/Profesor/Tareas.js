import React, { useEffect, useState } from 'react';

const Tareas = () => {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profesor/tareas', {
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

  if (loading) return <div className="loading">Cargando tareas...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="profesor-section">
      <div className="profesor-header">
        <h2>Gestión de Tareas</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          Nueva Tarea
        </button>
      </div>

      <div className="tareas-container">
        {tareas.map(tarea => (
          <div key={tarea.id_tarea} className={`tarea-card ${tarea.estado}`}>
            <div className="tarea-header">
              <h3>{tarea.titulo}</h3>
              <span className={`estado ${tarea.estado}`}>
                {tarea.estado}
              </span>
            </div>
            <div className="tarea-content">
              <p>{tarea.descripcion}</p>
              <div className="tarea-meta">
                <p><strong>Estudiante:</strong> {tarea.estudiante_nombre}</p>
                <p><strong>Fecha límite:</strong> {new Date(tarea.fecha_limite).toLocaleDateString()}</p>
                <p><strong>Fecha creación:</strong> {new Date(tarea.fecha_creacion).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="tarea-acciones">
              <button className="btn btn-warning btn-sm">Editar</button>
              <button className="btn btn-danger btn-sm">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tareas;