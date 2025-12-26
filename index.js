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

// Función para obtener todas las aulas
async function obtenerAulas() {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    
    // Formatear los datos
    const aulas = response.results.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        nombre: props['Nombre del aula']?.title[0]?.text?.content || 'Sin nombre',
        edificio: props['Edificio']?.select?.name || 'N/A',
        planta: props['Planta']?.select?.name || 'N/A',
        capacidad: props['Capacidad']?.number || 0,
        estado: props['Estado']?.select?.name || 'Desconocido'
      };
    });
    
    return aulas;
  } catch (error) {
    console.error('Error al obtener aulas:', error);
    throw error;
  }
}

// Ruta principal - API JSON
app.get('/api/aulas', async (req, res) => {
  try {
    const aulas = await obtenerAulas();
    res.json({
      success: true,
      total: aulas.length,
      data: aulas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta para visualización HTML simple
app.get('/', async (req, res) => {
  try {
    const aulas = await obtenerAulas();
    
    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gestión de Aulas LANAU112</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          h1 {
            color: #333;
            text-align: center;
          }
          .aulas-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
          }
          .aula-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
          }
          .aula-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .aula-nombre {
            font-size: 1.3em;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .aula-info {
            margin: 8px 0;
            color: #555;
          }
          .estado {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            margin-top: 10px;
          }
          .disponible { background: #d1fae5; color: #065f46; }
          .mantenimiento { background: #fed7aa; color: #92400e; }
          .ocupada { background: #fecaca; color: #991b1b; }
        </style>
      </head>
      <body>
        <h1>🏫 Gestión de Aulas LANAU112</h1>
        <p style="text-align: center; color: #666;">Total de aulas: ${aulas.length}</p>
        <div class="aulas-grid">
    `;
    
    aulas.forEach(aula => {
      const estadoClass = aula.estado.toLowerCase().replace(' ', '-');
      html += `
        <div class="aula-card">
          <div class="aula-nombre">${aula.nombre}</div>
          <div class="aula-info">🏢 ${aula.edificio}</div>
          <div class="aula-info">📍 ${aula.planta}</div>
          <div class="aula-info">👥 Capacidad: ${aula.capacidad} personas</div>
          <span class="estado ${estadoClass}">${aula.estado}</span>
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
  console.log(`📊 API disponible en http://localhost:${PORT}/api/aulas`);
});