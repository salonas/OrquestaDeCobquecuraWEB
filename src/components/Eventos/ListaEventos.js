import React from 'react';

// Componente para mostrar la lista de eventos en una tabla
const ListaEventos = ({ eventos, onEditar, onEliminar, onToggleVisibilidad }) => {
    // Formatear fechas al formato chileno
    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-CL');
    };

    // Truncar texto largo para la vista previa
    const truncarTexto = (texto, maxLength = 100) => {
        if (!texto) return 'Sin descripción';
        if (texto.length <= maxLength) return texto;
        return texto.substring(0, maxLength) + '...';
    };

    // Verificar si un evento ya pasó
    const esEventoPasado = (fecha) => {
        return new Date(fecha) < new Date();
    };

    return (
        <div className="tabla-container">
            <table className="tabla-datos">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Fecha</th>
                        <th>Lugar</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {eventos.length > 0 ? (
                        eventos.map((evento) => (
                            <tr key={evento.id_evento} className={esEventoPasado(evento.fecha) ? 'evento-pasado' : ''}>
                                <td className="nombre-evento">
                                    {evento.nombre}
                                </td>
                                <td>
                                    {formatearFecha(evento.fecha)}
                                    {esEventoPasado(evento.fecha) && (
                                        <span className="badge-pasado">Pasado</span>
                                    )}
                                </td>
                                <td>
                                    {evento.lugar}
                                </td>
                                <td className="descripcion-preview">
                                    {truncarTexto(evento.descripcion)}
                                </td>
                                <td>
                                    <span className={`estado ${evento.visible ? 'visible' : 'oculto'}`}>
                                        {evento.visible ? 'Visible' : 'Oculto'}
                                    </span>
                                </td>
                                <td className="acciones">
                                    <button
                                        onClick={() => onEditar(evento)}
                                        className="btn btn-sm btn-outline"
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => onToggleVisibilidad(evento.id_evento)}
                                        className="btn btn-sm btn-outline"
                                        title="Cambiar visibilidad"
                                    >
                                        {evento.visible ? '👁️' : '🙈'}
                                    </button>
                                    <button
                                        onClick={() => onEliminar(evento.id_evento)}
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
                            <td colSpan="6" className="text-center">
                                No hay eventos registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ListaEventos;