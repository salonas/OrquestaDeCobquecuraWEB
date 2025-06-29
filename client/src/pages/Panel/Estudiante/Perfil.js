import React, { useEffect, useState } from 'react';
import { useAlert } from '../../../components/providers/AlertProvider';

const Perfil = () => {
  const { showSuccess, showError } = useAlert();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    telefono: ''
  });

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/estudiante/perfil', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPerfil(data);
        setFormData({
          email: data.email || '',
          telefono: data.telefono || ''
        });
        setError(null);
      } else {
        setError('Error al cargar perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/estudiante/perfil', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchPerfil(); // Recargar datos
        setEditando(false);
        showSuccess('Éxito', 'Perfil actualizado exitosamente');
      } else {
        showError('Error', 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de Conexión', 'Error de conexión');
    }
  };

  const cancelarEdicion = () => {
    setFormData({
      email: perfil.email || '',
      telefono: perfil.telefono || ''
    });
    setEditando(false);
  };

  if (loading) {
    return <div className="loading">Cargando perfil...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!perfil) {
    return <div>No se encontró información del perfil</div>;
  }

  return (
    <div className="estudiante-section">
      <div className="estudiante-header">
        <h2>Mi Perfil</h2>
        <div className="stats">
          Información personal y académica
        </div>
      </div>

      <div className="perfil-container">
        {/* Información Personal */}
        <div className="perfil-card">
          <div className="perfil-header">
            <h3>Información Personal</h3>
            {!editando ? (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setEditando(true)}
              >
                Editar
              </button>
            ) : (
              <div className="btn-group">
                <button 
                  className="btn btn-success btn-sm"
                  onClick={handleSubmit}
                >
                  Guardar
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={cancelarEdicion}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <div className="perfil-content">
            <div className="info-grid">
              <div className="info-item">
                <label>RUT:</label>
                <span>{perfil.rut}</span>
              </div>

              <div className="info-item">
                <label>Nombres:</label>
                <span>{perfil.nombres}</span>
              </div>

              <div className="info-item">
                <label>Apellidos:</label>
                <span>{perfil.apellidos}</span>
              </div>

              <div className="info-item">
                <label>Email:</label>
                {editando ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                ) : (
                  <span>{perfil.email || 'No registrado'}</span>
                )}
              </div>

              <div className="info-item">
                <label>Teléfono:</label>
                {editando ? (
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                ) : (
                  <span>{perfil.telefono || 'No registrado'}</span>
                )}
              </div>

              <div className="info-item">
                <label>Fecha de Nacimiento:</label>
                <span>
                  {perfil.fecha_nacimiento 
                    ? new Date(perfil.fecha_nacimiento).toLocaleDateString() 
                    : 'No registrada'
                  }
                </span>
              </div>

              <div className="info-item">
                <label>Fecha de Ingreso:</label>
                <span>
                  {perfil.fecha_ingreso 
                    ? new Date(perfil.fecha_ingreso).toLocaleDateString() 
                    : 'No registrada'
                  }
                </span>
              </div>

              <div className="info-item">
                <label>Estado:</label>
                <span className={`estado ${perfil.estado}`}>
                  {perfil.estado}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información Académica */}
        <div className="perfil-card">
          <div className="perfil-header">
            <h3>Información Académica</h3>
          </div>

          <div className="perfil-content">
            <div className="info-grid">
              <div className="info-item">
                <label>Instrumento Principal:</label>
                <span className="instrumento-principal">
                  {perfil.instrumento || 'No asignado'}
                </span>
              </div>

              <div className="info-item">
                <label>Profesor Asignado:</label>
                <span>{perfil.profesor_nombre || 'No asignado'}</span>
              </div>

              {perfil.notas_adicionales && (
                <div className="info-item full-width">
                  <label>Notas Adicionales:</label>
                  <div className="notas-adicionales">
                    {perfil.notas_adicionales}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;