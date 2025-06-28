import React, { useEffect, useState } from 'react';

const Repertorio = () => {
  const [repertorio, setRepertorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRepertorio();
  }, []);

  const fetchRepertorio = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profesor/repertorio', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRepertorio(data);
      } else {
        setError('Error al cargar repertorio');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando repertorio...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="profesor-section">
      <div className="profesor-header">
        <h2>Repertorio</h2>
        <div className="stats">
          Total piezas: {repertorio.length}
        </div>
      </div>

      <div className="repertorio-grid">
        {repertorio.map(pieza => (
          <div key={pieza.id_pieza} className="pieza-card">
            <div className="pieza-header">
              <h3>{pieza.titulo}</h3>
              <span className={`nivel ${pieza.nivel}`}>{pieza.nivel}</span>
            </div>
            <div className="pieza-info">
              <p><strong>Compositor:</strong> {pieza.compositor}</p>
              <p><strong>Duración:</strong> {pieza.duracion} min</p>
              <p><strong>Género:</strong> {pieza.genero}</p>
              <p><strong>Dificultad:</strong> {pieza.dificultad}</p>
            </div>
            <div className="pieza-acciones">
              <button className="btn btn-primary btn-sm">Ver Detalles</button>
              <button className="btn btn-success btn-sm">Asignar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Repertorio;