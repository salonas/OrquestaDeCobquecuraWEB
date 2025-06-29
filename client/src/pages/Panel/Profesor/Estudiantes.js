import React, { useEffect, useState } from 'react';

const Estudiantes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEstudiantes();
  }, []);

  const fetchEstudiantes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profesor/estudiantes', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEstudiantes(data);
      } else {
        setError('Error al cargar estudiantes');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando estudiantes...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="profesor-section">
      <div className="profesor-header">
        <h2>Mis Estudiantes</h2>
        <div className="stats">
          Total: {estudiantes.length}
        </div>
      </div>

      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>RUT</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Fecha Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map(estudiante => (
              <tr key={estudiante.rut}>
                <td>{estudiante.rut}</td>
                <td>{estudiante.nombres} {estudiante.apellidos}</td>
                <td>{estudiante.email}</td>
                <td>{estudiante.telefono}</td>
                <td>
                  <span className={`estado ${estudiante.estado}`}>
                    {estudiante.estado}
                  </span>
                </td>
                <td>{new Date(estudiante.fecha_ingreso).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Estudiantes;