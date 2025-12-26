// Importar dependencias
const { Client } = require('@notionhq/client');
const express = require('express');
require('dotenv').config({ path: '.env.local' });

// Inicializar Notion client
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

// Inicializar Express
const app = express();
const PORT = 3000;

// Función para obtener todas las reservas
async function obtenerReservas() {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    
    // Formatear los datos
    const reservas = response.results.map(page => {
      const props = page.properties;
      
      // Extraer nombre del aula (relación)
      const aulaRelacion = props['Aula']?.relation?.[0]?.id || null;
      
      // Extraer fecha y hora
      const fecha = props['Fecha y hora']?.date || null;
      const fechaInicio = fecha?.start || 'Sin fecha';
      const fechaFin = fecha?.end || null;
      
      // Extraer profesor/responsable
      const profesor = props['Profesor/Responsable']?.people?.[0]?.name || 
                      props['Responsable']?.people?.[0]?.name || 
                      'Sin asignar';
      
      // Extraer otras propiedades
      const tipoReserva = props['Tipo de reserva']?.select?.name || 'N/A';
      const asignatura = props['Asignatura/Actividad']?.rich_text?.[0]?.plain_text || 
                        props['Actividad']?.rich_text?.[0]?.plain_text || 
                        'Sin asignatura';
      const estado = props['Estado']?.status?.name || 'Desconocido';
      const curso = props['Curso/Grupo']?.rich_text?.[0]?.plain_text || 
                   props['Grupo']?.rich_text?.[0]?.plain_text || 
                   '';
      
      return {
        id: page.id,
        aulaId: aulaRelacion,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        profesor: profesor,
        tipoReserva: tipoReserva,
        asignatura: asignatura,
        curso: curso,
        estado: estado
      };
    });
    
    return reservas;
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    throw error;
  }
}

// Ruta principal - API JSON
app.get('/api/reservas', async (req, res) => {
  try {
    const reservas = await obtenerReservas();
    res.json({
      success: true,
      total: reservas.length,
      data: reservas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta para visualización HTML
app.get('/', async (req, res) => {
  try {
    const reservas = await obtenerReservas();
    
    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reservas de Aulas LANAU112</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          h1 {
            color: #333;
            text-align: center;
          }
          .reservas-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 30px;
          }
          .reserva-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
            border-left: 4px solid #2563eb;
          }
          .reserva-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .reserva-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          .reserva-asignatura {
            font-size: 1.2em;
            font-weight: bold;
            color: #2563eb;
          }
          .reserva-info {
            margin: 8px 0;
            color: #555;
            font-size: 0.95em;
          }
          .reserva-info strong {
            color: #333;
          }
          .estado {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            margin-top: 10px;
          }
          .pendiente { background: #fef3c7; color: #92400e; }
          .confirmada { background: #d1fae5; color: #065f46; }
          .finalizada { background: #e5e7eb; color: #374151; }
          .cancelada { background: #fecaca; color: #991b1b; }
          .tipo-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            background: #dbeafe;
            color: #1e40af;
          }
          .fecha-destacada {
            background: #f0f9ff;
            padding: 10px;
            border-radius: 6px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <h1>📅 Reservas de Aulas LANAU112</h1>
        <p style="text-align: center; color: #666;">Total de reservas: ${reservas.length}</p>
        <div class="reservas-grid">
    `;
    
    reservas.forEach(reserva => {
      const estadoClass = reserva.estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const fechaFormateada = new Date(reserva.fechaInicio).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const fechaFinFormateada = reserva.fechaFin ? new Date(reserva.fechaFin).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : null;
      
      html += `
        <div class="reserva-card">
          <div class="reserva-header">
            <div class="reserva-asignatura">${reserva.asignatura}</div>
            <span class="tipo-badge">${reserva.tipoReserva}</span>
          </div>
          <div class="fecha-destacada">
            <div class="reserva-info"><strong>📅 Inicio:</strong> ${fechaFormateada}</div>
            ${fechaFinFormateada ? `<div class="reserva-info"><strong>🏁 Fin:</strong> ${fechaFinFormateada}</div>` : ''}
          </div>
          <div class="reserva-info"><strong>👨‍🏫 Profesor:</strong> ${reserva.profesor}</div>
          ${reserva.curso ? `<div class="reserva-info"><strong>🎓 Curso:</strong> ${reserva.curso}</div>` : ''}
          <div class="reserva-info"><strong>🚪 Aula ID:</strong> ${reserva.aulaId || 'Sin asignar'}</div>
          <span class="estado ${estadoClass}">${reserva.estado}</span>
        </div>
      `;
    });
    
    html += `
        </div>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    res.status(500).send(`<h1>Error: ${error.message}</h1>`);
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api/reservas`);
});