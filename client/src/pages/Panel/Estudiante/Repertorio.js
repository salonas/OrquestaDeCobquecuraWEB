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
      const response = await fetch('http://localhost:5000/api/estudiante/repertorio', {
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
    <div className="estudiante-section">
      <div className="estudiante-header">
        <h2>Mi Repertorio</h2>
        <div className="stats">
          Total de piezas: {repertorio.length}
        </div>
      </div>

      {repertorio.length === 0 ? (
        <div>No tienes piezas asignadas en tu repertorio.</div>
      ) : (
        <div className="repertorio-grid">
          {repertorio.map(pieza => (
            <div key={pieza.id_pieza} className="repertorio-card">
              <div className="repertorio-header">
                <h3 className="repertorio-titulo">{pieza.titulo}</h3>
                <span className={`badge ${
                  pieza.estado === 'activo' ? 'badge-success' :
                  pieza.estado === 'pendiente' ? 'badge-warning' : 'badge-danger'
                }`}>
                  {pieza.estado}
                </span>
              </div>
              <div className="repertorio-content">
                <div className="repertorio-info">
                  <div className="info-row">
                    <span className="label">Compositor:</span>
                    <span className="value">{pieza.compositor || 'Desconocido'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Género:</span>
                    <span className="value">{pieza.genero || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Nivel:</span>
                    <span className="value">{pieza.nivel || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Duración:</span>
                    <span className="value">{pieza.duracion ? `${pieza.duracion} min` : 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Instrumento:</span>
                    <span className="instrumento-tag">{pieza.instrumento}</span>
                  </div>
                </div>
                {pieza.notas && (
                  <div className="repertorio-notas">
                    <h4>Notas</h4>
                    <p>{pieza.notas}</p>
                  </div>
                )}
                <div className="repertorio-actions">
                  {pieza.partitura_url && (
                    <a
                      href={pieza.partitura_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <i className="fas fa-file-pdf"></i> Ver Partitura
                    </a>
                  )}
                  {pieza.audio_referencia_url && (
                    <a
                      href={pieza.audio_referencia_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <i className="fas fa-headphones"></i> Escuchar Referencia
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Repertorio;