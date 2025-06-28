const { execute } = require('../config/database');

const eventosController = {
  // Obtener eventos públicos
  async getPublicos(req, res) {
    try {
      console.log('🔍 Obteniendo eventos públicos...');
      
      const result = await execute(`
        SELECT id_evento, nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, tipo
        FROM eventos 
        WHERE visible = true AND fecha >= CURDATE()
        ORDER BY fecha ASC
        LIMIT 10
      `);
      
      // Manejar estructura de respuesta correctamente
      const eventos = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
      
      console.log('✅ Eventos públicos encontrados:', eventos.length);
      console.log('📊 Eventos encontrados:', eventos);
      
      res.json(eventos);
    } catch (error) {
      console.error('❌ Error al obtener eventos públicos:', error);
      res.status(500).json({ error: 'Error al obtener eventos públicos' });
    }
  },

  // Obtener próximos eventos con límite
  async getProximos(req, res) {
    try {
      const { limit = 5 } = req.query;
      console.log('📅 Obteniendo eventos próximos, límite:', limit);
      
      const result = await execute(`
        SELECT id_evento, nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, tipo
        FROM eventos 
        WHERE fecha >= CURDATE() AND visible = true 
        ORDER BY fecha ASC 
        LIMIT ?
      `, [parseInt(limit)]);
      
      const eventos = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
      
      console.log('✅ Eventos próximos encontrados:', eventos.length);
      res.json(eventos);
    } catch (error) {
      console.error('❌ Error al obtener eventos próximos:', error);
      res.status(500).json({ error: 'Error al obtener eventos próximos' });
    }
  },

  // Obtener eventos destacados
  async getDestacados(req, res) {
    try {
      const { limit = 3 } = req.query;
      console.log('🌟 Obteniendo eventos destacados, límite:', limit);
      
      const result = await execute(`
        SELECT id_evento, nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, tipo
        FROM eventos 
        WHERE visible = true 
        ORDER BY fecha ASC 
        LIMIT ?
      `, [parseInt(limit)]);
      
      const eventos = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
      
      console.log('✅ Eventos destacados encontrados:', eventos.length);
      res.json(eventos);
    } catch (error) {
      console.error('❌ Error al obtener eventos destacados:', error);
      res.status(500).json({ error: 'Error al obtener eventos destacados' });
    }
  },

  // Obtener todos los eventos visibles
  async getEventos(req, res) {
    try {
      console.log('🔄 Obteniendo eventos desde /api/eventos...');
      console.log('📍 Endpoint: GET /api/eventos');
      
      const result = await execute(`
        SELECT * FROM eventos 
        WHERE visible = true 
        ORDER BY fecha DESC
      `);
      
      console.log('🔍 Resultado crudo de la consulta:', result);
      
      // Manejar estructura de respuesta correctamente
      const eventos = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
      
      console.log('📅 Eventos procesados:', eventos.length);
      console.log('📊 Datos de eventos:', eventos);
      res.json(eventos);
    } catch (error) {
      console.error('❌ Error al obtener eventos:', error);
      console.error('❌ Detalles del error:', error.message);
      res.status(500).json({ error: 'Error al obtener eventos' });
    }
  },

  // Obtener evento específico por ID
  async getEvento(req, res) {
    try {
      const { id } = req.params;
      const result = await execute(`
        SELECT * FROM eventos 
        WHERE id_evento = ? AND visible = true
      `, [id]);

      // Manejar estructura de respuesta correctamente
      const eventos = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

      if (eventos.length === 0) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      res.json(eventos[0]);
    } catch (error) {
      console.error('Error al obtener evento:', error);
      res.status(500).json({ error: 'Error al obtener evento' });
    }
  },

  // Crear nuevo evento (solo administradores)
  async crearEvento(req, res) {
    try {
      const { 
        nombre, 
        descripcion, 
        fecha, 
        hora_inicio, 
        hora_fin,
        lugar, 
        tipo, 
        capacidad_maxima
      } = req.body;

      const result = await execute(`
        INSERT INTO eventos (
          nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, 
          tipo, capacidad_maxima, visible
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)
      `, [nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, tipo, capacidad_maxima]);

      const insertId = result.insertId || (result[0] && result[0].insertId);

      res.status(201).json({ 
        mensaje: 'Evento creado correctamente',
        id: insertId 
      });
    } catch (error) {
      console.error('Error al crear evento:', error);
      res.status(500).json({ error: 'Error al crear evento' });
    }
  },

  // Actualizar evento existente
  async actualizarEvento(req, res) {
    try {
      const { id } = req.params;
      const { 
        nombre, 
        descripcion, 
        fecha, 
        hora_inicio, 
        hora_fin,
        lugar, 
        tipo, 
        capacidad_maxima 
      } = req.body;

      await execute(`
        UPDATE eventos 
        SET nombre = ?, descripcion = ?, fecha = ?, hora_inicio = ?, hora_fin = ?, lugar = ?, 
            tipo = ?, capacidad_maxima = ?
        WHERE id_evento = ?
      `, [nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, tipo, capacidad_maxima, id]);

      res.json({ mensaje: 'Evento actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      res.status(500).json({ error: 'Error al actualizar evento' });
    }
  },

  // Eliminar evento
  async eliminarEvento(req, res) {
    try {
      const { id } = req.params;
      await execute('DELETE FROM eventos WHERE id_evento = ?', [id]);
      res.json({ mensaje: 'Evento eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      res.status(500).json({ error: 'Error al eliminar evento' });
    }
  },

  // Cambiar visibilidad de evento
  async cambiarVisibilidad(req, res) {
    try {
      const { id } = req.params;
      const { visible } = req.body;

      await execute('UPDATE eventos SET visible = ? WHERE id_evento = ?', [visible, id]);
      res.json({ mensaje: 'Visibilidad del evento actualizada correctamente' });
    } catch (error) {
      console.error('Error al cambiar visibilidad del evento:', error);
      res.status(500).json({ error: 'Error al cambiar visibilidad del evento' });
    }
  },

  // Obtener eventos filtrados por tipo
  async getEventosPorTipo(req, res) {
    try {
      const { tipo } = req.params;
      const result = await execute(`
        SELECT * FROM eventos 
        WHERE tipo = ? AND visible = true 
        ORDER BY fecha ASC
      `, [tipo]);

      // Manejar estructura de respuesta correctamente
      const eventos = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

      res.json(eventos);
    } catch (error) {
      console.error('Error al obtener eventos por tipo:', error);
      res.status(500).json({ error: 'Error al obtener eventos por tipo' });
    }
  },

  // Obtener eventos próximos (versión legacy)
  async getEventosProximos(req, res) {
    try {
      const result = await execute(`
        SELECT * FROM eventos 
        WHERE fecha >= CURDATE() AND visible = true 
        ORDER BY fecha ASC 
        LIMIT 5
      `);

      // Manejar estructura de respuesta correctamente
      const eventos = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

      res.json(eventos);
    } catch (error) {
      console.error('Error al obtener eventos próximos:', error);
      res.status(500).json({ error: 'Error al obtener eventos próximos' });
    }
  },

  // Buscar eventos por término
  async buscarEventos(req, res) {
    try {
      const { q } = req.query;
      const searchTerm = `%${q}%`;

      const result = await execute(`
        SELECT * FROM eventos 
        WHERE (nombre LIKE ? OR descripcion LIKE ?) AND visible = true 
        ORDER BY fecha ASC
      `, [searchTerm, searchTerm]);

      // Manejar estructura de respuesta correctamente
      const eventos = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

      res.json(eventos);
    } catch (error) {
      console.error('Error al buscar eventos:', error);
      res.status(500).json({ error: 'Error al buscar eventos' });
    }
  },

  // Obtener todos los eventos (administrador)
  async getAllEventos(req, res) {
    try {
      const result = await execute(`
        SELECT * FROM eventos 
        ORDER BY fecha_creacion DESC
      `);
      
      // Manejar estructura de respuesta correctamente
      const eventos = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
      
      res.json(eventos);
    } catch (error) {
      console.error('Error al obtener todos los eventos:', error);
      res.status(500).json({ error: 'Error al obtener todos los eventos' });
    }
  },

  // Obtener estadísticas de eventos
  async getEstadisticasEventos(req, res) {
    try {
      const result = await execute(`
        SELECT 
          COUNT(*) as total_eventos,
          COUNT(CASE WHEN fecha >= CURDATE() THEN 1 END) as eventos_proximos,
          COUNT(CASE WHEN fecha < CURDATE() THEN 1 END) as eventos_pasados,
          COUNT(CASE WHEN tipo = 'concierto' THEN 1 END) as conciertos,
          COUNT(CASE WHEN tipo = 'ensayo' THEN 1 END) as ensayos,
          COUNT(CASE WHEN tipo = 'masterclass' THEN 1 END) as masterclasses
        FROM eventos 
        WHERE visible = true
      `);

      // Manejar estructura de respuesta correctamente
      const stats = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

      res.json(stats[0]);
    } catch (error) {
      console.error('Error al obtener estadísticas de eventos:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas de eventos' });
    }
  },

  // MÉTODO TEMPORAL PARA CREAR EVENTOS DE EJEMPLO
  async crearEventosEjemplo(req, res) {
    try {
      console.log('🎭 Creando eventos de ejemplo...');
      
      const eventosEjemplo = [
        {
          nombre: 'Concierto de Primavera',
          descripcion: 'Concierto especial de la Orquesta Juvenil para celebrar la llegada de la primavera',
          fecha: '2025-09-21',
          hora_inicio: '19:00:00',
          hora_fin: '21:00:00',
          lugar: 'Teatro Municipal de Cobquecura',
          tipo: 'Concierto',
          visible: true
        },
        {
          nombre: 'Taller de Instrumentos',
          descripcion: 'Taller abierto para que los niños conozcan los instrumentos de la orquesta',
          fecha: '2025-07-15',
          hora_inicio: '15:00:00',
          hora_fin: '17:00:00',
          lugar: 'Escuela de Música',
          tipo: 'Taller',
          visible: true
        },
        {
          nombre: 'Presentación en Fiestas Patrias',
          descripcion: 'Participación especial de la orquesta en las celebraciones de Fiestas Patrias',
          fecha: '2025-09-18',
          hora_inicio: '12:00:00',
          hora_fin: '13:30:00',
          lugar: 'Plaza de Armas de Cobquecura',
          tipo: 'Presentación',
          visible: true
        },
        {
          nombre: 'Concierto de Navidad',
          descripcion: 'Concierto navideño con villancicos y música festiva',
          fecha: '2025-12-20',
          hora_inicio: '20:00:00',
          hora_fin: '22:00:00',
          lugar: 'Iglesia de Cobquecura',
          tipo: 'Concierto',
          visible: true
        }
      ];

      for (const evento of eventosEjemplo) {
        await execute(`
          INSERT INTO eventos (nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, tipo, visible)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          evento.nombre,
          evento.descripcion,
          evento.fecha,
          evento.hora_inicio,
          evento.hora_fin,
          evento.lugar,
          evento.tipo,
          evento.visible
        ]);
      }

      console.log('✅ Eventos de ejemplo creados exitosamente');
      res.json({ message: 'Eventos de ejemplo creados exitosamente', count: eventosEjemplo.length });
    } catch (error) {
      console.error('❌ Error al crear eventos de ejemplo:', error);
      res.status(500).json({ error: 'Error al crear eventos de ejemplo' });
    }
  },
};

module.exports = eventosController;