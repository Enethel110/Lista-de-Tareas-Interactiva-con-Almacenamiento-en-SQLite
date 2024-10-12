// Importación de las dependencias necesarias
const express = require('express'); // Express para crear la API REST
const sqlite3 = require('sqlite3').verbose(); // SQLite para gestionar la base de datos
const bodyParser = require('body-parser'); // Middleware para procesar el cuerpo de las peticiones

// Inicialización de la aplicación Express y configuración del puerto
const app = express();  // Crea una instancia de la aplicación Express
const port = 3000;      // Define el puerto en el que correrá la aplicación

// Middleware para manejar JSON en las peticiones y archivos estáticos
app.use(bodyParser.json()); // Middleware que permite procesar el cuerpo de la solicitud como JSON
app.use(express.static('public')); // Middleware para servir archivos estáticos desde la carpeta 'public'

// Conexión a la base de datos SQLite
const db = new sqlite3.Database('./public/database/tareas.db', (err) => {
    if (err) {
        console.error("Error al conectar con la base de datos:", err.message); // Si ocurre un error, lo muestra en consola
    } else {
        console.log("Conectado a la base de datos SQLite"); // Si la conexión es exitosa, lo indica en consola
    }
});

// Crear la tabla de tareas si no existe
db.serialize(() => {
    // Crea la tabla 'tareas' si no existe
    db.run(`CREATE TABLE IF NOT EXISTS tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Identificador único para cada tarea
        nombre TEXT NOT NULL,                  -- Nombre de la tarea
        descripcion TEXT NOT NULL,             -- Descripción de la tarea
        fecha_vencimiento TEXT NOT NULL,       -- Fecha de vencimiento
        prioridad TEXT NOT NULL,               -- Prioridad de la tarea
        completada INTEGER DEFAULT 0           -- Estado de la tarea (0 = no completada, 1 = completada)
    )`);
});

// Ruta para obtener todas las tareas
app.get('/api/tareas', (req, res) => {
    // Realiza una consulta para obtener todas las tareas en orden descendente por id
    db.all('SELECT * FROM tareas ORDER BY id DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message }); // Manejo de errores en la consulta
            return; // Sale de la función si hay error
        }
        res.json(rows); // Devuelve las tareas en formato JSON
    });
});

// Ruta para agregar una nueva tarea
app.post('/api/tareas', (req, res) => {
    // Extrae los datos de la nueva tarea desde el cuerpo de la solicitud (req.body)
    const { nombre, descripcion, fecha_vencimiento, prioridad } = req.body;
    
    // Realiza una inserción en la base de datos para agregar la nueva tarea
    db.run(`INSERT INTO tareas (nombre, descripcion, fecha_vencimiento, prioridad) 
            VALUES (?, ?, ?, ?)`, [nombre, descripcion, fecha_vencimiento, prioridad], function (err) {
        if (err) {
            res.status(500).json({ error: err.message }); // Manejo de errores en la inserción
            return; // Sale de la función si hay error
        }
        // Devuelve el ID de la nueva tarea creada
        res.status(201).json({ id: this.lastID });
    });
});

// Ruta para eliminar una tarea por su ID
app.delete('/api/tareas/:id', (req, res) => {
    // Extrae el ID de la tarea desde los parámetros de la solicitud (req.params)
    const { id } = req.params;
    
    // Realiza la eliminación de la tarea en la base de datos
    db.run(`DELETE FROM tareas WHERE id = ?`, [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message }); // Manejo de errores en la eliminación
            return; // Sale de la función si hay error
        }
        // Responde con un mensaje de éxito
        res.status(200).json({ message: 'Tarea eliminada' });
    });
});

// Ruta para marcar una tarea como completada
app.put('/api/tareas/completar/:id', (req, res) => {
    // Extrae el ID de la tarea desde los parámetros de la solicitud (req.params)
    const { id } = req.params;
    
    // Actualiza el estado de la tarea para marcarla como completada (completada = 1)
    db.run(`UPDATE tareas SET completada = 1 WHERE id = ?`, [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message }); // Manejo de errores en la actualización
            return; // Sale de la función si hay error
        }
        // Responde con un mensaje de éxito
        res.status(200).json({ message: 'Tarea marcada como completada' });
    });
});

// Inicialización del servidor en el puerto 3000
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`); // Mensaje cuando el servidor está listo
});
