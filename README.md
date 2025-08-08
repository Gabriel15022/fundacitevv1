# mi-aplicacion-fundacite
Documentación Técnica del Sistema FUNDACITE
Para Desarrollo y Mantenimiento

Este sistema está diseñado para la gestión interna de solicitudes y asistencias en una organización, con un enfoque modular que permite su expansión y mantenimiento continuo. A continuación, te explico cómo funciona todo el flujo, cómo interactúan sus componentes y cómo puedes seguir desarrollándolo.

1. Arquitectura General
El sistema está dividido en tres capas principales:

Frontend (Interfaz de Usuario)
HTML + CSS + JavaScript:

index.html → Vista principal (gestión de tareas).

asistencias.html → Solo para RRHH (registro de asistencias).

login.html → Autenticación de usuarios.

Lógica en JavaScript:

main.js → Maneja las tareas (crear, editar, eliminar, exportar).

asistencias.js → Lógica de registro y edición de asistencias.

login.js → Procesa el inicio de sesión.

Backend (Servidor Flask - Python)
API RESTful con Flask:

Maneja autenticación (/api/login, /api/logout).

CRUD de tareas (/api/solicitudes).

CRUD de asistencias (/api/asistencias).

Generación de reportes en PDF (/api/export-pdf, /api/export-asistencias-dia).

Base de Datos (SQLite + SQLAlchemy):

Modelos: Solicitud, User, Asistencia.

Base de Datos
SQLite (archivo database.db).

Estructura definida en app.py (Flask-SQLAlchemy).

2. Flujo de Funcionamiento
Autenticación y Roles
Los usuarios se autentican con nombre de usuario y contraseña.

Cada usuario pertenece a un departamento (DTISC, DIAC, RRHH, etc.).

RRHH tiene permisos especiales:

Acceso al módulo de asistencias.

Puede modificar más campos en las tareas.

Gestión de Tareas (Solicitudes)
Listado de Tareas

Se cargan dinámicamente desde /api/solicitudes.

Cada departamento ve solo las tareas que le corresponden (como emisor o receptor).

RRHH ve todas las tareas donde está involucrado.

Creación de Tareas

Formulario con campos obligatorios (cedula, nombre, descripción, departamento_destino).

El departamento emisor se asigna automáticamente según el usuario logueado.

Edición y Eliminación

Emisor: Puede editar descripción y departamento_destino.

Receptor: Puede cambiar estado, quien_atendio y que_hizo.

RRHH: Puede modificar todo.

Exportación a PDF

Se pueden exportar:

Tareas seleccionadas.

Todas las tareas.

Solo tareas completadas o pendientes.

Gestión de Asistencias (Solo RRHH)
Registro de Asistencias

Formulario simple (nombre, cédula, hora_entrada).

La fecha se guarda automáticamente.

Edición

Permite corregir la hora de entrada.

Registra tanto la hora original como la hora editada.

Reportes

Se pueden generar PDFs por:

Día específico.

Rango de fechas.

3. Cómo Mantener y Expandir el Sistema
Mantenimiento Básico
Actualizar dependencias:

Flask, SQLAlchemy, ReportLab (para PDFs).

Respaldar la base de datos:

El archivo database.db debe copiarse regularmente.

Monitorear logs:

Flask muestra errores en consola (útil para depuración).

Cómo Añadir Nuevas Funcionalidades
1. Agregar un Nuevo Módulo
Ejemplo: Un módulo de inventario de equipos.

Pasos:

Crear una nueva tabla en la DB (en app.py):

python
class Equipo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    modelo = db.Column(db.String(50))
    departamento = db.Column(db.String(50))
Añadir rutas en Flask (/api/equipos):

python
@app.route('/api/equipos', methods=['GET', 'POST'])
def gestion_equipos():
    if request.method == 'GET':
        equipos = Equipo.query.all()
        return jsonify([e.to_dict() for e in equipos])
    elif request.method == 'POST':
        data = request.get_json()
        nuevo_equipo = Equipo(nombre=data['nombre'], modelo=data['modelo'], departamento=data['departamento'])
        db.session.add(nuevo_equipo)
        db.session.commit()
        return jsonify({"message": "Equipo registrado"}), 201
Crear una nueva página HTML (equipos.html) y su JS (equipos.js).

2. Modificar Permisos
Si quieres que DTISC también pueda ver asistencias:

En app.py, cambiar:

python
@app.route('/asistencias')
def asistencias_page():
    if session.get('departamento') not in ['RRHH', 'DTISC']:  # ← Añadir DTISC
        return redirect('/')
    return render_template('asistencias.html')
3. Mejorar los Reportes PDF
Usar tablas más complejas en ReportLab.

Añadir gráficos con reportlab.graphics.

4. Posibles Mejoras y Expansiones
Seguridad
Implementar JWT en lugar de sesiones Flask.

Añadir captcha en el login.

Usabilidad
Búsqueda avanzada en tareas (por fecha, estado, etc.).

Notificaciones en tiempo real con WebSockets.

Escalabilidad
Migrar a PostgreSQL/MySQL si la base de datos crece.

Usar Celery + Redis para tareas asíncronas (ej: envío de emails).

5. Conclusión
Este sistema está diseñado para ser fácil de mantener y expandir. Si necesitas añadir nuevas funcionalidades:

Define el modelo en app.py.

Crea las rutas API necesarias.

Desarrolla el frontend correspondiente (HTML + JS).

Mantenimiento de la persistencia de la aplicación con UptimeRobot:

Esta aplicación utiliza UptimeRobot, un servicio de monitoreo externo, para asegurar que siempre esté activa. Los servicios de alojamiento web gratuitos a menudo tienen una política de "apagado" que pone la aplicación en modo de suspensión o la elimina si no recibe tráfico durante un período de tiempo.

UptimeRobot envía solicitudes HTTP (pings) a la URL de la aplicación cada pocos minutos. Esto simula el tráfico de un usuario, lo que evita que el servicio de alojamiento ponga la aplicación en modo de suspensión por inactividad.

En resumen, UptimeRobot es un "bot" que visita la aplicación constantemente para mantenerla "despierta" y garantizar la persistencia de los datos y su disponibilidad.

El código está estructurado de forma modular, por lo que puedes añadir componentes sin romper lo existente.

