const { execute } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const adminController = {
  // ==================== DASHBOARD ====================
  getDashboard: async (req, res) => {
    try {
      console.log('🔄 Generando dashboard admin...');

      const [
        totalEstudiantes,
        totalProfesores,
        totalInstrumentos,
        prestamosActivos,
        evaluacionesRecientes,
        totalEventos,
        totalNoticias
      ] = await Promise.all([
        execute('SELECT COUNT(*) as total FROM estudiantes WHERE estado = "activo"'),
        execute('SELECT COUNT(*) as total FROM profesores WHERE estado = "activo"'),
        execute('SELECT COUNT(*) as total FROM instrumentos WHERE disponible = TRUE'),
        execute('SELECT COUNT(*) as total FROM prestamos WHERE estado = "activo"'),
        execute('SELECT COUNT(*) as total FROM evaluaciones WHERE fecha_evaluacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)'),
        execute('SELECT COUNT(*) as total FROM eventos WHERE fecha >= CURDATE()'),
        execute('SELECT COUNT(*) as total FROM noticias WHERE visible = TRUE')
      ]);

      const stats = {
        estudiantes: totalEstudiantes[0]?.total || 0,
        profesores: totalProfesores[0]?.total || 0,
        instrumentos: totalInstrumentos[0]?.total || 0,
        eventos: totalEventos[0]?.total || 0,
        noticias: totalNoticias[0]?.total || 0,
        prestamosActivos: prestamosActivos[0]?.total || 0,
        evaluacionesRecientes: evaluacionesRecientes[0]?.total || 0,
        ultimaActualizacion: new Date().toISOString()
      };

      console.log('✅ Stats generadas:', stats);
      res.json(stats);
    } catch (error) {
      console.error('❌ Error generando dashboard:', error);
      res.status(500).json({ error: 'Error al cargar dashboard' });
    }
  },

  // ==================== ESTUDIANTES ====================
  getEstudiantes: async (req, res) => {
    try {
      const query = `
        SELECT e.*, 
               DATE_FORMAT(e.fecha_nacimiento, '%Y-%m-%d') as fecha_nacimiento_formatted,
               DATE_FORMAT(e.fecha_ingreso, '%Y-%m-%d') as fecha_ingreso_formatted
        FROM estudiantes e
        ORDER BY e.apellidos, e.nombres
      `;
      const rows = await execute(query);
      res.json(rows);
    } catch (error) {
      console.error('Error obteniendo estudiantes:', error);
      res.status(500).json({ message: 'Error al obtener los estudiantes' });
    }
  },

  crearEstudiante: async (req, res) => {
    try {
      console.log('📝 Datos recibidos para crear estudiante:', req.body);

      const {
        rut,
        nombres,
        apellidos,
        email,
        telefono,
        fecha_nacimiento,
        fecha_ingreso,
        notas_adicionales,
        estado = 'activo',
        crear_cuenta = false,
        username,
        password
      } = req.body;

      // Validaciones básicas
      if (!rut || !nombres || !apellidos) {
        return res.status(400).json({
          message: 'RUT, nombres y apellidos son obligatorios'
        });
      }

      if (!fecha_ingreso) {
        return res.status(400).json({
          message: 'La fecha de ingreso es obligatoria'
        });
      }

      // Verificar si el estudiante ya existe
      const estudianteExistente = await execute(
        'SELECT rut FROM estudiantes WHERE rut = ?',
        [rut]
      );

      if (estudianteExistente.length > 0) {
        return res.status(400).json({
          message: 'Ya existe un estudiante con este RUT'
        });
      }

      // ✅ DETERMINAR PASSWORD_HASH según si se crea cuenta o no
      let password_hash_estudiante;
      let cuentaCreada = false;
      let mensajeRespuesta = 'Estudiante creado correctamente';

      if (crear_cuenta === true && username && password) {
        console.log('🔐 Creando cuenta de usuario para estudiante...');

        try {
          // Verificar que el username no exista
          const usuarioExistente = await execute(
            'SELECT id_usuario FROM usuarios WHERE username = ?',
            [username]
          );

          if (usuarioExistente.length > 0) {
            return res.status(400).json({
              message: 'El username ya existe. Use otro username.',
              estudianteCreado: false
            });
          }

          // Crear hash de la contraseña real
          password_hash_estudiante = await bcrypt.hash(password, 12);

          // Crear usuario en la tabla usuarios PRIMERO
          const resultadoUsuario = await execute(
            'INSERT INTO usuarios (username, email, password_hash, userType) VALUES (?, ?, ?, ?)',
            [username, email || username, password_hash_estudiante, 'estudiante']
          );

          console.log('✅ Usuario creado en tabla usuarios con ID:', resultadoUsuario.insertId);
          cuentaCreada = true;
          mensajeRespuesta += '. Cuenta de usuario creada correctamente';

        } catch (errorCuenta) {
          console.error('❌ Error creando cuenta de usuario:', errorCuenta);
          return res.status(400).json({
            message: 'Error al crear la cuenta de usuario: ' + errorCuenta.message,
            estudianteCreado: false
          });
        }
      } else {
        console.log('🔐 No se solicita cuenta, usando password temporal...');
        // Usar password temporal si no se crea cuenta
        password_hash_estudiante = await bcrypt.hash('temp_' + rut + '_' + Date.now(), 12);
      }

      // ✅ CREAR ESTUDIANTE con el password_hash correcto
      const queryEstudiante = `
        INSERT INTO estudiantes (
          rut, nombres, apellidos, email, telefono, 
          fecha_nacimiento, fecha_ingreso, notas_adicionales, estado, password_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const paramsEstudiante = [
        rut,
        nombres,
        apellidos,
        email || null,
        telefono || null,
        fecha_nacimiento || null,
        fecha_ingreso,
        notas_adicionales || null,
        estado,
        password_hash_estudiante
      ];

      console.log('🔍 Ejecutando query estudiante:', queryEstudiante);
      console.log('📝 Parámetros estudiante:', paramsEstudiante);

      const resultadoEstudiante = await execute(queryEstudiante, paramsEstudiante);

      console.log('✅ Estudiante creado exitosamente con ID:', resultadoEstudiante.insertId);
      console.log('✅ Cuenta de usuario creada:', cuentaCreada);

      res.status(201).json({
        message: mensajeRespuesta,
        estudianteId: resultadoEstudiante.insertId,
        cuenta_creada: cuentaCreada
      });

    } catch (error) {
      console.error('❌ Error creando estudiante:', error);

      // Manejo de errores específicos
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('username')) {
          res.status(400).json({ message: 'El username ya existe' });
        } else if (error.sqlMessage.includes('email')) {
          res.status(400).json({ message: 'El email ya existe' });
        } else {
          res.status(400).json({ message: 'Ya existe un registro con estos datos' });
        }
      } else {
        res.status(500).json({
          message: 'Error interno del servidor',
          error: error.message
        });
      }
    }
  },

  actualizarEstudiante: async (req, res) => {
    try {
      const { rut } = req.params;
      const {
        nombres,
        apellidos,
        email,
        telefono,
        fecha_nacimiento,
        fecha_ingreso,
        notas_adicionales,
        estado
      } = req.body;

      console.log('📝 Actualizando estudiante:', rut, req.body);

      // Verificar que el estudiante existe
      const estudianteExistente = await execute(
        'SELECT rut FROM estudiantes WHERE rut = ?',
        [rut]
      );

      if (estudianteExistente.length === 0) {
        return res.status(404).json({
          message: 'Estudiante no encontrado'
        });
      }

      // ✅ ACTUALIZAR SIN TOCAR password_hash (igual que profesores)
      const query = `
        UPDATE estudiantes SET 
          nombres = ?, apellidos = ?, email = ?, telefono = ?, 
          fecha_nacimiento = ?, fecha_ingreso = ?, 
          notas_adicionales = ?, estado = ?
        WHERE rut = ?
      `;

      const params = [
        nombres,
        apellidos,
        email || null,
        telefono || null,
        fecha_nacimiento || null,
        fecha_ingreso,
        notas_adicionales || null,
        estado,
        rut
      ];

      await execute(query, params);

      console.log('✅ Estudiante actualizado exitosamente');

      res.json({
        message: 'Estudiante actualizado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error actualizando estudiante:', error);
      res.status(500).json({
        message: 'Error al actualizar estudiante',
        error: error.message
      });
    }
  },

  eliminarEstudiante: async (req, res) => {
    try {
      const { rut } = req.params;
      await execute('DELETE FROM estudiantes WHERE rut = ?', [rut]);
      res.json({ message: 'Estudiante eliminado exitosamente' });
    } catch (error) {
      console.error('Error eliminando estudiante:', error);
      res.status(500).json({ message: 'Error al eliminar el estudiante' });
    }
  },

  cambiarEstadoEstudiante: async (req, res) => {
    try {
      const { rut } = req.params;
      const { estado } = req.body;

      const query = `UPDATE estudiantes SET estado = ? WHERE rut = ?`;
      await execute(query, [estado, rut]);

      res.json({ message: 'Estado actualizado exitosamente' });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ message: 'Error al actualizar el estado' });
    }
  },

  // ==================== PROFESORES ====================
  getProfesores: async (req, res) => {
    try {
      const query = `
        SELECT p.*,
               DATE_FORMAT(p.fecha_ingreso, '%Y-%m-%d') as fecha_ingreso_formatted
        FROM profesores p
        ORDER BY p.apellidos, p.nombres
      `;
      const rows = await execute(query);
      res.json(rows);
    } catch (error) {
      console.error('Error obteniendo profesores:', error);
      res.status(500).json({ message: 'Error al obtener los profesores' });
    }
  },

  crearProfesor: async (req, res) => {
    try {
      const {
        rut, nombres, apellidos, email, telefono,
        especialidad, anos_experiencia, estado,
        crear_cuenta, username, password
      } = req.body;

      // Validar datos requeridos
      if (!rut || !nombres || !apellidos || !especialidad) {
        return res.status(400).json({ message: 'RUT, nombres, apellidos y especialidad son requeridos' });
      }

      // Crear profesor
      const [result] = await execute(
        'INSERT INTO profesores (rut, nombres, apellidos, email, telefono, especialidad, anos_experiencia, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [rut, nombres, apellidos, email, telefono, especialidad, anos_experiencia || 0, estado || 'activo']
      );

      let mensajeRespuesta = 'Profesor creado correctamente';

      // Si se solicita crear cuenta de usuario
      if (crear_cuenta && username && password) {
        try {
          const password_hash = await bcrypt.hash(password, 12);

          await execute(
            'INSERT INTO usuarios (username, email, password_hash, user_type, rut_asociado) VALUES (?, ?, ?, ?, ?)',
            [username, email || username, password_hash, 'profesor', rut]
          );

          mensajeRespuesta += '. Cuenta de usuario creada correctamente';
        } catch (userError) {
          console.error('Error creando usuario:', userError);
          mensajeRespuesta += '. Error al crear la cuenta de usuario';
        }
      }

      res.status(201).json({ message: mensajeRespuesta });
    } catch (error) {
      console.error('Error creando profesor:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Ya existe un profesor con ese RUT' });
      } else {
        res.status(500).json({ message: 'Error interno del servidor' });
      }
    }
  },

  actualizarProfesor: async (req, res) => {
    try {
      const { rut } = req.params;
      const {
        nombres, apellidos, email, telefono, especialidad,
        anos_experiencia, estado
      } = req.body;

      const query = `
        UPDATE profesores 
        SET nombres = ?, apellidos = ?, email = ?, telefono = ?, 
            especialidad = ?, anos_experiencia = ?, estado = ?
        WHERE rut = ?
      `;

      await execute(query, [
        nombres, apellidos, email, telefono, especialidad,
        anos_experiencia, estado, rut
      ]);

      res.json({ message: 'Profesor actualizado exitosamente' });
    } catch (error) {
      console.error('Error actualizando profesor:', error);
      res.status(500).json({ message: 'Error al actualizar el profesor' });
    }
  },

  eliminarProfesor: async (req, res) => {
    try {
      const { rut } = req.params;
      await execute('DELETE FROM profesores WHERE rut = ?', [rut]);
      res.json({ message: 'Profesor eliminado exitosamente' });
    } catch (error) {
      console.error('Error eliminando profesor:', error);
      res.status(500).json({ message: 'Error al eliminar el profesor' });
    }
  },

  cambiarEstadoProfesor: async (req, res) => {
    try {
      const { rut } = req.params;
      const { estado } = req.body;

      const query = `UPDATE profesores SET estado = ? WHERE rut = ?`;
      await execute(query, [estado, rut]);

      res.json({ message: 'Estado actualizado exitosamente' });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ message: 'Error al actualizar el estado' });
    }
  },

  // ==================== INSTRUMENTOS ====================
  getInstrumentos: async (req, res) => {
    try {
      console.log('🔄 Obteniendo instrumentos...');
      const query = `
        SELECT id, nombre, tipo, marca, modelo, numero_serie, 
               estado_fisico, disponible, ubicacion, valor_estimado, 
               fecha_adquisicion, observaciones
        FROM instrumentos
        ORDER BY tipo, nombre
      `;

      const rows = await execute(query);
      console.log(`✅ ${rows.length} instrumentos encontrados`);

      // ✅ CORRECCIÓN: Devolver directamente el array como esperan otros endpoints
      res.json(rows || []);
    } catch (error) {
      console.error('❌ Error obteniendo instrumentos:', error);
      res.status(500).json({
        error: 'Error al obtener los instrumentos',
        message: error.message
      });
    }
  },

  crearInstrumento: async (req, res) => {
    try {
      console.log('🔄 Creando instrumento:', req.body);
      const {
        nombre, tipo, marca, modelo, numero_serie, estado_fisico,
        disponible, ubicacion, valor_estimado, fecha_adquisicion, observaciones
      } = req.body;

      // Validar campos obligatorios
      if (!nombre || !tipo) {
        return res.status(400).json({
          success: false,
          error: 'Nombre y tipo son campos obligatorios'
        });
      }

      const query = `
        INSERT INTO instrumentos (
          nombre, tipo, marca, modelo, numero_serie, estado_fisico,
          disponible, ubicacion, valor_estimado, fecha_adquisicion, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await execute(query, [
        nombre,
        tipo,
        marca || null,
        modelo || null,
        numero_serie || null,
        estado_fisico || 'bueno',
        disponible !== undefined ? (disponible ? 1 : 0) : 1,
        ubicacion || null,
        valor_estimado || null,
        fecha_adquisicion || null,
        observaciones || null
      ]);

      console.log('✅ Instrumento creado con ID:', result.insertId);
      res.status(201).json({
        success: true,
        message: 'Instrumento registrado exitosamente',
        id: result.insertId
      });
    } catch (error) {
      console.error('❌ Error creando instrumento:', error);
      res.status(500).json({
        success: false,
        error: 'Error al registrar el instrumento',
        message: error.message
      });
    }
  },

  actualizarInstrumento: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('🔄 Actualizando instrumento ID:', id);

      const {
        nombre, tipo, marca, modelo, numero_serie, estado_fisico,
        disponible, ubicacion, valor_estimado, fecha_adquisicion, observaciones
      } = req.body;

      // Validar campos obligatorios
      if (!nombre || !tipo) {
        return res.status(400).json({
          success: false,
          error: 'Nombre y tipo son campos obligatorios'
        });
      }

      const query = `
        UPDATE instrumentos 
        SET nombre = ?, tipo = ?, marca = ?, modelo = ?, numero_serie = ?,
            estado_fisico = ?, disponible = ?, ubicacion = ?, 
            valor_estimado = ?, fecha_adquisicion = ?, observaciones = ?
        WHERE id = ?
      `;

      const result = await execute(query, [
        nombre,
        tipo,
        marca || null,
        modelo || null,
        numero_serie || null,
        estado_fisico || 'bueno',
        disponible !== undefined ? (disponible ? 1 : 0) : 1,
        ubicacion || null,
        valor_estimado || null,
        fecha_adquisicion || null,
        observaciones || null,
        id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Instrumento no encontrado'
        });
      }

      console.log('✅ Instrumento actualizado');
      res.json({
        success: true,
        message: 'Instrumento actualizado exitosamente'
      });
    } catch (error) {
      console.error('❌ Error actualizando instrumento:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar el instrumento',
        message: error.message
      });
    }
  },

  eliminarInstrumento: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('🔄 Eliminando instrumento ID:', id);

      const result = await execute('DELETE FROM instrumentos WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Instrumento no encontrado'
        });
      }

      console.log('✅ Instrumento eliminado');
      res.json({
        success: true,
        message: 'Instrumento eliminado exitosamente'
      });
    } catch (error) {
      console.error('❌ Error eliminando instrumento:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar el instrumento',
        message: error.message
      });
    }
  },

  actualizarDisponibilidad: async (req, res) => {
    try {
      const { id } = req.params;
      const { disponible } = req.body;

      console.log('🔄 Actualizando disponibilidad ID:', id, 'Disponible:', disponible);

      const query = `UPDATE instrumentos SET disponible = ? WHERE id = ?`;
      const result = await execute(query, [disponible ? 1 : 0, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Instrumento no encontrado'
        });
      }

      console.log('✅ Disponibilidad actualizada');
      res.json({
        success: true,
        message: 'Disponibilidad actualizada exitosamente'
      });
    } catch (error) {
      console.error('❌ Error actualizando disponibilidad:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar disponibilidad',
        message: error.message
      });
    }
  },

  // ==================== EVALUACIONES ====================
  getEvaluaciones: async (req, res) => {
    try {
      console.log('🔄 Obteniendo evaluaciones...');

      // Primero verificar la estructura de la tabla
      const structure = await execute('DESCRIBE evaluaciones');
      console.log('📋 Estructura de tabla evaluaciones:', structure);

      const query = `
        SELECT ev.*, 
               CONCAT(e.nombres, ' ', e.apellidos) as estudiante_nombre,
               CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre
        FROM evaluaciones ev
        LEFT JOIN estudiantes e ON ev.estudiante_rut = e.rut
        LEFT JOIN profesores p ON ev.profesor_rut = p.rut
        ORDER BY ev.id DESC
      `;

      const rows = await execute(query);
      console.log(`✅ ${rows.length} evaluaciones encontradas`);
      res.json(rows);
    } catch (error) {
      console.error('❌ Error obteniendo evaluaciones:', error);
      res.status(500).json({ message: 'Error al obtener las evaluaciones', error: error.message });
    }
  },

  crearEvaluacion: async (req, res) => {
    try {
      console.log('🔄 Creando evaluación:', req.body);

      // Primero verificar qué columnas existen realmente
      const structure = await execute('DESCRIBE evaluaciones');
      console.log('📋 Columnas disponibles:', structure.map(col => col.Field));

      // Obtener solo las columnas que existen (excluyendo id y foreign keys automáticas)
      const availableColumns = structure
        .filter(col => col.Field !== 'id' && !col.Key.includes('FOR'))
        .map(col => col.Field);

      console.log('📝 Columnas para insertar:', availableColumns);

      // Si no hay columnas disponibles para insertar, significa que la tabla está mal definida
      if (availableColumns.length === 0) {
        return res.status(500).json({
          message: 'La tabla evaluaciones no está correctamente configurada',
          details: 'No hay columnas disponibles para insertar datos'
        });
      }

      // Crear query dinámico basado en las columnas disponibles
      const placeholders = availableColumns.map(() => '?').join(', ');
      const query = `INSERT INTO evaluaciones (${availableColumns.join(', ')}) VALUES (${placeholders})`;

      // Obtener valores correspondientes del request body
      const values = availableColumns.map(col => req.body[col] || null);

      console.log('🔄 Ejecutando query:', query);
      console.log('📊 Con valores:', values);

      const result = await execute(query, values);

      console.log('✅ Evaluación creada con ID:', result.insertId);
      res.status(201).json({
        message: 'Evaluación registrada exitosamente',
        id: result.insertId
      });

    } catch (error) {
      console.error('❌ Error creando evaluación:', error);
      console.error('❌ Stack trace:', error.stack);
      res.status(500).json({
        message: 'Error al registrar la evaluación',
        error: error.message,
        sqlError: error.sqlMessage || 'No SQL error message'
      });
    }
  },

  actualizarEvaluacion: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('🔄 Actualizando evaluación ID:', id);

      // Verificar estructura de tabla
      const structure = await execute('DESCRIBE evaluaciones');
      const availableColumns = structure
        .filter(col => col.Field !== 'id' && !col.Key.includes('FOR'))
        .map(col => col.Field);

      // Crear updates dinámicos
      const updates = [];
      const values = [];

      availableColumns.forEach(col => {
        if (req.body[col] !== undefined) {
          updates.push(`${col} = ?`);
          values.push(req.body[col]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No hay datos para actualizar' });
      }

      values.push(id);
      const query = `UPDATE evaluaciones SET ${updates.join(', ')} WHERE id = ?`;

      console.log('🔄 Ejecutando update:', query);
      console.log('📊 Con valores:', values);

      const result = await execute(query, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Evaluación no encontrada' });
      }

      console.log('✅ Evaluación actualizada exitosamente');
      res.json({ message: 'Evaluación actualizada exitosamente' });

    } catch (error) {
      console.error('❌ Error actualizando evaluación:', error);
      res.status(500).json({
        message: 'Error al actualizar la evaluación',
        error: error.message
      });
    }
  },

  eliminarEvaluacion: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('🔄 Eliminando evaluación ID:', id);

      const result = await execute('DELETE FROM evaluaciones WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Evaluación no encontrada' });
      }

      console.log('✅ Evaluación eliminada exitosamente');
      res.json({ message: 'Evaluación eliminada exitosamente' });

    } catch (error) {
      console.error('❌ Error eliminando evaluación:', error);
      res.status(500).json({
        message: 'Error al eliminar la evaluación',
        error: error.message
      });
    }
  },

  // ==================== PRÉSTAMOS ====================
  getPrestamos: async (req, res) => {
    try {
      const query = `
        SELECT p.id, p.estudiante_rut, p.profesor_rut, p.instrumento_id,
               p.fecha_prestamo,
               p.fecha_devolucion_programada,
               p.fecha_devolucion_real,
               p.estado, p.observaciones_prestamo,
               p.observaciones_devolucion,
               CONCAT(e.nombres, ' ', e.apellidos) as estudiante_nombre,
               e.apellidos as estudiante_apellidos,
               CONCAT(prof.nombres, ' ', prof.apellidos) as profesor_nombres,
               prof.apellidos as profesor_apellidos,
               i.nombre as instrumento_nombre,
               i.tipo as instrumento_tipo,
               i.marca as instrumento_marca
        FROM prestamos p
        LEFT JOIN estudiantes e ON p.estudiante_rut = e.rut
        LEFT JOIN profesores prof ON p.profesor_rut = prof.rut
        LEFT JOIN instrumentos i ON p.instrumento_id = i.id
        ORDER BY p.fecha_prestamo DESC
      `;

      const rows = await execute(query);
      res.json(rows);
    } catch (error) {
      console.error('Error obteniendo préstamos:', error);
      res.status(500).json({ message: 'Error al obtener los préstamos' });
    }
  },

  crearPrestamo: async (req, res) => {
    try {
      const {
        estudiante_rut, profesor_rut, instrumento_id, fecha_prestamo,
        fecha_devolucion_programada, observaciones_prestamo
      } = req.body;

      const query = `
        INSERT INTO prestamos (
          estudiante_rut, profesor_rut, instrumento_id, fecha_prestamo,
          fecha_devolucion_programada, estado, observaciones_prestamo
        ) VALUES (?, ?, ?, ?, ?, 'activo', ?)
      `;

      await execute(query, [
        estudiante_rut, profesor_rut, instrumento_id, fecha_prestamo,
        fecha_devolucion_programada, observaciones_prestamo
      ]);

      // Marcar instrumento como no disponible
      await execute('UPDATE instrumentos SET disponible = FALSE WHERE id = ?', [instrumento_id]);

      res.status(201).json({ message: 'Préstamo registrado exitosamente' });
    } catch (error) {
      console.error('Error creando préstamo:', error);
      res.status(500).json({ message: 'Error al registrar el préstamo' });
    }
  },

  actualizarPrestamo: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        estudiante_rut, profesor_rut, instrumento_id, fecha_prestamo,
        fecha_devolucion_programada, estado, observaciones_prestamo
      } = req.body;

      const query = `
        UPDATE prestamos 
        SET estudiante_rut = ?, profesor_rut = ?, instrumento_id = ?, 
            fecha_prestamo = ?, fecha_devolucion_programada = ?, 
            estado = ?, observaciones_prestamo = ?
        WHERE id = ?
      `;

      await execute(query, [
        estudiante_rut, profesor_rut, instrumento_id, fecha_prestamo,
        fecha_devolucion_programada, estado, observaciones_prestamo, id
      ]);

      res.json({ message: 'Préstamo actualizado exitosamente' });
    } catch (error) {
      console.error('Error actualizando préstamo:', error);
      res.status(500).json({ message: 'Error al actualizar el préstamo' });
    }
  },

  eliminarPrestamo: async (req, res) => {
    try {
      const { id } = req.params;

      // Obtener información del préstamo antes de eliminarlo
      const prestamo = await execute('SELECT instrumento_id FROM prestamos WHERE id = ?', [id]);
      if (prestamo.length > 0) {
        // Marcar instrumento como disponible nuevamente
        await execute('UPDATE instrumentos SET disponible = TRUE WHERE id = ?', [prestamo[0].instrumento_id]);
      }

      await execute('DELETE FROM prestamos WHERE id = ?', [id]);
      res.json({ message: 'Préstamo eliminado exitosamente' });
    } catch (error) {
      console.error('Error eliminando préstamo:', error);
      res.status(500).json({ message: 'Error al eliminar el préstamo' });
    }
  },

  devolverPrestamo: async (req, res) => {
    try {
      const { id } = req.params;
      const { observaciones_devolucion } = req.body;

      const query = `
        UPDATE prestamos 
        SET fecha_devolucion_real = CURDATE(), estado = 'devuelto',
            observaciones_devolucion = ?
        WHERE id = ?
      `;

      await execute(query, [observaciones_devolucion || 'Sin observaciones', id]);

      res.json({ message: 'Devolución registrada exitosamente' });
    } catch (error) {
      console.error('Error en devolución:', error);
      res.status(500).json({ message: 'Error al procesar la devolución' });
    }
  },

  cambiarEstadoPrestamo: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const query = `UPDATE prestamos SET estado = ? WHERE id = ?`;
      await execute(query, [estado, id]);

      // Si se devuelve, marcar instrumento como disponible
      if (estado === 'devuelto') {
        const prestamo = await execute('SELECT instrumento_id FROM prestamos WHERE id = ?', [id]);
        if (prestamo.length > 0) {
          await execute('UPDATE instrumentos SET disponible = TRUE WHERE id = ?', [prestamo[0].instrumento_id]);
        }
      }

      res.json({ message: 'Estado actualizado exitosamente' });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ message: 'Error al actualizar el estado' });
    }
  },

  // ==================== ASISTENCIA ====================
  getAsistencias: async (req, res) => {
    try {
      const query = `
        SELECT a.id, a.estudiante_rut, a.profesor_rut, a.fecha_clase, 
               a.hora_clase, a.asistio as presente, a.llego_tarde, 
               a.minutos_tardanza, a.justificacion, a.observaciones,
               CONCAT(e.nombres, ' ', e.apellidos) as estudiante_nombre,
               CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre
        FROM asistencia a
        LEFT JOIN estudiantes e ON a.estudiante_rut = e.rut
        LEFT JOIN profesores p ON a.profesor_rut = p.rut
        ORDER BY a.fecha_clase DESC, a.hora_clase DESC
      `;

      const rows = await execute(query);
      res.json(rows);
    } catch (error) {
      console.error('Error obteniendo asistencias:', error);
      res.status(500).json({ message: 'Error al obtener las asistencias' });
    }
  },

  crearAsistencia: async (req, res) => {
    try {
      const {
        estudiante_rut, profesor_rut, fecha_clase, hora_clase,
        presente, observaciones
      } = req.body;

      // ✅ CORRECCIÓN: Simplificar y usar solo los campos necesarios
      const query = `
        INSERT INTO asistencia (
          estudiante_rut, profesor_rut, fecha_clase, hora_clase,
          asistio, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      await execute(query, [
        estudiante_rut,
        profesor_rut,
        fecha_clase,
        hora_clase,
        presente ? 1 : 0,
        observaciones || null
      ]);

      res.status(201).json({ message: 'Asistencia registrada exitosamente' });
    } catch (error) {
      console.error('Error creando asistencia:', error);
      res.status(500).json({ message: 'Error al registrar la asistencia', error: error.message });
    }
  },

  actualizarAsistencia: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        estudiante_rut, profesor_rut, fecha_clase, hora_clase,
        presente, observaciones
      } = req.body;

      // ✅ CORRECCIÓN: Simplificar la query y usar solo los campos necesarios
      const query = `
        UPDATE asistencia 
        SET estudiante_rut = ?, profesor_rut = ?, fecha_clase = ?, hora_clase = ?,
            asistio = ?, observaciones = ?
        WHERE id = ?
      `;

      await execute(query, [
        estudiante_rut,
        profesor_rut,
        fecha_clase,
        hora_clase,
        presente ? 1 : 0,
        observaciones || null,
        id
      ]);

      res.json({ message: 'Asistencia actualizada exitosamente' });
    } catch (error) {
      console.error('Error actualizando asistencia:', error);
      res.status(500).json({ message: 'Error al actualizar la asistencia', error: error.message });
    }
  },

  eliminarAsistencia: async (req, res) => {
    try {
      const { id } = req.params;

      await execute('DELETE FROM asistencia WHERE id = ?', [id]);

      res.json({ message: 'Asistencia eliminada exitosamente' });
    } catch (error) {
      console.error('Error eliminando asistencia:', error);
      res.status(500).json({ message: 'Error al eliminar la asistencia', error: error.message });
    }
  },

  getHorarios: async (req, res) => {
    try {
      const query = `
        SELECT h.id, h.estudiante_rut, h.profesor_rut, h.dia_semana, 
               h.hora_inicio, h.hora_fin, h.materia, h.aula,
               CONCAT(e.nombres, ' ', e.apellidos) as estudiante_nombre,
               CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre
        FROM horarios_clases h
        LEFT JOIN estudiantes e ON h.estudiante_rut = e.rut
        LEFT JOIN profesores p ON h.profesor_rut = p.rut
        ORDER BY h.dia_semana, h.hora_inicio
      `;

      const rows = await execute(query);
      res.json(rows);
    } catch (error) {
      console.error('Error obteniendo horarios:', error);
      res.status(500).json({ message: 'Error al obtener los horarios', error: error.message });
    }
  },

  // ==================== EVENTOS ====================
  getEventos: async (req, res) => {
    try {
      console.log('🔄 Obteniendo eventos para admin...');
      const query = `
        SELECT id_evento, nombre, descripcion, fecha, hora_inicio, hora_fin, 
               lugar, tipo, estado, visible, capacidad_maxima, costo,
               DATE_FORMAT(fecha, '%Y-%m-%d') as fecha_formatted,
               TIME_FORMAT(hora_inicio, '%H:%i') as hora_inicio_formatted,
               TIME_FORMAT(hora_fin, '%H:%i') as hora_fin_formatted,
               fecha_creacion
        FROM eventos 
        ORDER BY fecha DESC, hora_inicio ASC
      `;

      const rows = await execute(query);
      console.log(`✅ ${rows.length} eventos encontrados para admin`);
      res.json(rows);
    } catch (error) {
      console.error('❌ Error obteniendo eventos:', error);
      res.status(500).json({ message: 'Error al obtener los eventos', error: error.message });
    }
  },

  crearEvento: async (req, res) => {
    try {
      console.log('🔄 Creando evento...', req.body);
      const {
        nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, tipo,
        estado, visible, capacidad_maxima, costo
      } = req.body;

      // Validaciones
      if (!nombre || !fecha || !lugar) {
        return res.status(400).json({ message: 'Nombre, fecha y lugar son obligatorios' });
      }

      const query = `
        INSERT INTO eventos (
          nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, tipo,
          estado, visible, capacidad_maxima, costo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await execute(query, [
        nombre,
        descripcion || '',
        fecha,
        hora_inicio || '09:00:00',
        hora_fin || '10:00:00',
        lugar,
        tipo || 'concierto',
        estado || 'programado',
        visible !== false ? 1 : 0,
        capacidad_maxima || null,
        costo || 0.00
      ]);

      console.log('✅ Evento creado con ID:', result.insertId);
      res.status(201).json({
        message: 'Evento creado exitosamente',
        id: result.insertId
      });
    } catch (error) {
      console.error('❌ Error creando evento:', error);
      res.status(500).json({
        message: 'Error al crear el evento',
        error: error.message
      });
    }
  },

  actualizarEvento: async (req, res) => {
    try {
      console.log('🔄 Actualizando evento ID:', req.params.id);
      console.log('📝 Datos recibidos:', req.body);

      const { id } = req.params;
      const {
        nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, tipo,
        estado, visible, capacidad_maxima, costo
      } = req.body;

      // Validar que el ID existe
      if (!id) {
        return res.status(400).json({ message: 'ID del evento es requerido' });
      }

      // Validar datos obligatorios
      if (!nombre || !fecha || !lugar) {
        return res.status(400).json({ message: 'Nombre, fecha y lugar son obligatorios' });
      }

      const query = `
        UPDATE eventos 
        SET nombre = ?, descripcion = ?, fecha = ?, hora_inicio = ?, 
            hora_fin = ?, lugar = ?, tipo = ?, estado = ?, visible = ?, 
            capacidad_maxima = ?, costo = ?
        WHERE id_evento = ?
      `;

      const result = await execute(query, [
        nombre,
        descripcion || '',
        fecha,
        hora_inicio || '09:00:00',
        hora_fin || '10:00:00',
        lugar,
        tipo || 'concierto',
        estado || 'programado',
        visible ? 1 : 0,
        capacidad_maxima || null,
        costo || 0.00,
        id
      ]);

      console.log('📊 Resultado de la query:', result);

      if (result.affectedRows === 0) {
        console.log('⚠️  No se encontró el evento con ID:', id);
        return res.status(404).json({ message: 'Evento no encontrado' });
      }

      console.log('✅ Evento actualizado exitosamente');
      res.json({ message: 'Evento actualizado exitosamente' });
    } catch (error) {
      console.error('❌ Error actualizando evento:', error);
      res.status(500).json({
        message: 'Error al actualizar el evento',
        error: error.message
      });
    }
  },

  eliminarEvento: async (req, res) => {
    try {
      console.log('🔄 Eliminando evento ID:', req.params.id);
      const { id } = req.params;

      const result = await execute('DELETE FROM eventos WHERE id_evento = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Evento no encontrado' });
      }

      console.log('✅ Evento eliminado');
      res.json({ message: 'Evento eliminado exitosamente' });
    } catch (error) {
      console.error('❌ Error eliminando evento:', error);
      res.status(500).json({
        message: 'Error al eliminar el evento',
        error: error.message
      });
    }
  },

  // ==================== NOTICIAS ====================
  getNoticias: async (req, res) => {
    try {
      console.log('🔄 Obteniendo noticias para admin...');

      // ✅ CORREGIR: Usar los nombres de campos correctos de la base de datos
      const query = `
        SELECT id_noticia, titulo, contenido, resumen, fecha_publicacion, autor, 
               categoria, imagen_principal, visible, destacado, vistas, slug,
               DATE_FORMAT(fecha_publicacion, '%Y-%m-%d') as fecha_publicacion_formatted,
               fecha_actualizacion
        FROM noticias 
        ORDER BY fecha_publicacion DESC, fecha_actualizacion DESC
      `;

      const rows = await execute(query);
      console.log(`✅ ${rows.length} noticias encontradas para admin`);

      // ✅ DEBUG: Verificar contenido de cada noticia
      rows.forEach((noticia, index) => {
        console.log(`📰 Noticia ${index + 1} (ID: ${noticia.id_noticia}):`, {
          titulo: noticia.titulo,
          tieneContenido: !!noticia.contenido,
          longitudContenido: noticia.contenido ? noticia.contenido.length : 0,
          contenidoPreview: noticia.contenido ? noticia.contenido.substring(0, 50) + '...' : 'VACÍO O NULL'
        });
      });

      res.json(rows);
    } catch (error) {
      console.error('❌ Error obteniendo noticias:', error);
      res.status(500).json({ message: 'Error al obtener las noticias', error: error.message });
    }
  },

  crearNoticia: async (req, res) => {
    try {
      console.log('🔄 Creando noticia...');
      console.log('📋 Datos del cuerpo:', req.body);
      console.log('📁 Archivos recibidos:', req.files);

      const {
        titulo,
        contenido,
        resumen,
        fecha_publicacion,
        autor,
        categoria,
        visible,
        destacado
      } = req.body;

      if (!titulo || !contenido) {
        return res.status(400).json({
          error: 'Título y contenido son obligatorios'
        });
      }

      // Generar slug único
      const slug = titulo.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);

      let slugFinal = slug;
      let contador = 0;
      while (true) {
        const existeSlug = await execute(
          'SELECT id_noticia FROM noticias WHERE slug = ?',
          [slugFinal]
        );
        if (existeSlug.length === 0) break;
        contador++;
        slugFinal = `${slug}-${contador}`;
      }

      // Procesar imagen principal
      let imagen_principal = '';
      if (req.files && req.files.imagen && req.files.imagen[0]) {
        const archivo = req.files.imagen[0];
        imagen_principal = `/uploads/noticias/${archivo.filename}`;
        console.log('🖼️ Imagen principal:', imagen_principal);
      }

      // CREAR LA NOTICIA
      const query = `
            INSERT INTO noticias (
                titulo, slug, contenido, resumen, fecha_publicacion, autor, categoria, 
                imagen_principal, visible, destacado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

      // Convertir strings a booleanos correctamente
      const visibleBoolean = visible === 'true' || visible === true || visible === 1;
      const destacadoBoolean = destacado === 'true' || destacado === true || destacado === 1;

      const parametros = [
        titulo,
        slugFinal,
        contenido,
        resumen || null,
        fecha_publicacion || new Date().toISOString().split('T')[0],
        autor || 'Administrador',
        categoria || 'General',
        imagen_principal,
        visibleBoolean ? 1 : 0,
        destacadoBoolean ? 1 : 0
      ];

      console.log('📝 Parámetros para INSERT:', parametros);
      console.log('🔧 Conversión booleanos:', {
        visible: `"${visible}" -> ${visibleBoolean}`,
        destacado: `"${destacado}" -> ${destacadoBoolean}`
      });

      const result = await execute(query, parametros);
      const noticiaId = result.insertId;

      console.log('✅ Noticia creada exitosamente con ID:', noticiaId);

      // ✅ CORRECCIÓN: GUARDAR IMAGEN PRINCIPAL EN noticias_imagenes TAMBIÉN
      if (req.files && req.files.imagen && req.files.imagen[0]) {
        const archivo = req.files.imagen[0];

        console.log('💾 Guardando imagen principal en tabla noticias_imagenes...');

        const queryImagenPrincipal = `
                INSERT INTO noticias_imagenes (
                    noticia_id, imagen_url, imagen_alt, orden, es_principal, 
                    tipo_archivo, tipo_mime, tamaño_archivo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

        await execute(queryImagenPrincipal, [
          noticiaId,
          `/uploads/noticias/${archivo.filename}`,
          archivo.originalname || 'Imagen principal',
          0, // orden 0 para imagen principal
          1, // es_principal = true
          archivo.mimetype.startsWith('video/') ? 'video' : 'imagen',
          archivo.mimetype,
          archivo.size
        ]);

        console.log('✅ Imagen principal guardada en noticias_imagenes');
      }

      // PROCESAR GALERÍA DE IMÁGENES
      if (req.files && req.files.imagenes_galeria && req.files.imagenes_galeria.length > 0) {
        console.log('📸 Procesando galería:', req.files.imagenes_galeria.length, 'archivos');

        for (let i = 0; i < req.files.imagenes_galeria.length; i++) {
          const archivo = req.files.imagenes_galeria[i];
          const imagenUrl = `/uploads/noticias/${archivo.filename}`;

          const queryImagen = `
                    INSERT INTO noticias_imagenes (
                        noticia_id, imagen_url, imagen_alt, orden, es_principal,
                        tipo_archivo, tipo_mime, tamaño_archivo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

          await execute(queryImagen, [
            noticiaId,
            imagenUrl,
            archivo.originalname,
            i + 1, // orden 1, 2, 3... para galería
            0, // es_principal = false para galería
            archivo.mimetype.startsWith('video/') ? 'video' : 'imagen',
            archivo.mimetype,
            archivo.size
          ]);

          console.log(`📁 Archivo ${i + 1} de galería guardado:`, imagenUrl);
        }
      }

      // ✅ TAMBIÉN PROCESAR ARCHIVOS DEL CAMPO 'archivos' (usado por el frontend)
      if (req.files && req.files.archivos && req.files.archivos.length > 0) {
        console.log('📦 Procesando archivos adicionales:', req.files.archivos.length);

        // Calcular siguiente orden (después de imagen principal y galería)
        let siguienteOrden = 1;
        if (req.files.imagen && req.files.imagen[0]) siguienteOrden++;
        if (req.files.imagenes_galeria) siguienteOrden += req.files.imagenes_galeria.length;

        for (let i = 0; i < req.files.archivos.length; i++) {
          const archivo = req.files.archivos[i];
          const archivoUrl = `/uploads/noticias/${archivo.filename}`;

          const queryArchivo = `
                    INSERT INTO noticias_imagenes (
                        noticia_id, imagen_url, imagen_alt, orden, es_principal,
                        tipo_archivo, tipo_mime, tamaño_archivo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

          await execute(queryArchivo, [
            noticiaId,
            archivoUrl,
            archivo.originalname,
            siguienteOrden + i,
            0, // es_principal = false
            archivo.mimetype.startsWith('video/') ? 'video' : 'imagen',
            archivo.mimetype,
            archivo.size
          ]);

          console.log(`📎 Archivo adicional ${i + 1} guardado:`, archivoUrl);
        }
      }

      // Obtener noticia completa con imágenes para respuesta
      const noticiaCompleta = await execute(
        'SELECT * FROM noticias WHERE id_noticia = ?',
        [noticiaId]
      );

      const totalArchivos = (req.files?.imagen?.length || 0) +
        (req.files?.imagenes_galeria?.length || 0) +
        (req.files?.archivos?.length || 0);

      res.status(201).json({
        success: true,
        message: 'Noticia creada exitosamente',
        noticia_id: noticiaId,
        noticia: noticiaCompleta[0],
        archivos_guardados: totalArchivos
      });

    } catch (error) {
      console.error('❌ Error creando noticia:', error);
      res.status(500).json({
        error: 'Error creando la noticia',
        details: error.message
      });
    }
  },

  actualizarNoticia: async (req, res) => {
    try {
      console.log('📝 [ADMIN] Actualizando noticia');
      console.log('📋 req.body:', JSON.stringify(req.body, null, 2));
      if (req.files) {
        console.log('📁 req.files keys:', Object.keys(req.files));
        Object.entries(req.files).forEach(([campo, archivos]) => {
          console.log(`  📂 Campo '${campo}': ${archivos.length} archivo(s)`);
          archivos.forEach((archivo, idx) => {
            console.log(`    [${idx}] ${archivo.originalname} -> ${archivo.filename}`);
          });
        });
      } else {
        console.log('📁 req.files está vacío o undefined');
      }

      const { id } = req.params;
      console.log('🔄 Actualizando noticia ID:', id);
      console.log('📝 Datos recibidos:', req.body);

      // Verificar que la noticia existe
      const noticiaExistente = await execute(
        'SELECT * FROM noticias WHERE id_noticia = ?',
        [id]
      );

      if (noticiaExistente.length === 0) {
        return res.status(404).json({
          error: 'Noticia no encontrada'
        });
      }

      const noticia = noticiaExistente[0];

      // Generar nuevo slug si el título cambió
      let slugFinal = noticia.slug;
      if (req.body.titulo && req.body.titulo !== noticia.titulo) {
        const nuevoSlug = req.body.titulo.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100);

        let contador = 0;
        slugFinal = nuevoSlug;
        while (true) {
          const existeSlug = await execute(
            'SELECT id_noticia FROM noticias WHERE slug = ? AND id_noticia != ?',
            [slugFinal, id]
          );
          if (existeSlug.length === 0) break;
          contador++;
          slugFinal = `${nuevoSlug}-${contador}`;
        }
      }

      // MEJORAR: Procesar imagen principal (nueva o existente)
      // NOTA: Usamos tabla noticias_imagenes, no el campo imagen_principal de noticias

      // Caso 1: Nueva imagen principal subida
      if (req.files && req.files.imagen && req.files.imagen[0]) {
        const archivo = req.files.imagen[0];
        const imagen_principal_url = `/uploads/noticias/${archivo.filename}`;
        console.log('🖼️ Nueva imagen principal:', imagen_principal_url);

        // Eliminar imagen principal anterior de noticias_imagenes
        console.log('🗑️ Eliminando imagen principal anterior de noticias_imagenes...');
        await execute(
          'DELETE FROM noticias_imagenes WHERE noticia_id = ? AND es_principal = 1',
          [id]
        );

        // Guardar nueva imagen principal en noticias_imagenes
        console.log('💾 Guardando nueva imagen principal en noticias_imagenes...');
        const queryImagenPrincipal = `
        INSERT INTO noticias_imagenes (
          noticia_id, imagen_url, imagen_alt, orden, es_principal, 
          tipo_archivo, tipo_mime, tamaño_archivo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

        await execute(queryImagenPrincipal, [
          id,
          imagen_principal_url,
          archivo.originalname || 'Imagen principal',
          0, // orden 0 para imagen principal
          1, // es_principal = true
          archivo.mimetype.startsWith('video/') ? 'video' : 'imagen',
          archivo.mimetype,
          archivo.size
        ]);

        console.log('✅ Nueva imagen principal guardada en noticias_imagenes');
      } 
      // Caso 2: Imagen principal existente seleccionada
      else if (req.body.imagen_principal_existente) {
        const imagenExistenteId = req.body.imagen_principal_existente;
        console.log('🔄 Cambiando imagen principal a existente ID:', imagenExistenteId);

        // Quitar es_principal de todas las imágenes
        await execute(
          'UPDATE noticias_imagenes SET es_principal = 0 WHERE noticia_id = ?',
          [id]
        );

        // Establecer la imagen seleccionada como principal
        const resultadoUpdate = await execute(
          'UPDATE noticias_imagenes SET es_principal = 1, orden = 0 WHERE id_imagen = ? AND noticia_id = ?',
          [imagenExistenteId, id]
        );

        if (resultadoUpdate.affectedRows > 0) {
          console.log('✅ Imagen principal actualizada en noticias_imagenes');
        }
      }
      // Caso 3: Quitar imagen principal
      else if (req.body.quitar_imagen_principal === 'true') {
        console.log('🗑️ Quitando imagen principal...');
        
        // Quitar es_principal de todas las imágenes
        await execute(
          'UPDATE noticias_imagenes SET es_principal = 0 WHERE noticia_id = ?',
          [id]
        );
        
        console.log('✅ Imagen principal removida de noticias_imagenes');
      }

      // ACTUALIZAR LA NOTICIA (SIN imagen_principal - usamos noticias_imagenes)
      const query = `
      UPDATE noticias SET 
        titulo = ?, 
        slug = ?, 
        contenido = ?, 
        resumen = ?, 
        fecha_publicacion = ?, 
        autor = ?, 
        categoria = ?, 
        visible = ?, 
        destacado = ?,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_noticia = ?
    `;

      // MEJORAR: Manejo robusto de valores booleanos desde FormData
      console.log('🔍 Valores booleanos recibidos:', {
        visible: { valor: visible, tipo: typeof visible },
        destacado: { valor: destacado, tipo: typeof destacado }
      });

      // Función helper para convertir valores a boolean correctamente
      const convertirABoolean = (valor, valorActual, nombreCampo) => {
        console.log(`🔧 Convirtiendo "${valor}" (${typeof valor})`);
        
        if (valor === undefined || valor === null) {
          console.log(`  ⏩ Manteniendo valor actual: ${valorActual}`);
          return valorActual;
        }
        
        // Convertir string '1'/'0' o 'true'/'false' a boolean numérico
        if (valor === 'true' || valor === true || valor === 1 || valor === '1') {
          console.log(`  ✅ Resultado: true`);
          return true;
        }
        
        if (valor === 'false' || valor === false || valor === 0 || valor === '0') {
          console.log(`  ✅ Resultado: false`);
          return false;
        }
        
        console.log(`  ⚠️ Valor no reconocido, manteniendo actual: ${valorActual}`);
        return valorActual;
      };

      const visibleValue = convertirABoolean(visible, noticia.visible, 'visible');
      const destacadoValue = convertirABoolean(destacado, noticia.destacado, 'destacado');

      console.log('🔧 Valores finales:', { visible: visibleValue, destacado: destacadoValue });

      // LOG ESPECÍFICO PARA CATEGORÍA
      console.log('🏷️ CATEGORÍA - Análisis detallado:', {
        categoria_recibida: req.body.categoria,
        categoria_procesada: categoria,
        categoria_final: categoria || noticia.categoria,
        categoria_actual_bd: noticia.categoria
      });

      const parametros = [
        titulo || noticia.titulo,
        slugFinal,
        contenido || noticia.contenido,
        resumen !== undefined ? resumen : noticia.resumen,
        fecha_publicacion || noticia.fecha_publicacion,
        autor || noticia.autor,
        categoria || noticia.categoria, // ✅ EXPLÍCITO: mantener categoria actual si no se envía nueva
        visibleValue,
        destacadoValue,
        id
      ];

      console.log('� Ejecutando query:');
      console.log(query);
      console.log('�📝 Parámetros:', parametros);

      const result = await execute(query, parametros);
      console.log(`✅ Filas afectadas: ${result.affectedRows}`);
      
      if (result.affectedRows === 0) {
        console.log('⚠️ No se actualizó ninguna fila - verificando ID...');
        return res.status(404).json({
          error: 'No se pudo actualizar la noticia - ID no encontrado'
        });
      }
      
      console.log('✅ Noticia actualizada correctamente');

      // VALIDAR Y PROCESAR ARCHIVOS SUBIDOS ANTES DEL ORDEN
      if (req.files) {
        console.log('📁 Procesando archivos subidos...');
        console.log('📁 Archivos recibidos durante actualización:');
        console.log('📁 COMPLETA ESTRUCTURA DE req.files:', JSON.stringify(Object.keys(req.files), null, 2));
        Object.keys(req.files).forEach(campo => {
          console.log(`  📂 Campo "${campo}": ${req.files[campo].length} archivos`);
          req.files[campo].forEach((archivo, index) => {
            console.log(`    📄 [${index}] ${archivo.originalname} -> ${archivo.filename}`);
          });
        });
        
        // Procesar archivos de imagen principal
        if (req.files.imagen && req.files.imagen.length > 0) {
          console.log('📸 Se subió imagen principal, ya procesada arriba');
        }
        
        // Procesar archivos de galería
        if (req.files.imagenes_galeria && req.files.imagenes_galeria.length > 0) {
          console.log('🖼️ Procesando imágenes de galería:', req.files.imagenes_galeria.length);
          
          for (let i = 0; i < req.files.imagenes_galeria.length; i++) {
            const archivo = req.files.imagenes_galeria[i];
            
            try {
              const imagenUrl = `/uploads/noticias/${archivo.filename}`;
              
              const queryInsertGaleria = `
                INSERT INTO noticias_imagenes (
                  noticia_id, imagen_url, imagen_alt, orden, es_principal, 
                  tipo_archivo, tipo_mime, tamaño_archivo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `;
              
              await execute(queryInsertGaleria, [
                id,
                imagenUrl,
                archivo.originalname || `Imagen galería ${i + 1}`,
                i + 1, // orden secuencial
                0, // es_principal = false para galería
                archivo.mimetype.startsWith('video/') ? 'video' : 'imagen',
                archivo.mimetype,
                archivo.size
              ]);
              
              console.log(`✅ Imagen galería ${i + 1} guardada:`, archivo.filename);
              
            } catch (error) {
              console.error(`❌ Error guardando imagen galería ${i + 1}:`, error);
            }
          }
        }
      } else {
        console.log('📁 NO se recibieron archivos en la actualización');
        console.log('🔍 Verificando orden_imagenes para imágenes no existentes...');
        
        if (req.body.orden_imagenes) {
          try {
            const ordenImagenes = JSON.parse(req.body.orden_imagenes);
            const imagenesNoExistentes = ordenImagenes.filter(img => !img.esExistente);
            if (imagenesNoExistentes.length > 0) {
              console.log('⚠️ PROBLEMA: Se enviaron imágenes nuevas en orden_imagenes pero NO se recibieron archivos:');
              imagenesNoExistentes.forEach((img, i) => {
                console.log(`  🚫 [${i}] ${img.nombre} - esperada pero no encontrada en req.files`);
              });
            }
          } catch (e) {
            console.log('❌ Error parseando orden_imagenes para debug:', e.message);
          }
        }
      }

      // PROCESAR ORDEN DE IMÁGENES si se envió (CORREGIDO)
      if (req.body.orden_imagenes) {
        try {
          const ordenImagenes = JSON.parse(req.body.orden_imagenes);
          console.log('🔄 Procesando orden de imágenes:', ordenImagenes);

          for (let i = 0; i < ordenImagenes.length; i++) {
            const item = ordenImagenes[i];
            console.log(`📋 Procesando item ${i}:`, item);
            
            // Si es una imagen existente, actualizar su orden
            if (item.esExistente && item.id_imagen) {
              console.log(`🔄 Actualizando orden de imagen existente ID: ${item.id_imagen}`);
              await execute(
                'UPDATE noticias_imagenes SET orden = ?, es_principal = ? WHERE id_imagen = ? AND noticia_id = ?',
                [item.orden, item.esPrincipal ? 1 : 0, item.id_imagen, id]
              );
            }
            // Si es una imagen nueva y tenemos archivos subidos
            else if (!item.esExistente && req.files) {
              console.log(`📸 Procesando imagen nueva: ${item.nombre}`);
              
              // Buscar el archivo correspondiente en TODOS los campos posibles
              let archivoEncontrado = null;
              
              // Lista de todos los campos posibles donde pueden venir archivos
              const camposArchivos = ['imagen', 'imagenes_galeria', 'archivos', 'imagenes', 'files'];
              
              console.log(`🔍 Buscando archivo "${item.nombre}" en campos:`, camposArchivos);
              
              for (const campo of camposArchivos) {
                if (req.files[campo] && req.files[campo].length > 0) {
                  console.log(`  🔍 Buscando en campo "${campo}" (${req.files[campo].length} archivos)`);
                  archivoEncontrado = req.files[campo].find(f => {
                    const coincideOriginal = f.originalname === item.nombre;
                    const coincideFilename = f.filename === item.nombre;
                    const coincideBase = f.originalname === item.nombre.split('.')[0] + '.' + f.originalname.split('.').pop();
                    
                    console.log(`    📄 ${f.originalname} -> ${f.filename}: ${coincideOriginal || coincideFilename || coincideBase ? '✅' : '❌'}`);
                    return coincideOriginal || coincideFilename || coincideBase;
                  });
                  
                  if (archivoEncontrado) {
                    console.log(`  ✅ ¡Archivo encontrado en campo "${campo}"!`);
                    break;
                  }
                }
              }
              
              if (archivoEncontrado) {
                console.log(`✅ Archivo encontrado para ${item.nombre}:`, archivoEncontrado.filename);
                
                const imagenUrl = `/uploads/noticias/${archivoEncontrado.filename}`;
                
                // Insertar en noticias_imagenes
                const queryInsertImagen = `
                  INSERT INTO noticias_imagenes (
                    noticia_id, imagen_url, imagen_alt, orden, es_principal, 
                    tipo_archivo, tipo_mime, tamaño_archivo
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                const resultado = await execute(queryInsertImagen, [
                  id,
                  imagenUrl,
                  archivoEncontrado.originalname || item.nombre,
                  item.orden,
                  item.esPrincipal ? 1 : 0,
                  archivoEncontrado.mimetype.startsWith('video/') ? 'video' : 'imagen',
                  archivoEncontrado.mimetype,
                  archivoEncontrado.size
                ]);
                
                console.log(`✅ Imagen insertada en BD con ID: ${resultado.insertId}`);
                
                // Si es imagen principal, actualizar el campo imagen_principal de la noticia
                if (item.esPrincipal) {
                  await execute(
                    'UPDATE noticias SET imagen_principal = ? WHERE id_noticia = ?',
                    [imagenUrl, id]
                  );
                  console.log(`🖼️ Imagen principal actualizada: ${imagenUrl}`);
                }
              } else {
                console.log(`⚠️ No se encontró archivo para: ${item.nombre}`);
              }
            }
          }
          console.log('✅ Orden de imágenes procesado completamente');
        } catch (error) {
          console.error('❌ Error procesando orden de imágenes:', error);
        }
      }

      // PROCESAR GALERÍA DE IMÁGENES ADICIONALES (si las hay)
      if (req.files && req.files.imagenes_galeria && req.files.imagenes_galeria.length > 0) {
        console.log('📸 Agregando nueva galería:', req.files.imagenes_galeria.length, 'archivos');

        // Obtener el último orden existente
        const ultimoOrden = await execute(
          'SELECT COALESCE(MAX(orden), 0) as max_orden FROM noticias_imagenes WHERE noticia_id = ?',
          [id]
        );

        let siguienteOrden = (ultimoOrden[0]?.max_orden || 0) + 1;

        for (let i = 0; i < req.files.imagenes_galeria.length; i++) {
          const archivo = req.files.imagenes_galeria[i];
          const imagenUrl = `/uploads/noticias/${archivo.filename}`;

          const queryImagen = `
          INSERT INTO noticias_imagenes (
            noticia_id, imagen_url, imagen_alt, orden, es_principal,
            tipo_archivo, tipo_mime, tamaño_archivo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

          await execute(queryImagen, [
            id,
            imagenUrl,
            archivo.originalname,
            siguienteOrden + i,
            0, // es_principal = false para galería
            archivo.mimetype.startsWith('video/') ? 'video' : 'imagen',
            archivo.mimetype,
            archivo.size
          ]);

          console.log(`📁 Archivo ${i + 1} de galería agregado:`, imagenUrl);
        }
      }

      // PROCESAR ARCHIVOS ADICIONALES (campo 'archivos')
      if (req.files && req.files.archivos && req.files.archivos.length > 0) {
        console.log('📦 Agregando archivos adicionales:', req.files.archivos.length);

        // Obtener el último orden existente
        const ultimoOrden = await execute(
          'SELECT COALESCE(MAX(orden), 0) as max_orden FROM noticias_imagenes WHERE noticia_id = ?',
          [id]
        );

        let siguienteOrden = (ultimoOrden[0]?.max_orden || 0) + 1;
        if (req.files.imagenes_galeria) siguienteOrden += req.files.imagenes_galeria.length;

        for (let i = 0; i < req.files.archivos.length; i++) {
          const archivo = req.files.archivos[i];
          const archivoUrl = `/uploads/noticias/${archivo.filename}`;

          const queryArchivo = `
          INSERT INTO noticias_imagenes (
            noticia_id, imagen_url, imagen_alt, orden, es_principal,
            tipo_archivo, tipo_mime, tamaño_archivo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

          await execute(queryArchivo, [
            id,
            archivoUrl,
            archivo.originalname,
            siguienteOrden + i,
            0, // es_principal = false
            archivo.mimetype.startsWith('video/') ? 'video' : 'imagen',
            archivo.mimetype,
            archivo.size
          ]);

          console.log(`📎 Archivo adicional ${i + 1} agregado:`, archivoUrl);
        }
      }

      // Obtener noticia actualizada
      const noticiaActualizada = await execute(
        'SELECT * FROM noticias WHERE id_noticia = ?',
        [id]
      );

      const totalArchivosNuevos = (req.files?.imagen?.length || 0) +
        (req.files?.imagenes_galeria?.length || 0) +
        (req.files?.archivos?.length || 0);

      console.log('✅ Noticia actualizada exitosamente');

      res.json({
        success: true,
        message: 'Noticia actualizada exitosamente',
        noticia: noticiaActualizada[0],
        archivos_nuevos: totalArchivosNuevos
      });

    } catch (error) {
      console.error('❌ Error actualizando noticia:', error);
      
      // Logging detallado del error
      console.error('🔍 Stack trace completo:', error.stack);
      console.error('🔍 Datos enviados:', {
        body: req.body,
        files: req.files ? Object.keys(req.files) : 'sin archivos',
        params: req.params
      });
      
      res.status(500).json({
        error: 'Error actualizando la noticia',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // ==================== TOKENS ====================
  getTokens: async (req, res) => {
    try {
      const query = `
        SELECT *, 
               DATE_FORMAT(fecha_expiracion, '%Y-%m-%d %H:%i:%s') as fecha_expiracion_formatted,
               DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') as fecha_creacion_formatted
        FROM token_registro 
        ORDER BY fecha_creacion DESC
      `;

      const rows = await execute(query);
      res.json(rows);
    } catch (error) {
      console.error('Error obteniendo tokens:', error);
      res.status(500).json({ message: 'Error al obtener los tokens' });
    }
  },

  crearToken: async (req, res) => {
    try {
      console.log('🔄 Creando token (datos recibidos):', req.body);
      const { token, tipo_usuario, usos_maximos, fecha_expiracion } = req.body;

      // VALIDACIONES sin modificar el token
      if (!token || token.trim().length < 6) {
        return res.status(400).json({
          error: 'El token debe tener al menos 6 caracteres'
        });
      }

      // Verificar que no contenga espacios
      if (token.includes(' ')) {
        return res.status(400).json({
          error: 'El token no puede contener espacios'
        });
      }

      if (!tipo_usuario || !['estudiante', 'profesor'].includes(tipo_usuario)) {
        return res.status(400).json({
          error: 'Tipo de usuario inválido'
        });
      }

      if (!usos_maximos || usos_maximos < 1) {
        return res.status(400).json({
          error: 'Los usos máximos deben ser al menos 1'
        });
      }

      if (!fecha_expiracion) {
        return res.status(400).json({
          error: 'La fecha de expiración es requerida'
        });
      }

      // ✅ VERIFICAR: Que el token no existe ya
      const tokenExistente = await execute(
        'SELECT id FROM token_registro WHERE token = ?',
        [token.trim()]
      );

      if (tokenExistente.length > 0) {
        return res.status(400).json({
          error: 'Ya existe un token con ese valor'
        });
      }

      // ✅ CREAR TOKEN: Exactamente como viene, SIN MODIFICACIONES
      const tokenFinal = token.trim(); // Solo quitar espacios al inicio/final

      console.log('✅ Token que se guardará:', tokenFinal);

      const query = `
        INSERT INTO token_registro (
          token, tipo_usuario, usos_maximos, fecha_expiracion, activo, usos_actuales
        ) VALUES (?, ?, ?, ?, TRUE, 0)
      `;

      const result = await execute(query, [
        tokenFinal, // ✅ SIN HASHEAR, SIN ENCRIPTAR, TAL COMO VIENE
        tipo_usuario,
        parseInt(usos_maximos),
        fecha_expiracion
      ]);

      console.log('✅ Token creado con ID:', result.insertId);
      console.log('✅ Token guardado como:', tokenFinal);

      res.status(201).json({
        message: 'Token creado exitosamente',
        token: tokenFinal, // ✅ Devolver el token exacto
        id: result.insertId
      });

    } catch (error) {
      console.error('❌ Error creando token:', error);

      // ✅ Error de duplicado
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          error: 'Ya existe un token con ese valor'
        });
      }

      res.status(500).json({
        error: 'Error al crear el token',
        message: error.message
      });
    }
  },

  desactivarToken: async (req, res) => {
    try {
      const { id } = req.params;

      // ✅ CORRECCIÓN: Usar execute en lugar de db.execute
      const token = await execute(
        'SELECT * FROM token_registro WHERE id = ?',
        [id]
      );

      if (token.length === 0) {
        return res.status(404).json({ error: 'Token no encontrado' });
      }

      // Alternar el estado activo
      const nuevoEstado = !token[0].activo;

      await execute(
        'UPDATE token_registro SET activo = ? WHERE id = ?',
        [nuevoEstado, id]
      );

      res.json({
        message: `Token ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
        activo: nuevoEstado
      });
    } catch (error) {
      console.error('Error al cambiar estado del token:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  eliminarToken: async (req, res) => {
    try {
      const { id } = req.params;
      await execute('DELETE FROM token_registro WHERE id = ?', [id]);
      res.json({ message: 'Token eliminado exitosamente' });
    } catch (error) {
      console.error('Error eliminando token:', error);
      res.status(500).json({ message: 'Error al eliminar el token' });
    }
  },

  // ==================== REPORTES ====================
  generarReporte: async (req, res) => {
    try {
      const { tipo } = req.params;
      console.log(`🔄 Generando reporte: ${tipo}`);

      const { fechaInicio, fechaFin } = req.query;
      let query = '';
      let params = [];
      let datos = [];

      switch (tipo) {
        case 'estudiantes':
          query = `
            SELECT 
              e.rut,
              CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
              e.email,
              e.telefono,
              e.fecha_ingreso,
              e.estado,
              COUNT(DISTINCT a.id) as total_asignaciones,
              COUNT(DISTINCT ev.id) as total_evaluaciones,
              AVG(ev.calificacion) as promedio_evaluaciones
            FROM estudiantes e
            LEFT JOIN asignaciones a ON e.rut = a.estudiante_rut
            LEFT JOIN evaluaciones ev ON e.rut = ev.estudiante_rut
            GROUP BY e.rut
            ORDER BY e.apellidos, e.nombres
          `;
          datos = await execute(query, params);
          break;

        case 'profesores':
          query = `
            SELECT 
              p.rut,
              CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
              p.email,
              p.especialidad,
              p.anos_experiencia,
              p.fecha_ingreso,
              p.estado,
              COUNT(DISTINCT a.id) as estudiantes_asignados,
              COUNT(DISTINCT ev.id) as evaluaciones_realizadas
            FROM profesores p
            LEFT JOIN asignaciones a ON p.rut = a.profesor_rut
            LEFT JOIN evaluaciones ev ON p.rut = ev.profesor_rut
            GROUP BY p.rut
            ORDER BY p.apellidos, p.nombres
          `;
          datos = await execute(query, params);
          break;

        case 'instrumentos':
          query = `
            SELECT 
              i.nombre,
              i.tipo,
              i.marca,
              i.modelo,
              i.estado_fisico,
              i.disponible,
              i.ubicacion,
              i.valor_estimado,
              i.fecha_adquisicion,
              COUNT(pr.id) as total_prestamos
            FROM instrumentos i
            LEFT JOIN prestamos pr ON i.id = pr.instrumento_id
            GROUP BY i.id
            ORDER BY i.tipo, i.nombre
          `;
          datos = await execute(query, params);
          break;

        case 'asistencia':
          query = `
            SELECT 
              a.fecha_clase,
              CONCAT(e.nombres, ' ', e.apellidos) as estudiante,
              CONCAT(p.nombres, ' ', p.apellidos) as profesor,
              a.asistio as presente,
              a.llego_tarde,
              a.minutos_tardanza,
              a.observaciones
            FROM asistencia a
            JOIN estudiantes e ON a.estudiante_rut = e.rut
            JOIN profesores p ON a.profesor_rut = p.rut
          `;

          if (fechaInicio && fechaFin) {
            query += ' WHERE a.fecha_clase BETWEEN ? AND ?';
            params.push(fechaInicio, fechaFin);
          }

          query += ' ORDER BY a.fecha_clase DESC';
          datos = await execute(query, params);
          break;

        case 'evaluaciones':
          query = `
            SELECT 
              ev.fecha_evaluacion,
              ev.tipo,
              ev.titulo,
              CONCAT(e.nombres, ' ', e.apellidos) as estudiante,
              CONCAT(p.nombres, ' ', p.apellidos) as profesor,
              ev.calificacion,
              ev.observaciones
            FROM evaluaciones ev
            JOIN estudiantes e ON ev.estudiante_rut = e.rut
            JOIN profesores p ON ev.profesor_rut = p.rut
          `;

          if (fechaInicio && fechaFin) {
            query += ' WHERE ev.fecha_evaluacion BETWEEN ? AND ?';
            params.push(fechaInicio, fechaFin);
          }

          query += ' ORDER BY ev.fecha_evaluacion DESC';
          datos = await execute(query, params);
          break;

        case 'prestamos':
          query = `
            SELECT pr.fecha_prestamo, pr.fecha_devolucion_programada, pr.fecha_devolucion_real,
                   CONCAT(e.nombres, ' ', e.apellidos) as estudiante,
                   CONCAT(p.nombres, ' ', p.apellidos) as profesor,
                   i.nombre as instrumento, i.tipo, pr.estado, pr.observaciones_prestamo
            FROM prestamos pr
            LEFT JOIN estudiantes e ON pr.estudiante_rut = e.rut
            LEFT JOIN profesores p ON pr.profesor_rut = p.rut
            JOIN instrumentos i ON pr.instrumento_id = i.id
          `;

          if (fechaInicio && fechaFin) {
            query += ' WHERE pr.fecha_prestamo BETWEEN ? AND ?';
            params.push(fechaInicio, fechaFin);
          }

          query += ' ORDER BY pr.fecha_prestamo DESC';
          datos = await execute(query, params);
          break;

        default:
          return res.status(400).json({ error: 'Tipo de reporte no válido' });
      }

      console.log(`✅ Reporte ${tipo} generado con ${datos.length} registros`);
      res.json(datos);

    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      res.status(500).json({ error: 'Error al generar el reporte' });
    }
  },

  // ==================== AUXILIARES ====================
  getRepertorio: async (req, res) => {
    try {
      const query = `
        SELECT id, titulo, compositor, nivel, genero
        FROM repertorio 
        ORDER BY titulo
      `;
      const rows = await execute(query);
      res.json(rows);
    } catch (error) {
      console.error('Error obteniendo repertorio:', error);
      res.status(500).json({ message: 'Error al obtener el repertorio' });
    }
  },

  getAsignaciones: async (req, res) => {
    try {
      const query = `
        SELECT a.id, a.profesor_rut, a.estudiante_rut, a.instrumento, 
               a.fecha_asignacion, a.estado,
               CONCAT(p.nombres, ' ', p.apellidos) as profesor_nombre,
               CONCAT(e.nombres, ' ', e.apellidos) as estudiante_nombre
        FROM asignaciones a
        LEFT JOIN profesores p ON a.profesor_rut = p.rut
        LEFT JOIN estudiantes e ON a.estudiante_rut = e.rut
        ORDER BY a.fecha_asignacion DESC
      `;

      const rows = await execute(query);
      res.json(rows);
    } catch (error) {
      console.error('Error obteniendo asignaciones:', error);
      res.status(500).json({ message: 'Error al obtener las asignaciones' });
    }
  },

  crearAsignacion: async (req, res) => {
    try {
      const { profesor_rut, estudiante_rut, instrumento, estado } = req.body;

      const query = `
        INSERT INTO asignaciones (profesor_rut, estudiante_rut, instrumento, fecha_asignacion, estado)
        VALUES (?, ?, ?, CURDATE(), ?)
      `;

      await execute(query, [profesor_rut, estudiante_rut, instrumento, estado || 'activa']);
      res.status(201).json({ message: 'Asignación creada exitosamente' });
    } catch (error) {
      console.error('Error creando asignación:', error);
      res.status(500).json({ message: 'Error al crear la asignación' });
    }
  },

  actualizarAsignacion: async (req, res) => {
    try {
      const { id } = req.params;
      const { profesor_rut, estudiante_rut, instrumento, estado } = req.body;

      const query = `
        UPDATE asignaciones 
        SET profesor_rut = ?, estudiante_rut = ?, instrumento = ?, estado = ?
        WHERE id = ?
      `;

      await execute(query, [profesor_rut, estudiante_rut, instrumento, estado, id]);
      res.json({ message: 'Asignación actualizada exitosamente' });
    } catch (error) {
      console.error('Error actualizando asignación:', error);
      res.status(500).json({ message: 'Error al actualizar la asignación' });
    }
  },

  eliminarAsignacion: async (req, res) => {
    try {
      const { id } = req.params;
      await execute('DELETE FROM asignaciones WHERE id = ?', [id]);
      res.json({ message: 'Asignación eliminada exitosamente' });
    } catch (error) {
      console.error('Error eliminando asignación:', error);
      res.status(500).json({ message: 'Error al eliminar la asignación' });
    }
  },

  // ==================== VISIBILIDAD ====================
  toggleVisibilidadEvento: async (req, res) => {
    try {
      console.log('🔄 Cambiando visibilidad evento ID:', req.params.id);
      const { id } = req.params;

      const result = await execute('UPDATE eventos SET visible = NOT visible WHERE id_evento = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Evento no encontrado' });
      }

      console.log('✅ Visibilidad del evento actualizada');
      res.json({ message: 'Visibilidad actualizada exitosamente' });
    } catch (error) {
      console.error('❌ Error cambiando visibilidad:', error);
      res.status(500).json({
        message: 'Error al cambiar visibilidad',
        error: error.message
      });
    }
  },

  toggleVisibilidadNoticia: async (req, res) => {
    try {
      console.log('🔄 Cambiando visibilidad noticia ID:', req.params.id);
      const { id } = req.params;

      const result = await execute('UPDATE noticias SET visible = NOT visible WHERE id_noticia = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Noticia no encontrada' });
      }

      console.log('✅ Visibilidad de la noticia actualizada');
      res.json({ message: 'Visibilidad actualizada exitosamente' });
    } catch (error) {
      console.error('❌ Error cambiando visibilidad:', error);
      res.status(500).json({ message: 'Error al cambiar visibilidad', error: error.message });
    }
  },

  // ==================== USUARIOS ====================
  crearUsuarioAdmin: async (req, res) => {
    try {
      const { username, email, password_hash, userType } = req.body;

      const query = `
        INSERT INTO usuarios (username, email, password_hash, userType) 
        VALUES (?, ?, ?, ?)
      `;

      const result = await execute(query, [username, email, password_hash, userType]);

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        id: result.insertId
      });
    } catch (error) {
      console.error('Error creando usuario:', error);
      res.status(500).json({ message: 'Error al crear el usuario' });
    }
  },

  // ==================== NOTICIAS ====================
  async actualizarNoticia(req, res) {
    try {
      console.log('📝 Actualizando noticia ID:', req.params.id);
      console.log('📋 Datos recibidos:', req.body);
      console.log('📁 Archivos recibidos:', req.files);

      const noticiaId = req.params.id;
      const {
        titulo,
        contenido,
        resumen = '',
        autor = 'Administrador',
        categoria = 'General',
        visible,
        destacado,
        fecha_publicacion
      } = req.body;

      console.log('🔍 Valores booleanos recibidos:', {
        visible: { valor: visible, tipo: typeof visible },
        destacado: { valor: destacado, tipo: typeof destacado }
      });

      // FUNCIÓN HELPER PARA CONVERTIR BOOLEANOS
      const toBoolean = (value) => {
        console.log(`🔧 Convirtiendo "${value}" (${typeof value})`);
        if (value === '1' || value === 'true' || value === true || value === 1) {
          console.log('  ✅ Resultado: true');
          return true;
        }
        if (value === '0' || value === 'false' || value === false || value === 0) {
          console.log('  ✅ Resultado: false');
          return false;
        }
        console.log('  ⚠️ Valor desconocido, usando false por defecto');
        return false;
      };

      const visibleFinal = visible !== undefined ? toBoolean(visible) : true;
      const destacadoFinal = destacado !== undefined ? toBoolean(destacado) : false;

      console.log('🔧 Valores finales:', {
        visible: visibleFinal,
        destacado: destacadoFinal
      });

      // VALIDACIONES BÁSICAS
      if (!titulo || !contenido) {
        return res.status(400).json({
          error: 'Título y contenido son obligatorios'
        });
      }

      // GENERAR NUEVO SLUG
      const slug = titulo
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      // ACTUALIZAR NOTICIA EN BD
      const queryActualizar = `
        UPDATE noticias SET 
          titulo = ?, 
          slug = ?, 
          contenido = ?, 
          resumen = ?, 
          autor = ?, 
          categoria = ?, 
          visible = ?, 
          destacado = ?,
          fecha_publicacion = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_noticia = ?
      `;

      const fechaPublicacion = fecha_publicacion || new Date().toISOString().split('T')[0];

      const resultado = await execute(queryActualizar, [
        titulo,
        slug,
        contenido,
        resumen,
        autor,
        categoria,
        visibleFinal,
        destacadoFinal,
        fechaPublicacion,
        noticiaId
      ]);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          error: 'Noticia no encontrada'
        });
      }

      console.log('✅ Noticia actualizada correctamente');

      // OBTENER NOTICIA ACTUALIZADA
      const queryObtener = `
        SELECT id_noticia, titulo, slug, contenido, resumen, 
               fecha_publicacion, autor, categoria, imagen_principal,
               visible, destacado, fecha_creacion, fecha_actualizacion
        FROM noticias 
        WHERE id_noticia = ?
      `;

      const noticiaActualizada = await execute(queryObtener, [noticiaId]);

      // INSERTAR NUEVAS IMÁGENES DE GALERÍA EN LA TABLA noticias_imagenes
      if (req.files && req.files.imagenes_galeria && req.files.imagenes_galeria.length > 0) {
        console.log('🖼️ Insertando nuevas imágenes de galería en la BD:', req.files.imagenes_galeria.length);
        for (let i = 0; i < req.files.imagenes_galeria.length; i++) {
          const archivo = req.files.imagenes_galeria[i];
          const imagenUrl = `/uploads/noticias/${archivo.filename}`;
          await execute(
            `INSERT INTO noticias_imagenes 
              (noticia_id, imagen_url, imagen_alt, orden, es_principal, tipo_archivo, tipo_mime, tamaño_archivo)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              noticiaId,
              imagenUrl,
              archivo.originalname,
              i, // orden
              0, // es_principal
              archivo.mimetype.startsWith('video/') ? 'video' : 'imagen',
              archivo.mimetype,
              archivo.size
            ]
          );
          console.log(`✅ Imagen de galería insertada: ${archivo.originalname}`);
        }
      }

      res.json({
        message: 'Noticia actualizada exitosamente',
        noticia: noticiaActualizada[0]
      });

    } catch (error) {
      console.error('❌ Error actualizando noticia:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  },

  // ✅ NUEVO MÉTODO para obtener imágenes de una noticia
  getImagenesNoticia: async (req, res) => {
    try {
      const noticiaId = req.params.id; // El ID viene de la URL /noticias/:id/imagenes
      console.log('🔍 AdminController - Obteniendo imágenes para noticia ID:', noticiaId);

      if (!noticiaId || isNaN(noticiaId)) {
        return res.status(400).json({
          error: 'ID de noticia inválido',
          received: noticiaId
        });
      }

      // ✅ CONSULTA DIRECTA EN LUGAR DE LLAMAR A OTRO CONTROLADOR
      const query = `
        SELECT 
          id_imagen,
          noticia_id,
          imagen_url,
          imagen_alt,
          orden,
          es_principal,
          tipo_archivo,
          tipo_mime,
          tamaño_archivo,
          fecha_subida
        FROM noticias_imagenes 
        WHERE noticia_id = ? 
        ORDER BY orden ASC, es_principal DESC, fecha_subida ASC
      `;

      const imagenes = await execute(query, [noticiaId]);

      console.log(`📸 Encontradas ${imagenes.length} imágenes para noticia ${noticiaId}`);

      if (imagenes.length > 0) {
        imagenes.forEach((img, index) => {
          console.log(`  ${index + 1}. ID: ${img.id_imagen}, Tipo: ${img.tipo_archivo || 'imagen'}, URL: ${img.imagen_url}`);
        });
      }

      res.json({
        success: true,
        imagenes: imagenes,
        total: imagenes.length
      });

    } catch (error) {
      console.error('❌ Error obteniendo imágenes de noticia:', error);
      res.status(500).json({
        error: 'Error obteniendo imágenes de la noticia',
        details: error.message
      });
    }
  },

  // ✅ AGREGAR: Método para cambiar imagen principal
  cambiarImagenPrincipal: async (req, res) => {
    try {
      const { id } = req.params;
      const { imagen_id } = req.body;

      console.log('⭐ Cambiando imagen principal:', { noticia_id: id, imagen_id });

      // Verificar que la imagen existe y pertenece a la noticia
      const imagenInfo = await execute(
        'SELECT * FROM noticias_imagenes WHERE id_imagen = ? AND noticia_id = ?',
        [imagen_id, id]
      );

      if (imagenInfo.length === 0) {
        return res.status(404).json({
          error: 'Imagen no encontrada o no pertenece a esta noticia'
        });
      }

      const imagen = imagenInfo[0];

      // Quitar principal de todas las imágenes de esta noticia
      await execute(
        'UPDATE noticias_imagenes SET es_principal = 0 WHERE noticia_id = ?',
        [id]
      );

      // Establecer nueva imagen principal
      await execute(
        'UPDATE noticias_imagenes SET es_principal = 1 WHERE id_imagen = ?',
        [imagen_id]
      );

      // Actualizar imagen_principal en tabla noticias
      await execute(
        'UPDATE noticias SET imagen_principal = ? WHERE id_noticia = ?',
        [imagen.imagen_url, id]
      );

      console.log('✅ Imagen principal actualizada correctamente');

      res.json({
        success: true,
        message: 'Imagen principal actualizada correctamente',
        nueva_imagen_principal: imagen.imagen_url
      });

    } catch (error) {
      console.error('❌ Error cambiando imagen principal:', error);
      res.status(500).json({
        error: 'Error cambiando imagen principal',
        details: error.message
      });
    }
  },

  // ✅ NUEVO: Método para quitar imagen principal (toggle)
  quitarImagenPrincipal: async (req, res) => {
    try {
      const { id } = req.params;

      console.log('⭐ Quitando imagen principal de noticia:', id);

      // Quitar principal de todas las imágenes de esta noticia
      await execute(
        'UPDATE noticias_imagenes SET es_principal = 0 WHERE noticia_id = ?',
        [id]
      );

      // Limpiar imagen_principal en tabla noticias
      await execute(
        'UPDATE noticias SET imagen_principal = NULL WHERE id_noticia = ?',
        [id]
      );

      console.log('✅ Imagen principal removida correctamente');

      res.json({
        success: true,
        message: 'Imagen principal removida correctamente'
      });

    } catch (error) {
      console.error('❌ Error quitando imagen principal:', error);
      res.status(500).json({
        error: 'Error quitando imagen principal',
        details: error.message
      });
    }
  },

  // ✅ AGREGAR: Método para eliminar noticia con limpieza de archivos
  eliminarNoticia: async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log('🗑️ Eliminando noticia:', id);

      // Verificar que la noticia existe
      const noticiaExistente = await execute(
        'SELECT * FROM noticias WHERE id_noticia = ?',
        [id]
      );

      if (noticiaExistente.length === 0) {
        return res.status(404).json({
          error: 'Noticia no encontrada'
        });
      }

      // Obtener todas las imágenes asociadas antes de eliminar
      const imagenes = await execute(
        'SELECT * FROM noticias_imagenes WHERE noticia_id = ?',
        [id]
      );

      console.log(`📸 Encontradas ${imagenes.length} imágenes para eliminar`);

      // Eliminar archivos físicos de las imágenes
      const fs = require('fs');
      const path = require('path');
      
      for (const imagen of imagenes) {
        try {
          if (imagen.imagen_url && !imagen.imagen_url.startsWith('http')) {
            // Construir ruta correcta: server/uploads/noticias/archivo.jpg
            const rutaArchivo = path.join(__dirname, '..', imagen.imagen_url.replace(/^\//, ''));
            console.log('🔍 Intentando eliminar archivo en:', rutaArchivo);
            
            if (fs.existsSync(rutaArchivo)) {
              fs.unlinkSync(rutaArchivo);
              console.log('✅ Archivo físico eliminado:', rutaArchivo);
            } else {
              console.log('⚠️ Archivo no encontrado:', rutaArchivo);
            }
          }
        } catch (errorArchivo) {
          console.log('❌ Error eliminando archivo físico:', imagen.imagen_url, errorArchivo.message);
        }
      }

      // Eliminar imágenes asociadas de la base de datos
      await execute(
        'DELETE FROM noticias_imagenes WHERE noticia_id = ?',
        [id]
      );

      // Eliminar la noticia
      await execute(
        'DELETE FROM noticias WHERE id_noticia = ?',
        [id]
      );

      console.log('✅ Noticia eliminada correctamente con sus archivos');

      res.json({
        success: true,
        message: 'Noticia eliminada exitosamente con sus archivos asociados'
      });

    } catch (error) {
      console.error('❌ Error eliminando noticia:', error);
      res.status(500).json({
        error: 'Error eliminando la noticia',
        details: error.message
      });
    }
  },

  // ✅ AGREGAR: Método para eliminar imagen específica con limpieza de archivos
  eliminarImagenNoticia: async (req, res) => {
    try {
      const { imagenId } = req.params;
      
      console.log('🗑️ Eliminando imagen:', imagenId);

      // Verificar que la imagen existe
      const imagenInfo = await execute(
        'SELECT * FROM noticias_imagenes WHERE id_imagen = ?',
        [imagenId]
      );

      if (imagenInfo.length === 0) {
        return res.status(404).json({ 
          error: 'Imagen no encontrada' 
        });
      }

      const imagen = imagenInfo[0];
      console.log('📸 Eliminando imagen:', imagen.imagen_url);

      // Eliminar archivo físico si existe
      const fs = require('fs');
      const path = require('path');
      
      let archivoEliminado = false;
      
      try {
        if (imagen.imagen_url && !imagen.imagen_url.startsWith('http')) {
          // Construir ruta correcta: server/uploads/noticias/archivo.jpg
          const rutaArchivo = path.join(__dirname, '..', imagen.imagen_url.replace(/^\//, ''));
          console.log('� Intentando eliminar archivo en:', rutaArchivo);
          
          if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
            archivoEliminado = true;
            console.log('✅ Archivo físico eliminado correctamente:', rutaArchivo);
          } else {
            console.log('⚠️ Archivo no encontrado en el sistema:', rutaArchivo);
          }
        } else {
          console.log('⚠️ URL externa o inválida, no se elimina archivo físico:', imagen.imagen_url);
        }
      } catch (errorArchivo) {
        console.log('❌ Error eliminando archivo físico:', errorArchivo.message);
      }

      // Eliminar registro de la base de datos
      await execute(
        'DELETE FROM noticias_imagenes WHERE id_imagen = ?',
        [imagenId]
      );

      console.log('✅ Imagen eliminada correctamente de la base de datos');

      res.json({
        success: true,
        message: 'Imagen eliminada exitosamente',
        archivoEliminado: archivoEliminado,
        rutaEliminada: imagen.imagen_url
      });

    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      res.status(500).json({
        error: 'Error eliminando la imagen',
        details: error.message
      });
    }
  }
};

module.exports = adminController;