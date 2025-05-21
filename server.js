const express = require('express');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5002; // ✅ Cambio clave para Render

// Configuración CORS para tu dominio y desarrollo local
app.use(cors({
  origin: [
    'https://www.regpropiedadpvm.gob.ec', // Tu dominio oficial
    'http://localhost:3000'               // Para desarrollo
  ]
}));

// Middlewares (idénticos a tu versión)
app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta para rellenar el PDF de Gravamen (CÓDIGO ORIGINAL SIN CAMBIOS)
app.post('/generar-pdf', async (req, res) => {
  // Datos de facturación
  const { nombre, cedulaFacturacion, direccion, correo, telefono } = req.body;

  // Datos de certificación del inmueble
  const {
    apellidos,
    cedulaCertificacion,
    estadoCivil,
    lugarInmueble,
    libro,
    numeroInscripcion,
    fechaInscripcion,
    tomo,
    repertorio,
    fichaRegistral,
    otro,
    usoCertificacion,
    especifiqueUso,
    recepcionDocumento,
    correoRecepcion,
    cedulaSolicitante,
  } = req.body;

  // Validar campos requeridos
  if (
    !nombre ||
    !cedulaFacturacion ||
    !direccion ||
    !telefono ||
    !apellidos ||
    !cedulaCertificacion ||
    !lugarInmueble ||
    !usoCertificacion ||
    !especifiqueUso ||
    !recepcionDocumento ||
    (recepcionDocumento === 'Electrónico' && !correoRecepcion) ||
    !cedulaSolicitante
  ) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  try {
    // Ruta al archivo PDF existente
    const pdfPath = path.join(__dirname, 'pdfs', '2.pdf');

    // Verificar si el archivo PDF existe
    if (!fs.existsSync(pdfPath)) {
      console.error('El archivo PDF no se encontró en:', pdfPath);
      return res.status(404).json({ message: 'El archivo PDF no se encontró.' });
    }

    // Cargar el PDF existente
    const pdfBytes = fs.readFileSync(pdfPath);

    // Cargar el PDF con pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Obtener la primera página del PDF
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Rellenar el PDF con los datos de facturación
    firstPage.drawText(`${nombre}`, { x: 95, y: 700, size: 12 });
    firstPage.drawText(`${cedulaFacturacion}`, { x: 300, y: 670, size: 12 });
    firstPage.drawText(`${direccion}`, { x: 80, y: 650, size: 12 });
    firstPage.drawText(`${correo}`, { x: 135, y: 625, size: 12 });
    firstPage.drawText(`${telefono}`, { x: 440, y: 625, size: 12 });

    // Rellenar el PDF con los datos de certificación del inmueble
    firstPage.drawText(`${apellidos}`, { x: 95, y: 570, size: 12 });
    firstPage.drawText(`${cedulaCertificacion}`, { x: 390, y: 540, size: 12 });
    firstPage.drawText(`${estadoCivil}`, { x: 140, y: 525, size: 12 });
    firstPage.drawText(`${lugarInmueble}`, { x: 95, y: 510, size: 12 });
    firstPage.drawText(`${libro}`, { x: 150, y: 450, size: 12 });
    firstPage.drawText(`${numeroInscripcion}`, { x: 320, y: 450, size: 12 });
    firstPage.drawText(`${fechaInscripcion}`, { x: 473, y: 455, size: 12 });
    firstPage.drawText(`${tomo}`, { x: 150, y: 420, size: 12 });
    firstPage.drawText(`${repertorio}`, { x: 320, y: 420, size: 12 });
    firstPage.drawText(`${fichaRegistral}`, { x: 490, y: 420, size: 12 });
    firstPage.drawText(`${otro || 'N/A'}`, { x: 260, y: 395, size: 12 });

    // Marcar la opción seleccionada con una "X"
    const opciones = {
      'Tramites Judiciales': { x: 220, y: 296 },
      'Instituciones Bancarias': { x: 220, y: 260 },
      'Instituciones Publicas': { x: 220, y: 221 },
      'Otro': { x: 220, y: 180 },
    };

    if (opciones[usoCertificacion]) {
      firstPage.drawText('X', {
        x: opciones[usoCertificacion].x,
        y: opciones[usoCertificacion].y,
        size: 12,
      });
    }

    // Agregar el campo "Especifique"
    firstPage.drawText(`${especifiqueUso || 'N/A'}`, {
      x: 140,
      y: 150,
      size: 12,
    });

    // Rellenar el PDF con los datos de recepción del documento
    if (recepcionDocumento === 'Presencial') {
      firstPage.drawText('X', { x: 398, y: 308, size: 12 });
    } else if (recepcionDocumento === 'Electrónico') {
      firstPage.drawText('X', { x: 398, y: 280, size: 12 });
      firstPage.drawText(`${correoRecepcion}`, { x: 360, y: 260, size: 12 });
    }

    // Agregar Lugar y Fecha automáticamente
    const lugar = 'Pedro Vicente Maldonado';
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    firstPage.drawText(`${lugar}`, { x: 400, y: 225, size: 12 });
    firstPage.drawText(`${fechaActual}`, { x: 340, y: 210, size: 12 });

    // Agregar Cédula del Solicitante
    firstPage.drawText(`${cedulaSolicitante}`, { x: 400, y: 120, size: 12 });

    // Guardar el PDF modificado
    const modifiedPdfBytes = await pdfDoc.save();

    // Guardar el PDF modificado en un archivo temporal
    const tempFilePath = path.join(__dirname, 'temp.pdf');
    fs.writeFileSync(tempFilePath, modifiedPdfBytes);

    // Enviar el archivo temporal como respuesta
    res.download(tempFilePath, 'Formulario_Gravamen.pdf', (err) => {
      if (err) {
        console.error('Error al enviar el archivo:', err);
        res.status(500).json({ message: 'Error al descargar el PDF.' });
      }

      // Eliminar el archivo temporal después de enviarlo
      fs.unlinkSync(tempFilePath);
      console.log('Archivo temporal eliminado.');
    });
  } catch (error) {
    console.error('Error al rellenar el PDF:', error);
    res.status(500).json({ message: 'Error al generar el PDF' });
  }
});

// Ruta para rellenar el PDF de Búsqueda (CÓDIGO ORIGINAL SIN CAMBIOS)
app.post('/generar-pdf-busqueda', async (req, res) => {
  // Datos de facturación (compartidos con gravamen)
  const { nombre, cedulaFacturacion, direccion, correo, telefono } = req.body;

  // Datos específicos de búsqueda
  const {
    nombresCompletos,
    cedula,
    estadoCivil,
    nombresSolicitante,
    cedulaSolicitante,
    estadoCivilSolicitante,
    declaracionUso,
    recepcionDocumento,
    correoRecepcion
  } = req.body;

  // Validar campos requeridos
  if (
    !nombre ||
    !cedulaFacturacion ||
    !direccion ||
    !telefono ||
    !nombresCompletos ||
    !cedula ||
    !estadoCivil ||
    !nombresSolicitante ||
    !cedulaSolicitante ||
    !estadoCivilSolicitante ||
    !declaracionUso ||
    !recepcionDocumento ||
    (recepcionDocumento === 'Electrónico' && !correoRecepcion)
  ) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  try {
    // Ruta al archivo PDF existente (diferente al de gravamen)
    const pdfPath = path.join(__dirname, 'pdfs', '1.pdf');

    // Verificar si el archivo PDF existe
    if (!fs.existsSync(pdfPath)) {
      console.error('El archivo PDF no se encontró en:', pdfPath);
      return res.status(404).json({ message: 'El archivo PDF no se encontró.' });
    }

    // Cargar el PDF existente
    const pdfBytes = fs.readFileSync(pdfPath);

    // Cargar el PDF con pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Obtener la primera página del PDF
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Rellenar el PDF con los datos de facturación
    firstPage.drawText(`${nombre}`, { x: 95, y: 665, size: 12 });
    firstPage.drawText(`${cedulaFacturacion}`, { x: 300, y: 635, size: 12 });
    firstPage.drawText(`${direccion}`, { x: 80, y: 612, size: 12 });
    firstPage.drawText(`${correo}`, { x: 135, y: 590, size: 12 });
    firstPage.drawText(`${telefono}`, { x: 440, y: 590, size: 12 });

    // Rellenar el PDF con los datos de búsqueda
    firstPage.drawText(`${nombresCompletos}`, { x: 95, y: 520, size: 12 });
    firstPage.drawText(`${cedula}`, { x: 270, y: 488, size: 12 });
    firstPage.drawText(`${estadoCivil}`, { x: 460, y: 488, size: 12 });
    firstPage.drawText(`${nombresSolicitante}`, { x: 180, y: 440, size: 12 });
    firstPage.drawText(`${cedulaSolicitante}`, { x: 390, y: 410, size: 12 });
    firstPage.drawText(`${estadoCivilSolicitante}`, { x: 140, y: 388, size: 12 });
    firstPage.drawText(`${declaracionUso}`, { x: 110, y: 366, size: 12 });

    // Rellenar el PDF con los datos de recepción del documento
    if (recepcionDocumento === 'Presencial') {
      firstPage.drawText('X', { x: 161, y: 183, size: 12 });
    } else if (recepcionDocumento === 'Electrónico') {
      firstPage.drawText('X', { x: 161, y: 143, size: 12 });
      firstPage.drawText(`${correoRecepcion}`, { x: 80, y: 107, size: 12 });
    }

    // Agregar Lugar y Fecha automáticamente
    const lugar = 'Pedro Vicente Maldonado';
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    firstPage.drawText(`${lugar}`, { x: 390, y: 222, size: 12 });
    firstPage.drawText(`${fechaActual}`, { x: 340, y: 200, size: 12 });

    // Guardar el PDF modificado
    const modifiedPdfBytes = await pdfDoc.save();

    // Guardar el PDF modificado en un archivo temporal
    const tempFilePath = path.join(__dirname, 'temp.pdf');
    fs.writeFileSync(tempFilePath, modifiedPdfBytes);

    // Enviar el archivo temporal como respuesta
    res.download(tempFilePath, 'Formulario_Busqueda.pdf', (err) => {
      if (err) {
        console.error('Error al enviar el archivo:', err);
        res.status(500).json({ message: 'Error al descargar el PDF.' });
      }

      // Eliminar el archivo temporal después de enviarlo
      fs.unlinkSync(tempFilePath);
      console.log('Archivo temporal eliminado.');
    });
  } catch (error) {
    console.error('Error al rellenar el PDF:', error);
    res.status(500).json({ message: 'Error al generar el PDF' });
  }
});

// ✅ Nuevo: Endpoint de salud para Render (requerido)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Generador de PDF - Registro de Propiedad PVM',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor (con mensaje mejorado)
app.listen(port, () => {
  console.log('================================');
  console.log(`🚀 Servidor activo en puerto ${port}`);
  console.log(`🌐 Dominio oficial: https://www.regpropiedadpvm.gob.ec`);
  console.log('Endpoints disponibles:');
  console.log(`- POST /generar-pdf`);
  console.log(`- POST /generar-pdf-busqueda`);
  console.log(`- GET /health`);
  console.log('================================');
});