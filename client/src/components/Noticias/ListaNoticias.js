import React from 'react';

// Componente para mostrar la lista de noticias en una tabla
const ListaNoticias = ({ noticias, onEditar, onEliminar, onToggleVisibilidad }) => {
    // Formatear fechas al formato chileno
    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-CL');
    };

    // Truncar texto largo para la vista previa
    const truncarTexto = (texto, maxLength = 100) => {
        if (texto.length <= maxLength) return texto;
        return texto.substring(0, maxLength) + '...';
    };

    return (
        <div className="tabla-container">
            <table className="tabla-datos">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Fecha</th>
                        <th>Contenido</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {noticias.length > 0 ? (
                        noticias.map((noticia) => (
                            <tr key={noticia.id_noticia}>
                                <td className="titulo-noticia">
                                    {noticia.titulo}
                                </td>
                                <td>
                                    {formatearFecha(noticia.fecha_publicacion)}
                                </td>
                                <td className="contenido-preview">
                                    {truncarTexto(noticia.contenido)}
                                </td>
                                <td>
                                    <span className={`estado ${noticia.visible ? 'visible' : 'oculto'}`}>
                                        {noticia.visible ? 'Visible' : 'Oculto'}
                                    </span>
                                </td>
                                <td className="acciones">
                                    <button
                                        onClick={() => onEditar(noticia)}
                                        className="btn btn-sm btn-outline"
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => onToggleVisibilidad(noticia.id_noticia)}
                                        className="btn btn-sm btn-outline"
                                        title="Cambiar visibilidad"
                                    >
                                        {noticia.visible ? '👁️' : '🙈'}
                                    </button>
                                    <button
                                        onClick={() => onEliminar(noticia.id_noticia)}
                                        className="btn btn-sm btn-danger"
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center">
                                No hay noticias registradas
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ListaNoticias;