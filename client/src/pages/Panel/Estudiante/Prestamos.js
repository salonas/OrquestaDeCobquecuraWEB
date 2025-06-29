import React, { useEffect, useState } from 'react';

const Prestamos = () => {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrestamos();
  }, []);

  const fetchPrestamos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/estudiante/prestamos', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPrestamos(data);
      } else {
        setError('Error al cargar préstamos');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando préstamos...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="estudiante-section">
      <div className="estudiante-header">
        <h2>Mis Préstamos</h2>
        <div className="stats">
          Total: {prestamos.length} | 
          Activos: {prestamos.filter(p => p.estado === 'activo').length}
        </div>
      </div>

      <div className="tabla-container">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>Instrumento</th>
              <th>Fecha Préstamo</th>
              <th>Fecha Devolución</th>
              <th>Estado</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {prestamos.map(prestamo => (
              <tr key={prestamo.id_prestamo}> // Este está correcto según el controlador
                <td>{prestamo.instrumento_nombre}</td>
                <td>{new Date(prestamo.fecha_prestamo).toLocaleDateString()}</td>
                <td>
                  {prestamo.fecha_devolucion 
                    ? new Date(prestamo.fecha_devolucion).toLocaleDateString()
                    : 'Pendiente'
                  }
                </td>
                <td>
                  <span className={`estado ${prestamo.estado}`}>
                    {prestamo.estado}
                  </span>
                </td>
                <td>{prestamo.observaciones || 'Sin observaciones'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Prestamos;