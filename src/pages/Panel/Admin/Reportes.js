import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAlert } from '../../../components/providers/AlertProvider';
import './AdminPanel.css';

const Reportes = () => {
  // Hooks de alerta para usar shadcn/ui
  const { showSuccess, showError, showWarning } = useAlert();
  
  // Estados principales del componente
  const [reporteActual, setReporteActual] = useState(null);
  const [datosReporte, setDatosReporte] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipoReporte: '',
    estado: '',
    modulo: ''
  });

  const tiposReporte = [
    { value: 'estudiantes', label: 'Reporte de Estudiantes', icon: 'fas fa-user-graduate' },
    { value: 'profesores', label: 'Reporte de Profesores', icon: 'fas fa-chalkboard-teacher' },
    { value: 'instrumentos', label: 'Reporte de Instrumentos', icon: 'fas fa-guitar' },
    { value: 'asistencia', label: 'Reporte de Asistencia', icon: 'fas fa-calendar-check' },
    { value: 'evaluaciones', label: 'Reporte de Evaluaciones', icon: 'fas fa-chart-line' },
    { value: 'prestamos', label: 'Reporte de Préstamos', icon: 'fas fa-handshake' }
  ];

  // Formatear fechas para mostrar
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return fecha;
      
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Santiago'
      });
    } catch (error) {
      console.warn('Error formateando fecha:', fecha, error);
      return fecha;
    }
  };

  // Formatear horas para mostrar
  const formatearTiempo = (tiempo) => {
    if (!tiempo) return '';
    
    try {
      if (typeof tiempo === 'string' && tiempo.match(/^\d{2}:\d{2}$/)) {
        return tiempo;
      }
      
      const date = new Date(tiempo);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'America/Santiago'
        });
      }
      
      return tiempo;
    } catch (error) {
      console.warn('Error formateando tiempo:', tiempo, error);
      return tiempo;
    }
  };

  // Verificar si una columna es de fecha
  const esFecha = (header, valor) => {
    const columnasFecha = [
      'fecha', 'fecha_nacimiento', 'fecha_ingreso', 'fecha_evaluacion',
      'fecha_clase', 'fecha_prestamo', 'fecha_devolucion_programada',
      'fecha_devolucion_real', 'fecha_adquisicion', 'fecha_publicacion',
      'fecha_expiracion', 'fecha_creacion'
    ];
    
    return columnasFecha.some(col => header.toLowerCase().includes(col));
  };

  // Verificar si una columna es de hora
  const esHora = (header) => {
    const columnasHora = ['hora', 'hora_inicio', 'hora_fin'];
    return columnasHora.some(col => header.toLowerCase().includes(col));
  };

  // Formatear valores según su tipo
  const formatearValor = (header, valor) => {
    if (!valor) return '';
    
    if (esFecha(header, valor)) {
      return formatearFecha(valor);
    }
    
    if (esHora(header)) {
      return formatearTiempo(valor);
    }
    
    if (typeof valor === 'boolean') {
      return valor ? 'Sí' : 'No';
    }
    
    if (typeof valor === 'number' && valor % 1 !== 0) {
      return valor.toFixed(1);
    }
    
    return valor.toString();
  };

  // Generar reporte desde la API
  const generarReporte = async (tipoReporte) => {
    setLoading(true);
    setReporteActual(tipoReporte);
    setError('');
    setDatosReporte([]);
    
    try {
      console.log(`🔄 Generando reporte: ${tipoReporte}`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      let url = `http://localhost:5000/api/admin/reportes/${tipoReporte}`;
      
      // Agregar filtros de fecha para reportes específicos
      if ((tipoReporte === 'asistencia' || tipoReporte === 'evaluaciones') && 
          filtros.fechaInicio && filtros.fechaFin) {
        const params = new URLSearchParams({
          fechaInicio: filtros.fechaInicio,
          fechaFin: filtros.fechaFin
        });
        url += `?${params}`;
      }
      
      console.log(`📡 Realizando petición a: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Respuesta no JSON:', text.substring(0, 200));
        throw new Error('El servidor devolvió una respuesta no válida');
      }

      const data = await response.json();
      console.log(`📦 Datos recibidos:`, data);

      if (Array.isArray(data)) {
        setDatosReporte(data);
        console.log(`✅ Reporte generado con ${data.length} registros`);
      } else if (data.success === false) {
        throw new Error(data.error || data.message || 'Error desconocido del servidor');
      } else {
        setDatosReporte(Array.isArray(data) ? data : []);
      }
      
    } catch (error) {
      console.error('💥 Error al generar reporte:', error);
      setError(`Error al generar reporte: ${error.message}`);
      setDatosReporte([]);
    } finally {
      setLoading(false);
    }
  };

  // Exportar reporte a PDF
  const exportarPDF = async () => {
    if (!datosReporte.length) {
      showWarning('Sin Datos', 'No hay datos para exportar');
      return;
    }

    try {
      console.log('📄 Iniciando generación de PDF...');
      
      if (!jsPDF) {
        throw new Error('jsPDF no está disponible. Verifica la instalación.');
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFont('helvetica', 'normal');

      // Encabezado del documento
      const tituloReporte = tiposReporte.find(t => t.value === reporteActual)?.label || 'Reporte';
      doc.setFontSize(16);
      doc.setTextColor(26, 35, 126);
      doc.text(tituloReporte, 20, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const fechaActual = new Date().toLocaleDateString('es-CL');
      doc.text(`Orquesta de Cobquecura - Generado el ${fechaActual}`, 20, 30);
      doc.text(`Total de registros: ${datosReporte.length}`, 20, 37);

      // Preparar datos para la tabla
      const headers = Object.keys(datosReporte[0]);
      const tableHeaders = headers.map(header => 
        header.replace(/_/g, ' ').toUpperCase()
      );

      const tableData = datosReporte.map((row, index) => {
        return headers.map(header => {
          try {
            let value = formatearValor(header, row[header]);
            value = String(value || '');
            return value.length > 25 ? value.substring(0, 22) + '...' : value;
          } catch (error) {
            console.warn(`⚠️ Error formateando valor en ${header}:`, row[header], error);
            return String(row[header] || '');
          }
        });
      });

      // Generar tabla
      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 45,
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          overflow: 'linebreak',
          font: 'helvetica',
          textColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [26, 35, 126],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { top: 45, left: 10, right: 10, bottom: 20 },
        tableWidth: 'auto',
        theme: 'striped',
        didDrawPage: function(data) {
          try {
            const str = `Página ${data.pageNumber}`;
            doc.setFontSize(8);
            doc.setTextColor(128);
            doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
          } catch (error) {
            console.warn('⚠️ Error en pie de página:', error);
          }
        }
      });

      const fechaArchivo = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte_${reporteActual}_${fechaArchivo}.pdf`;

      // Intentar usar File System Access API primero
      if ('showSaveFilePicker' in window) {
        try {
          console.log('🆕 Usando File System Access API...');
          
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: nombreArchivo,
            types: [
              {
                description: 'Archivos PDF',
                accept: {
                  'application/pdf': ['.pdf'],
                },
              },
            ],
          });

          const writable = await fileHandle.createWritable();
          const pdfBlob = doc.output('blob');
          await writable.write(pdfBlob);
          await writable.close();

          console.log('✅ PDF guardado exitosamente usando File System Access API');
          showSuccess('Exportación Exitosa', 'PDF guardado exitosamente');
          return;

        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('ℹ️ Usuario canceló la selección de archivo');
            return;
          }
          console.warn('⚠️ Error con File System Access API, usando método fallback:', error);
        }
      }

      // Método fallback para navegadores que no soportan File System Access API
      console.log('📁 Usando método fallback para descarga...');
      
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      link.style.display = 'none';
      link.setAttribute('data-downloadurl', `application/pdf:${nombreArchivo}:${url}`);
      
      document.body.appendChild(link);
      
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      
      link.dispatchEvent(clickEvent);
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ PDF preparado para descarga');
      
    } catch (error) {
      console.error('❌ Error detallado al exportar PDF:', error);
      
      let mensajeError = 'Error desconocido al exportar PDF';
      
      if (error.message.includes('jsPDF')) {
        mensajeError = 'Error: jsPDF no está instalado correctamente. Ejecuta: npm install jspdf jspdf-autotable';
      } else if (error.message.includes('autoTable')) {
        mensajeError = 'Error: jspdf-autotable no está disponible. Verifica la instalación.';
      } else {
        mensajeError = `Error al generar PDF: ${error.message}`;
      }
      
      showError('Error de Exportación', mensajeError);
    }
  };

  // Exportar reporte a CSV
  const exportarCSV = async () => {
    if (!datosReporte.length) {
      showWarning('Sin Datos', 'No hay datos para exportar');
      return;
    }

    try {
      const headers = Object.keys(datosReporte[0]);
      const csvContent = [
        headers.join(','),
        ...datosReporte.map(row => 
          headers.map(header => {
            const value = formatearValor(header, row[header]) || '';
            const escapedValue = value.toString().replace(/"/g, '""');
            return escapedValue.includes(',') || escapedValue.includes('\n') 
              ? `"${escapedValue}"` 
              : escapedValue;
          }).join(',')
        )
      ].join('\n');

      const fechaArchivo = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte_${reporteActual}_${fechaArchivo}.csv`;

      // Intentar usar File System Access API primero
      if ('showSaveFilePicker' in window) {
        try {
          console.log('🆕 Usando File System Access API para CSV...');
          
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: nombreArchivo,
            types: [
              {
                description: 'Archivos CSV',
                accept: {
                  'text/csv': ['.csv'],
                },
              },
            ],
          });

          const writable = await fileHandle.createWritable();
          const BOM = '\uFEFF'; // Para caracteres especiales
          const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
          await writable.write(blob);
          await writable.close();

          console.log('✅ CSV guardado exitosamente usando File System Access API');
          showSuccess('Exportación Exitosa', 'CSV guardado exitosamente');
          return;

        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('ℹ️ Usuario canceló la selección de archivo CSV');
            return;
          }
          console.warn('⚠️ Error con File System Access API para CSV, usando método fallback:', error);
        }
      }

      // Método fallback
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', nombreArchivo);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ CSV exportado: ${nombreArchivo}`);
      
    } catch (error) {
      console.error('❌ Error al exportar CSV:', error);
      showError('Error de Exportación', 'Error al exportar el archivo CSV');
    }
  };

  // Renderizar tabla con los datos del reporte
  const renderTablaReporte = () => {
    if (!datosReporte.length) {
      return (
        <div className="alert alert-info">
          <i className="fas fa-info-circle"></i>
          No hay datos para mostrar en este reporte
        </div>
      );
    }

    const headers = Object.keys(datosReporte[0]);

    return (
      <div className="tabla-container">
        <div className="tabla-scroll">
          <table className="tabla-datos">
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>
                    {header.replace(/_/g, ' ').toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datosReporte.map((row, index) => (
                <tr key={index}>
                  {headers.map(header => (
                    <td key={header}>
                      {formatearValor(header, row[header])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleChangeFiltros = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      tipoReporte: '',
      estado: '',
      modulo: ''
    });
  };

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h2>Reportes y Estadísticas</h2>
        <div className="header-actions">
          <button 
            className="btn btn-success"
            onClick={() => exportarCSV()}
            disabled={!datosReporte || datosReporte.length === 0}
          >
            <i className="fas fa-file-csv"></i> Exportar CSV
          </button>
          <button 
            className="btn btn-danger ms-2"
            onClick={() => exportarPDF()}
            disabled={!datosReporte || datosReporte.length === 0}
          >
            <i className="fas fa-file-pdf"></i> Exportar PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Panel de configuración de filtros */}
      <div className="filtros-busqueda" style={{
        background: 'rgba(248, 249, 252, 0.8)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(92, 107, 192, 0.1)'
      }}>
        <h6 style={{marginBottom: '1rem', color: 'var(--azul-marino)'}}>Configurar Reporte</h6>
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">Tipo de Reporte</label>
            <select
              name="tipoReporte"
              className="form-select"
              value={filtros.tipoReporte}
              onChange={handleChangeFiltros}
            >
              <option value="">Seleccionar tipo</option>
              <option value="estudiantes">Estudiantes</option>
              <option value="profesores">Profesores</option>
              <option value="instrumentos">Instrumentos</option>
              <option value="prestamos">Préstamos</option>
              <option value="asistencia">Asistencia</option>
              <option value="evaluaciones">Evaluaciones</option>
              <option value="eventos">Eventos</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Fecha Inicio</label>
            <input
              type="date"
              name="fechaInicio"
              className="form-control"
              value={filtros.fechaInicio}
              onChange={handleChangeFiltros}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Fecha Fin</label>
            <input
              type="date"
              name="fechaFin"
              className="form-control"
              value={filtros.fechaFin}
              onChange={handleChangeFiltros}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Estado</label>
            <select
              name="estado"
              className="form-select"
              value={filtros.estado}
              onChange={handleChangeFiltros}
            >
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="pendiente">Pendientes</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Módulo</label>
            <select
              name="modulo"
              className="form-select"
              value={filtros.modulo}
              onChange={handleChangeFiltros}
            >
              <option value="">Todos los módulos</option>
              <option value="gestion">Gestión</option>
              <option value="academico">Académico</option>
              <option value="inventario">Inventario</option>
              <option value="eventos">Eventos</option>
            </select>
          </div>
        </div>
        <div className="filtros-actions" style={{marginTop: '1rem'}}>
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={limpiarFiltros}
          >
            <i className="fas fa-times"></i> Limpiar Filtros
          </button>
          <div className="ms-3 text-muted small">
            Selecciona un tipo de reporte haciendo clic en las tarjetas de abajo
          </div>
        </div>
      </div>

      {/* Tarjetas de tipos de reportes */}
      <div className="reportes-grid">
        {tiposReporte.map(tipo => (
          <div 
            key={tipo.value}
            className={`reporte-card ${reporteActual === tipo.value ? 'active' : ''} ${loading ? 'disabled' : ''}`}
            onClick={() => !loading && generarReporte(tipo.value)}
          >
            <div className="reporte-icon">
              <i className={tipo.icon}></i>
            </div>
            <div className="reporte-info">
              <h4>{tipo.label}</h4>
              <p>Generar reporte detallado</p>
            </div>
            {loading && reporteActual === tipo.value && (
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="loading-reporte">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Generando reporte...</span>
          </div>
          <p>Generando reporte de {tiposReporte.find(t => t.value === reporteActual)?.label}...</p>
        </div>
      )}

      {/* Resultados del reporte */}
      {reporteActual && !loading && !error && (
        <div className="reporte-resultados">
          <div className="reporte-header">
            <h3>
              <i className={tiposReporte.find(t => t.value === reporteActual)?.icon}></i>
              {tiposReporte.find(t => t.value === reporteActual)?.label}
            </h3>
            <div className="reporte-stats">
              <i className="fas fa-chart-bar"></i>
              Total de registros: {datosReporte.length}
            </div>
          </div>
          {renderTablaReporte()}
        </div>
      )}

      <style jsx>{`
        .export-buttons {
          display: flex;
          gap: 10px;
        }

        .export-buttons .btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 16px;
          border-radius: 5px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .export-buttons .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .reportes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .reporte-card {
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 15px;
          position: relative;
        }

        .reporte-card:hover:not(.disabled) {
          border-color: #1a237e;
          box-shadow: 0 4px 15px rgba(26, 35, 126, 0.1);
          transform: translateY(-2px);
        }

        .reporte-card.active {
          border-color: #1a237e;
          background: #f8f9fa;
          box-shadow: 0 4px 15px rgba(26, 35, 126, 0.15);
        }

        .reporte-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reporte-icon {
          font-size: 2.5rem;
          color: #1a237e;
          width: 60px;
          text-align: center;
        }

        .reporte-info h4 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 1.1rem;
        }

        .reporte-info p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .loading-spinner {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 1.2rem;
          color: #1a237e;
        }

        .loading-reporte {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .loading-reporte p {
          margin-top: 15px;
          color: #666;
        }

        .reporte-resultados {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .reporte-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e9ecef;
        }

        .reporte-header h3 {
          margin: 0;
          color: #1a237e;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .reporte-stats {
          background: #f8f9fa;
          padding: 10px 15px;
          border-radius: 5px;
          font-weight: 600;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tabla-scroll {
          max-height: 600px;
          overflow-y: auto;
          border: 1px solid #dee2e6;
          border-radius: 5px;
        }

        .filtros-busqueda {
          background: rgba(248, 249, 252, 0.8);
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(92, 107, 192, 0.1);
        }

        .filtros-busqueda h6 {
          margin-bottom: 1rem;
          color: var(--azul-marino);
        }

        .filtros-busqueda .form-label {
          font-weight: 600;
          color: #495057;
          margin-bottom: 5px;
          display: block;
        }

        .filtros-busqueda .form-select,
        .filtros-busqueda .form-control {
          border-radius: 8px;
          background: #fff;
          border: 1px solid #ced4da;
          height: 38px;
          padding: 0.375rem 0.75rem;
          font-size: 0.9rem;
          color: #495057;
        }

        .filtros-busqueda .form-select:focus,
        .filtros-busqueda .form-control:focus {
          border-color: #1a237e;
          box-shadow: 0 0 0 0.2rem rgba(26, 35, 126, 0.25);
        }

        .filtros-busqueda .btn {
          border-radius: 8px;
          padding: 0.375rem 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .filtros-busqueda .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default Reportes;