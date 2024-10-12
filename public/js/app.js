// Obtención de referencias a los elementos del DOM
const form = document.getElementById('tareaForm'); // Formulario para agregar tareas
const taskInput = document.getElementById('nombre'); // Input para el nombre de la tarea
const taskList = document.getElementById('tasks-list'); // Contenedor para la lista de tareas
const empty = document.getElementById('empty'); // Mensaje cuando no hay tareas
const modal = document.getElementById('modal'); // Modal para mostrar mensajes
const modalMessage = document.getElementById('modal-message'); // Mensaje dentro del modal
const closeModal = document.getElementById('close-modal'); // Botón para cerrar el modal

// Función para mostrar mensajes en el modal
function showModal(message) {
    modalMessage.textContent = message; // Asigna el mensaje al modal
    modal.style.display = 'block'; // Muestra el modal
}

// Cerrar el modal al hacer clic en el botón de cierre
closeModal.addEventListener('click', function () {
    modal.style.display = 'none'; // Oculta el modal
});

// Cerrar el modal si se hace clic fuera de él
window.onclick = function (event) {
    if (event.target === modal) {
        modal.style.display = 'none'; // Oculta el modal si se clickea fuera de él
    }
};

// Función para agregar una tarea a la lista visual
function addTask(taskText, isCompleted = false, taskId, prioridad, descripcion, fecha_vencimiento) {
    const listItem = document.createElement('li'); // Crea un nuevo elemento de lista
    listItem.classList.add('task-item'); // Añade clase 'task-item'
    listItem.setAttribute('data-id', taskId); // Asigna el id a la tarea
    
    // Formatea la fecha de vencimiento
    const fechaFormateada = fecha_vencimiento.replace('T', ' H:');
    
    // Define el contenido HTML de la tarea
    listItem.innerHTML = `
        <span class="task-name">${taskText}</span>
        <div class="task-header">
            <div class="task-meta">
                <span>Fecha Fin: ${fechaFormateada}</span>
                <span>Prioridad: ${prioridad}</span>
            </div>
            <div class="buttons">
                <button class="complete-button" onclick="completeTask(${taskId})">Finalizar</button>
                <button class="delete-button" onclick="deleteTask(${taskId})">Eliminar</button>
            </div>
        </div>
        <p style="font-weight: bold;">Descripción:</P>
        <p class="task-description">${descripcion}</p>
    `;

    // Si la tarea está completada, marcarla como tal
    if (isCompleted) {
        listItem.classList.add('completed'); // Añadir clase de tarea completada
        const completeButton = listItem.querySelector('.complete-button');
        const deleteButton = listItem.querySelector('.delete-button');

        // Deshabilitar botones si la tarea está completada
        completeButton.disabled = true;
        deleteButton.disabled = true;
    }

    // Añadir la tarea a la lista de tareas
    taskList.appendChild(listItem);

    // Si no hay tareas, mostrar el mensaje correspondiente
    empty.style.display = "none";
}

// Función para guardar una tarea en el backend
function saveTask(taskText, descripcion, fecha_vencimiento, prioridad) {
    console.log('Enviando tarea:', { nombre: taskText, descripcion, fecha_vencimiento, prioridad });

    // Enviar los datos de la tarea al servidor usando fetch
    fetch('/api/tareas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nombre: taskText,
            descripcion: descripcion,
            fecha_vencimiento: fecha_vencimiento,
            prioridad: prioridad
        })
    }).then(response => {
        return response.json(); // Procesa la respuesta en formato JSON
    }).then(data => {
        if (data.id) {
            // Si la tarea fue agregada correctamente, mostrarla en la lista
            addTask(taskText, false, data.id, prioridad, descripcion, fecha_vencimiento);
        } else {
            console.error('Error al agregar la tarea:', data);
            showModal('Error al agregar la tarea');
        }
    }).catch(error => {
        console.error('Error en la solicitud fetch:', error);
        showModal('Error de conexión');
    });
}

// Función para cargar todas las tareas desde el backend
function loadTasks() {
    fetch('/api/tareas')
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                taskList.innerHTML = '';  // Vacía la lista antes de llenarla

                // Filtrar tareas no completadas y completadas
                const tareasNoCompletadas = data.filter(task => !task.completada);
                const tareasCompletadas = data.filter(task => task.completada);

                // Ordenar las tareas no completadas por fecha de vencimiento (ascendente)
                tareasNoCompletadas.sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));

                // Mostrar primero las tareas no completadas
                tareasNoCompletadas.forEach(task => {
                    addTask(task.nombre, task.completada, task.id, task.prioridad, task.descripcion, task.fecha_vencimiento);
                });

                // Luego las tareas completadas
                tareasCompletadas.forEach(task => {
                    addTask(task.nombre, task.completada, task.id, task.prioridad, task.descripcion, task.fecha_vencimiento);
                });

            } else {
                // Si no hay tareas, mostrar el mensaje correspondiente
                empty.style.display = "block";
            }
        })
        .catch(error => {
            console.error('Error al cargar las tareas:', error);
        });
}

// Función para eliminar una tarea
function deleteTask(taskId) {
    fetch(`/api/tareas/${taskId}`, {
        method: 'DELETE'  // Método DELETE para eliminar la tarea
    })
        .then(response => response.json())
        .then(() => {
            const taskItem = document.querySelector(`[data-id="${taskId}"]`); // Buscar la tarea en la lista
            taskList.removeChild(taskItem); // Eliminar la tarea de la lista

            // Si la lista de tareas está vacía, mostrar el mensaje correspondiente
            if (taskList.children.length === 0) {
                empty.style.display = "block";
            }
        })
        .catch(error => {
            console.error('Error al eliminar la tarea:', error);
            showModal('Error al eliminar la tarea');
        });
}

// Función para marcar una tarea como completada
function completeTask(taskId) {
    fetch(`/api/tareas/completar/${taskId}`, {
        method: 'PUT'  // Método PUT para marcar la tarea como completada
    })
        .then(response => response.json())
        .then(() => {
            const taskItem = document.querySelector(`[data-id="${taskId}"]`); // Buscar la tarea en la lista
            taskItem.classList.add('completed');  // Añadir la clase 'completed'

            const completeButton = taskItem.querySelector('.complete-button');
            const deleteButton = taskItem.querySelector('.delete-button');

            // Deshabilitar los botones de "Finalizar" y "Eliminar"
            completeButton.disabled = true;
            deleteButton.disabled = true;
        })
        .catch(error => {
            console.error('Error al completar la tarea:', error);
            showModal('Error al completar la tarea');
        });
}

// Evento para agregar tarea desde el formulario
form.addEventListener('submit', function (event) {
    event.preventDefault();  // Prevenir el envío del formulario

    // Obtener los valores del formulario
    const taskText = taskInput.value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const fecha_vencimiento = document.getElementById('fecha_vencimiento').value;
    const prioridad = document.getElementById('prioridad').value;

    // Validar si todos los campos tienen valor
    if (taskText && descripcion && fecha_vencimiento && prioridad) {
        console.log('Guardando tarea...');
        saveTask(taskText, descripcion, fecha_vencimiento, prioridad);  // Guardar la tarea
        form.reset();  // Limpiar el formulario después de enviarlo
    } else {
        showModal('Por favor, completa todos los campos.');  // Mostrar mensaje si falta algún campo
    }
});

// Cargar las tareas al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    loadTasks();  // Cargar las tareas desde el servidor
});
