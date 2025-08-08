document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('content-area');
    const contentTitle = document.getElementById('content-title');
    const datePickerContainer = document.getElementById('date-picker-container');
    const datePicker = document.getElementById('date-picker');
    const loadDateBtn = document.getElementById('load-date-btn');
    
    // Botones del sidebar
    const dashboardBtn = document.getElementById('dashboard-btn');
    const todayBtn = document.getElementById('today-btn');
    const yesterdayBtn = document.getElementById('yesterday-btn');
    const specificDateBtn = document.getElementById('specific-date-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Establecer la fecha actual como valor por defecto
    const today = new Date();
    datePicker.valueAsDate = today;
    datePicker.max = today.toISOString().split('T')[0]; // No permitir fechas futuras

    // Elemento para notificaciones
    const notificationArea = document.createElement('div');
    notificationArea.id = 'notification-area';
    notificationArea.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        display: none;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
    `;
    document.body.appendChild(notificationArea);

    // Cargar asistencias del día actual al inicio
    loadAsistencias();

    // Función para mostrar notificación
    function showNotification(message, isError = false) {
        notificationArea.textContent = message;
        notificationArea.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
        notificationArea.style.display = 'block';
        notificationArea.style.opacity = '1';
        
        setTimeout(() => {
            notificationArea.style.opacity = '0';
            setTimeout(() => {
                notificationArea.style.display = 'none';
            }, 500);
        }, 3000);
    }

    // Función para cargar asistencias
    async function loadAsistencias(fecha = null) {
        showNotification('Cargando asistencias...');
        
        let url = '/api/asistencias';
        if (fecha) {
            url += `?fecha=${fecha}`;
        }
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const asistencias = await response.json();
            
            // Determinar si es un día pasado
            const hoy = new Date().toISOString().split('T')[0];
            const esDiaPasado = fecha && fecha !== hoy;
            
            renderAsistencias(asistencias, esDiaPasado);
        } catch (error) {
            console.error('Error al cargar asistencias:', error);
            showNotification('Error al cargar asistencias', true);
            renderAsistencias([], false, true);
        }
    }

    // Función para renderizar las asistencias
    function renderAsistencias(asistencias, esDiaPasado = false, error = false) {
        let htmlContent = '';
        
        if (error) {
            htmlContent = `
                <div class="card">
                    <div class="error-message">
                        <p>No se pudieron cargar los datos. Por favor, intente nuevamente.</p>
                        <button class="btn btn-primary" onclick="location.reload()">Reintentar</button>
                    </div>
                </div>
            `;
        } else if (esDiaPasado) {
            // Vista de solo lectura para días pasados
            htmlContent = `
                <div class="card">
                    <div class="table-container">
                        <div class="table-responsive">
                            <table class="readonly-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Cédula</th>
                                        <th>Hora Entrada</th>
                                        <th>Hora Editada</th>
                                    </tr>
                                </thead>
                                <tbody id="asistencias-body">
                                </tbody>
                            </table>
                        </div>
                        <div class="export-container">
                            <button id="export-pdf-btn" class="btn btn-success">
                                <i class="fas fa-file-export"></i> Exportar a PDF
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Vista completa para el día actual
            htmlContent = `
                <div class="card">
                    <div class="form-container">
                        <h3>Registrar Nueva Asistencia</h3>
                        <form id="asistencia-form">
                            <div class="input-group">
                                <label for="nombre">Nombre:</label>
                                <input type="text" id="nombre" required>
                            </div>
                            <div class="input-group">
                                <label for="cedula">Cédula:</label>
                                <input type="text" id="cedula" required>
                            </div>
                            <div class="input-group">
                                <label for="hora-entrada">Hora de Entrada:</label>
                                <input type="time" id="hora-entrada" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Registrar</button>
                        </form>
                    </div>
                    
                    <div class="table-container">
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Cédula</th>
                                        <th>Hora Entrada</th>
                                        <th>Hora Editada</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="asistencias-body">
                                </tbody>
                            </table>
                        </div>
                        <div class="export-container">
                            <button id="export-pdf-btn" class="btn btn-success">
                                <i class="fas fa-file-export"></i> Exportar a PDF
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        contentArea.innerHTML = htmlContent;
        
        // Llenar la tabla siempre que haya datos
        const tbody = document.getElementById('asistencias-body');
        if (tbody) {
            if (asistencias.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay registros de asistencia</td></tr>';
            } else {
                let rowsHtml = '';
                asistencias.forEach(asistencia => {
                    rowsHtml += `
                        <tr data-id="${asistencia.id}">
                            <td>${asistencia.nombre}</td>
                            <td>${asistencia.cedula}</td>
                            <td>${asistencia.hora_entrada}</td>
                            <td>${asistencia.hora_entrada_editada || '-'}</td>
                            ${!esDiaPasado ? `
                            <td>
                                <button class="btn btn-warning btn-sm edit-btn" data-id="${asistencia.id}">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                            </td>` : '<td></td>'}
                        </tr>
                    `;
                });
                tbody.innerHTML = rowsHtml;
            }
        }

        // Agregar eventos solo si es el día actual y no hay error
        if (!esDiaPasado && !error) {
            // Evento para enviar nuevo registro
            document.getElementById('asistencia-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nombre = document.getElementById('nombre').value.trim();
                const cedula = document.getElementById('cedula').value.trim();
                const horaEntrada = document.getElementById('hora-entrada').value;

                if (!nombre || !cedula || !horaEntrada) {
                    showNotification('Todos los campos son requeridos', true);
                    return;
                }

                try {
                    const response = await fetch('/api/asistencias', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ 
                            nombre: nombre,
                            cedula: cedula,
                            hora_entrada: horaEntrada
                        })
                    });

                    const data = await response.json();
                    
                    if (response.ok) {
                        showNotification('Asistencia registrada con éxito');
                        document.getElementById('asistencia-form').reset();
                        loadAsistencias();
                    } else {
                        throw new Error(data.message || 'Error al registrar asistencia');
                    }
                } catch (error) {
                    console.error('Error al registrar asistencia:', error);
                    showNotification(error.message, true);
                }
            });

            // Eventos para botones de edición
            document.querySelectorAll('.edit-btn')?.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('button').dataset.id;
                    const row = e.target.closest('tr');
                    const currentData = {
                        nombre: row.cells[0].textContent,
                        cedula: row.cells[1].textContent,
                        hora: row.cells[3].textContent !== '-' ? row.cells[3].textContent : row.cells[2].textContent
                    };

                    // Abrir modal de edición (simulado con prompt)
                    const newHora = prompt('Ingrese la nueva hora de entrada (HH:MM):', currentData.hora);
                    
                    if (newHora && newHora !== currentData.hora) {
                        updateAsistencia(id, { hora_entrada: newHora });
                    }
                });
            });
        }

        // Evento para exportar a PDF
        document.getElementById('export-pdf-btn')?.addEventListener('click', async () => {
            const fecha = datePicker.value || new Date().toISOString().split('T')[0];
            
            try {
                const response = await fetch('/api/export-asistencias-dia', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ fecha: fecha })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `asistencias_${fecha}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                } else {
                    throw new Error('Error al exportar el PDF');
                }
            } catch (error) {
                console.error('Error al exportar:', error);
                showNotification('Error al exportar el reporte', true);
            }
        });
    }

    // Función para actualizar una asistencia
    async function updateAsistencia(id, data) {
        try {
            const response = await fetch(`/api/asistencias/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (response.ok) {
                showNotification('Asistencia actualizada con éxito');
                loadAsistencias();
            } else {
                throw new Error(result.message || 'Error al actualizar asistencia');
            }
        } catch (error) {
            console.error('Error al actualizar asistencia:', error);
            showNotification(error.message, true);
        }
    }

    // Eventos de los botones del sidebar
    todayBtn.addEventListener('click', () => {
        contentTitle.textContent = 'Asistencias - Hoy';
        datePickerContainer.style.display = 'none';
        loadAsistencias();
    });

    yesterdayBtn.addEventListener('click', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        
        contentTitle.textContent = `Asistencias - Ayer (${formatDate(yesterday)})`;
        datePickerContainer.style.display = 'none';
        loadAsistencias(dateStr);
    });

    specificDateBtn.addEventListener('click', () => {
        contentTitle.textContent = 'Asistencias - Fecha Específica';
        datePickerContainer.style.display = 'block';
    });

    loadDateBtn.addEventListener('click', () => {
        const selectedDate = datePicker.value;
        if (!selectedDate) {
            showNotification('Seleccione una fecha válida', true);
            return;
        }
        
        contentTitle.textContent = `Asistencias - ${formatDate(new Date(selectedDate))}`;
        loadAsistencias(selectedDate);
    });

    dashboardBtn.addEventListener('click', () => {
        window.location.href = '/';
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/logout', { 
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                sessionStorage.removeItem('token');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    });

    // Función auxiliar para formatear fechas
    function formatDate(date) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }
});