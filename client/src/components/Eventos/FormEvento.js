import React, { useState, useEffect } from 'react';

// Formulario para crear y editar eventos
const FormEvento = ({ evento, onGuardar, onCancelar }) => {
    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        fecha: '',
        lugar: '',
        visible: true
    });

    // Llenar formulario si se está editando un evento
    useEffect(() => {
        if (evento) {
            setFormData({
                nombre: evento.nombre || '',
                descripcion: evento.descripcion || '',
                fecha: evento.fecha ? 
                    new Date(evento.fecha).toISOString().split('T')[0] : '',
                lugar: evento.lugar || '',
                visible: evento.visible !== undefined ? evento.visible : true
            });
        }
    }, [evento]);

    // Manejar cambios en los campos
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Enviar formulario
    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="form-evento">
            <div className="form-header">
                <h3>{evento ? 'Editar Evento' : 'Nuevo Evento'}</h3>
                <button type="button" onClick={onCancelar} className="btn-close">
                    ×
                </button>
            </div>

            <div className="form-group">
                <label htmlFor="nombre">Nombre del Evento *</label>
                <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    maxLength="200"
                />
            </div>

            <div className="form-group">
                <label htmlFor="fecha">Fecha *</label>
                <input
                    type="date"
                    id="fecha"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="lugar">Lugar *</label>
                <input
                    type="text"
                    id="lugar"
                    name="lugar"
                    value={formData.lugar}
                    onChange={handleChange}
                    required
                    maxLength="200"
                />
            </div>

            <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows="4"
                />
            </div>

            <div className="form-group checkbox-group">
                <label>
                    <input
                        type="checkbox"
                        name="visible"
                        checked={formData.visible}
                        onChange={handleChange}
                    />
                    Visible al público
                </label>
            </div>

            <div className="form-actions">
                <button type="button" onClick={onCancelar} className="btn btn-secondary">
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                    {evento ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </form>
    );
};

export default FormEvento;