import React, { useState, useEffect } from 'react';

// Formulario para crear y editar noticias
const FormNoticia = ({ noticia, onGuardar, onCancelar }) => {
    // Estado del formulario
    const [formData, setFormData] = useState({
        titulo: '',
        contenido: '',
        fecha_publicacion: '',
        visible: true
    });

    // Llenar formulario si se está editando una noticia
    useEffect(() => {
        if (noticia) {
            setFormData({
                titulo: noticia.titulo || '',
                contenido: noticia.contenido || '',
                fecha_publicacion: noticia.fecha_publicacion ? 
                    new Date(noticia.fecha_publicacion).toISOString().split('T')[0] : '',
                visible: noticia.visible !== undefined ? noticia.visible : true
            });
        }
    }, [noticia]);

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
        <form onSubmit={handleSubmit} className="form-noticia">
            <div className="form-header">
                <h3>{noticia ? 'Editar Noticia' : 'Nueva Noticia'}</h3>
                <button type="button" onClick={onCancelar} className="btn-close">
                    ×
                </button>
            </div>

            <div className="form-group">
                <label htmlFor="titulo">Título *</label>
                <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    required
                    maxLength="200"
                />
            </div>

            <div className="form-group">
                <label htmlFor="fecha_publicacion">Fecha de Publicación *</label>
                <input
                    type="date"
                    id="fecha_publicacion"
                    name="fecha_publicacion"
                    value={formData.fecha_publicacion}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="contenido">Contenido *</label>
                <textarea
                    id="contenido"
                    name="contenido"
                    value={formData.contenido}
                    onChange={handleChange}
                    required
                    rows="6"
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
                    {noticia ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </form>
    );
};

export default FormNoticia;