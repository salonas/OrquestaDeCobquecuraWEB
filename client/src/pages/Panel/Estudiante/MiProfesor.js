import React, { useEffect, useState } from 'react';

const MiProfesor = () => {
  const [profesor, setProfesor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfesor();
  }, []);

  const fetchProfesor = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/estudiante/mi-profesor', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfesor(data);
      } else {
        setError('Error al cargar información del profesor');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando información del profesor...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  if (!profesor) return <div>No tienes profesor asignado</div>;

  return (
    <div className="estudiante-section">
      <div className="estudiante-header">
        <h2>Mi Profesor</h2>
      </div>

      <div className="profesor-card">
        <div className="profesor-info">
          <h3>{profesor.nombres} {profesor.apellidos}</h3>
          <div className="profesor-detalles">
            <p><strong>Especialidad:</strong> {profesor.especialidad}</p>
            <p><strong>Email:</strong> {profesor.email}</p>
            <p><strong>Experiencia:</strong> {profesor.anos_experiencia} años</p>
            <p><strong>Estado:</strong> 
              <span className={`estado ${profesor.estado}`}>
                {profesor.estado}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiProfesor;