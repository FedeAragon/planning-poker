# Sprint Planning Poker - Especificación Técnica

## Descripción General

Aplicación web para realizar estimaciones de tareas de sprint en tiempo real con un equipo. Permite a múltiples usuarios conectarse a una sala, cargar tareas y votar estimaciones de forma colaborativa siguiendo la metodología Planning Poker.

---

## Funcionalidades

### 1. Gestión de Usuarios

#### 1.1 Ingreso a la Aplicación
- Al entrar a la aplicación, se solicita el nombre del usuario.
- El nombre es obligatorio para acceder a cualquier funcionalidad.
- Se permiten nombres duplicados (dos usuarios pueden tener el mismo nombre).
- Cada usuario tiene un identificador único interno independiente del nombre.

#### 1.2 Presencia en Tiempo Real
- Se muestra una lista de todos los usuarios que han participado en la sala.
- Cada usuario muestra su estado: **conectado** o **desconectado**.
- Cuando un usuario se conecta o desconecta, todos los demás usuarios lo ven en tiempo real.

---

### 2. Gestión de Salas

#### 2.1 Creación de Sala
- Cualquier usuario puede crear una nueva sala.
- Al crear una sala se debe especificar un **nombre de sala** (descriptivo, para identificación visual).
- El sistema genera un **identificador único** para la sala (UUID o similar).
- El usuario que crea la sala se convierte en **admin** de la misma.

#### 2.2 Acceso a Sala
- Se puede acceder a una sala existente mediante un link que contiene el identificador único.
- Formato del link: `{base_url}/room/{identificador_unico}`
- Al acceder con el link, el usuario ingresa directamente a la sala (después de ingresar su nombre si no lo ha hecho).

#### 2.3 Reconexión Automática
- Cuando un usuario ingresa a una sala, su sesión se guarda localmente (localStorage).
- La sesión se guarda **por sala**: cada sala tiene su propia sesión independiente.
- La sesión expira después de **24 horas** desde el último acceso.
- Si el usuario accede al link de una sala donde ya tiene sesión válida, se reconecta automáticamente sin pedir nombre.
- La reconexión restaura el usuario con su mismo ID y rol previo.
- Si la sesión expiró o no existe, se solicita el nombre normalmente.

#### 2.4 Finalización de Sala
- Cualquier **admin** puede **finalizar** la sala.
- Una sala finalizada ya no permite nuevas votaciones ni carga de tareas.
- Las tareas y votos de una sala finalizada permanecen visibles como histórico.

#### 2.5 Persistencia de Salas
- Las salas no expiran y duran indefinidamente.
- Las salas persisten ante caídas del servidor.

---

### 3. Gestión de Tareas

#### 3.1 Estructura de Tarea
Cada tarea contiene:
- **ID único** (generado por el sistema)
- **Título** (texto ingresado por el usuario)
- **Orden** (posición en la cola de votación)
- **Estado**: pendiente | en_votacion | votada
- **Estimación final** (la más votada, se asigna al revelar)
- **Votos** (lista de votos de cada usuario)
- **Tiempo de votación** (duración en segundos desde que inició hasta que se avanzó)

#### 3.2 Carga Individual de Tareas
- Solo los **admins** pueden agregar tareas.
- Se ingresa solo el título de la tarea.
- La tarea se agrega al final de la cola de votación.
- Se pueden agregar tareas en cualquier momento, incluso durante una votación activa.

#### 3.3 Carga Masiva (CSV)
- Solo los **admins** pueden cargar tareas en bulk mediante un archivo CSV.
- El CSV tiene una única columna con los títulos de las tareas.
- Cada fila representa una tarea.
- Las tareas se agregan al final de la cola en el orden del archivo.

#### 3.4 Reordenamiento de Tareas
- Solo los **admins** pueden cambiar el orden de las tareas pendientes.
- Solo se pueden reordenar tareas que aún no han sido votadas.
- Se puede **sobreponer una tarea pendiente sobre la tarea actual**: la tarea pendiente pasa a ser la nueva tarea activa, y la tarea que estaba activa pasa a ser la siguiente en la cola (los votos de la tarea anterior se descartan).
- El reordenamiento se refleja en tiempo real para todos los usuarios.

#### 3.5 Persistencia de Tareas
- Las tareas se persisten ante caídas del servidor.
- Al reiniciarse el servidor, las tareas cargadas permanecen disponibles.

---

### 4. Sistema de Votación

#### 4.1 Valores de Estimación
Los valores disponibles para votar son: **0, 1, 2, 3, 5, 8**

#### 4.2 Flujo de Votación
1. Se vota una tarea a la vez (tarea activa).
2. Las tareas se votan en el orden establecido en la cola.
3. Todos los usuarios conectados pueden emitir su voto (excepto observers).
4. Los votos permanecen ocultos hasta que se revelan.
5. Un usuario puede cambiar su voto en cualquier momento hasta que el admin avance a la siguiente tarea (incluso después de la revelación).
6. Los usuarios desconectados se omiten al revelar (no bloquean la votación).

#### 4.3 Revelación de Votos
- **Solo los admins** pueden revelar los votos.
- Dos formas de revelar:
  - **Automática**: cuando todos los usuarios conectados han votado.
  - **Manual**: un admin presiona un botón para revelar (sin esperar a todos).

#### 4.4 Visualización Post-Revelación
Al revelar los votos se muestra:
- Lista de votos individuales con el nombre de cada usuario.
- Porcentaje de cada valor de estimación elegido (solo se muestran valores con porcentaje > 0%).
- Indicación clara de cuál es la estimación **más votada** y la **menos votada**.
- La estimación más votada se asigna como el **valor final** de la tarea.
- **En caso de empate**: se toma el valor más alto como estimación final.
- Los usuarios pueden seguir cambiando su voto después de la revelación; la estimación final se recalcula en tiempo real.

#### 4.5 Re-votación
- Cualquier admin puede iniciar una re-votación de la tarea actual.
- Solo disponible **después de revelar los votos** y **antes de avanzar** a la siguiente tarea.
- Al re-votar, se resetean todos los votos de la tarea.
- La tarea vuelve a estar en estado "en votación" (votos ocultos nuevamente).

#### 4.6 Avance de Tarea
- Después de revelar los votos, cualquier admin presiona un botón para avanzar a la siguiente tarea.
- La tarea actual pasa a estado "votada" y la siguiente en la cola pasa a "en votación".

#### 4.7 Timer de Votación
- Cada tarea tiene un **timer** que mide el tiempo de votación.
- El timer **inicia** cuando la tarea pasa a estado "en votación".
- El timer **se detiene** cuando el admin avanza a la siguiente tarea.
- El timer **se muestra en tiempo real** y está sincronizado para todos los usuarios.
- Si se inicia una **re-votación**, el timer se **resetea** y comienza desde cero.
- El tiempo final de cada tarea se **persiste** para consulta posterior.
- El timer es **solo informativo** (no tiene funcionalidad automática).

#### 4.8 Persistencia de Votos
- Los votos se persisten ante caídas del servidor.
- Al reiniciarse el servidor, los votos emitidos permanecen registrados.

---

### 5. Visualización de Tareas

#### 5.1 Vista de Cola de Tareas
Todos los usuarios pueden ver:
- **Tarea actual** (en votación): destacada visualmente.
- **Tareas pendientes**: próximas a votar, en orden.
- **Tareas votadas**: historial con su estimación final.

#### 5.2 Información por Tarea
- Tareas pendientes: título y posición en cola.
- Tarea en votación: título, estado de votos (quién votó, sin mostrar el valor), **timer en tiempo real**.
- Tareas votadas: título, estimación final, detalle de votos individuales, **tiempo que tardó la votación**.

#### 5.3 Pantalla de Resumen Final
Cuando todas las tareas han sido votadas o la sala se finaliza, se muestra:
- Lista de todas las tareas con su estimación final.
- **Top 3 de tareas que más tardaron** en votarse (con su tiempo).
- Tiempo total de la sesión de planning.

---

### 6. Roles y Permisos

#### 6.1 Rol Creador
- El usuario que crea la sala es el **creador**.
- El creador es automáticamente **admin** y **no puede perder este rol**.
- Solo el creador puede **nombrar** y **quitar** el rol de admin a otros usuarios.
- El creador se indica visualmente de forma especial en la lista de usuarios.

#### 6.2 Rol Admin
- Una sala puede tener **múltiples admins** simultáneamente (creador + otros).
- Todos los admins (incluido el creador) tienen los **mismos permisos operativos**.

**Acciones exclusivas de admins:**
- Cargar tareas (individual o CSV)
- Editar títulos de tareas
- Reordenar tareas pendientes
- Revelar votos
- Avanzar a la siguiente tarea
- Iniciar re-votación de una tarea
- Finalizar la sala
- Convertir usuarios en observer (y viceversa)

**Acciones exclusivas del creador:**
- Nombrar a otros usuarios como admin
- Quitar el rol de admin a otros usuarios

#### 6.3 Gestión de Admins
- Solo el **creador** puede nombrar o quitar admins.
- El rol de admin se **persiste**: si un admin se desconecta y reconecta, sigue siendo admin.
- En la lista de usuarios se indica visualmente quiénes son admins y quién es el creador.

#### 6.4 Transferencia Automática de Rol
- Si **todos los admins** se desconectan, el rol de admin se transfiere automáticamente a un usuario conectado.
- Criterio de selección: **aleatorio** entre los usuarios conectados (excluyendo observers).
- Esto garantiza que siempre haya al menos un admin conectado mientras haya usuarios votantes en la sala.
- Se notifica a todos los usuarios cuando hay un nuevo admin.

#### 6.5 Usuario Regular (Votante)
Acciones permitidas:
- Votar en la tarea activa
- Ver estado de la sala, usuarios y tareas

#### 6.6 Rol Observer
- Cualquier admin puede **convertir** a cualquier usuario en observer (y viceversa), excepto al creador.
- Los usuarios siempre ingresan como **votantes**; solo un admin puede cambiarlos a observer.
- Los observers **no pueden votar**.
- Los observers **no pueden cargar tareas** ni reordenarlas.
- Los observers solo pueden **ver**: tareas, votos revelados, usuarios, estado de la sala.
- Los observers **no se cuentan** para determinar si "todos votaron".
- Útil para stakeholders, scrum masters u otras personas que solo quieren observar la sesión.

---

### 7. Tiempo Real

#### 7.1 Eventos Sincronizados
Los siguientes eventos se sincronizan en tiempo real para todos los usuarios de la sala:
- Conexión/desconexión de usuarios
- Nueva tarea agregada
- Reordenamiento de tareas
- Voto emitido (se muestra que el usuario votó, no el valor)
- Revelación de votos
- Avance a siguiente tarea
- Re-votación iniciada
- Sala finalizada

---

### 8. Resiliencia

#### 8.1 Persistencia
- **Salas**: se persisten con su configuración y estado.
- **Tareas**: se persisten con su orden, estado y estimación final.
- **Votos**: se persisten asociados a cada tarea y usuario.
- **Usuarios de sala**: se persisten para mantener historial de participantes.

#### 8.2 Recuperación ante Caídas
- Al reiniciarse el servidor, todas las salas se restauran.
- Los usuarios pueden reconectarse y continuar donde quedaron.
- Las votaciones en curso mantienen los votos ya emitidos.

---

## Pantallas

### Pantalla 1: Ingreso
- Campo de texto para nombre de usuario.
- Botón "Ingresar".
- Después de ingresar, se muestra opción de crear sala o unirse vía link.

### Pantalla 2: Crear Sala
- Campo de texto para nombre de la sala.
- Botón "Crear Sala".
- Al crear, redirige a la sala y muestra el link compartible.

### Pantalla 3: Sala de Votación
Secciones:
1. **Header**: nombre de la sala, link compartible, botón finalizar (solo admins).
2. **Lista de usuarios**: nombres con indicador de estado (conectado/desconectado), badge de rol (admin/votante/observer). Opciones para cambiar rol (solo visible para admins).
3. **Tarea actual**: título destacado, botones de votación (0,1,2,3,5,8), indicador de quién votó.
4. **Controles de admin**: botón revelar, botón siguiente tarea, botón re-votar (solo visibles para admins).
5. **Cola de tareas**: lista ordenable de tareas pendientes.
6. **Historial**: lista de tareas votadas con estimación final.
7. **Panel de carga**: campo para agregar tarea individual + botón subir CSV.

### Pantalla 4: Resultados de Votación (modal o sección)
- Lista de votos: nombre de usuario → valor votado.
- Gráfico/tabla de porcentajes por valor.
- Destacado del valor más votado (estimación final).
- Destacado del valor menos votado.
- Timer mostrando tiempo transcurrido.

### Pantalla 5: Resumen Final
- Lista de todas las tareas votadas con estimación final y tiempo.
- **Top 3 tareas que más tardaron** destacadas visualmente.
- Tiempo total de la sesión.

---

## Data Model

### User
```
{
  id: string (UUID)
  name: string
  room_id: string (reference to Room)
  connected: boolean
  role: 'creator' | 'admin' | 'voter' | 'observer'
  last_connection: timestamp
}
```

### Room
```
{
  id: string (UUID)
  name: string
  status: 'active' | 'finished'
  current_task_id: string | null
  created_at: timestamp
}
```

### Task
```
{
  id: string (UUID)
  room_id: string (reference to Room)
  title: string
  order: number
  status: 'pending' | 'voting' | 'voted'
  final_estimate: number | null
  voting_started_at: timestamp | null
  voting_duration_seconds: number | null
  created_at: timestamp
}
```

### Vote
```
{
  id: string (UUID)
  task_id: string (reference to Task)
  user_id: string (reference to User)
  value: number (0 | 1 | 2 | 3 | 5 | 8)
  created_at: timestamp
}
```

### Session (localStorage - client side only)
```
{
  roomId: string
  userId: string
  userName: string
  expiresAt: timestamp (24 hours from creation/update)
}
```
Key format: `planning-poker-session-{roomId}`

---

## API / WebSocket Events

### Client → Server Events
- `user:register` - Register user name
- `room:create` - Create new room
- `room:join` - Join existing room (always as voter)
- `room:rejoin` - Rejoin room with existing session (userId from localStorage)
- `room:finish` - Finish room (admin only)
- `user:change_role` - Change user role (admin for observer/voter, creator for admin)
- `task:add` - Add individual task
- `task:add_bulk` - Add tasks from CSV
- `task:reorder` - Change task order (includes overriding current task)
- `vote:submit` - Submit vote (voters and admins only)
- `voting:reveal` - Reveal votes (admin only)
- `voting:next` - Advance to next task (admin only)
- `voting:reset` - Re-vote task (admin only, after reveal)

### Server → Client Events
- `user:reconnected` - User successfully reconnected (rejoin)
- `user:connected` - User connected
- `user:disconnected` - User disconnected
- `user:role_changed` - User role changed
- `room:updated` - Room status updated
- `task:added` - New task added
- `task:order_updated` - Task order changed
- `task:current_changed` - Current task was replaced by another
- `vote:registered` - Someone voted (value hidden)
- `vote:updated` - Someone changed their vote (post-reveal)
- `voting:revealed` - Votes revealed with results
- `voting:next_task` - New active task
- `voting:reset` - Votes reset for re-voting

---

## API REST

### POST /api/rooms

Crea una sala con tareas desde un script externo. Útil para automatización e integración con otras herramientas.

**Request Body:**
```json
{
  "roomName": "Sprint 42 Planning",
  "userName": "Script Bot",
  "tasks": ["Task 1", "Task 2", "Task 3"]
}
```

**Response (201 Created):**
```json
{
  "roomId": "uuid-de-la-sala",
  "roomUrl": "https://example.com/room/uuid-de-la-sala",
  "userId": "uuid-del-usuario-creador",
  "tasksCreated": 3
}
```

**Validaciones:**
- `roomName`: obligatorio, string no vacío
- `userName`: obligatorio, string no vacío (será el creador/admin de la sala)
- `tasks`: opcional, array de strings (títulos de tareas)

**Comportamiento:**
- Crea la sala con el nombre especificado.
- Crea un usuario con el nombre dado, que será el **creador** de la sala.
- Si se proveen tareas, las agrega en el orden del array.
- La primera tarea (si existe) queda automáticamente en estado "voting".
- Retorna el link completo de la sala para compartir.

**Errores:**
- `400 Bad Request`: campos requeridos faltantes o inválidos.

---

## Consideraciones Técnicas

### Base de Datos
- Se requiere persistencia durable (no en memoria).
- Opciones sugeridas: PostgreSQL, MongoDB, SQLite (para desarrollo).

### Comunicación en Tiempo Real
- WebSockets para sincronización bidireccional.
- Opciones sugeridas: Socket.IO, WS nativo, Pusher.

### Tecnologías Sugeridas (sin restricciones del cliente)
- **Frontend**: React, Vue o Svelte con TypeScript.
- **Backend**: Node.js con Express/Fastify o Python con FastAPI.
- **Base de datos**: PostgreSQL o MongoDB.
- **WebSockets**: Socket.IO.

---

## Casos Borde

1. **Usuario se desconecta durante votación**: su voto previo (si existe) se mantiene; si no votó, se omite al revelar.
10. **Reconexión con sesión expirada**: si la sesión tiene más de 24 horas, se considera inválida y se solicita nombre.
11. **Reconexión con userId inexistente**: si el userId guardado ya no existe en el backend (ej: sala recreada), se solicita nombre.
2. **Empate en votación**: se toma el **valor más alto** como estimación final.
3. **Sala sin tareas**: mostrar mensaje indicando que se deben agregar tareas.
4. **Todas las tareas votadas**: mostrar resumen final y opción de agregar más tareas.
5. **CSV vacío o inválido**: mostrar error descriptivo al usuario.
6. **Todos los admins se desconectan**: el rol se transfiere automáticamente a un usuario votante conectado seleccionado al azar.
7. **Todos los usuarios se desconectan**: la sala permanece activa. Al reconectarse usuarios, los que eran admin siguen siendo admin. Si ninguno era admin, el primero en conectarse (que no sea observer) se convierte en admin.
8. **Solo quedan observers conectados**: la sala queda sin admin hasta que se conecte un votante o admin.
9. **Sobreponer tarea actual**: al mover una tarea pendiente sobre la actual, los votos de la tarea anterior se descartan y la votación comienza de cero con la nueva tarea.

---

## Fuera de Alcance (v1)

- Autenticación con contraseña o proveedores externos.
- Eliminación de salas.
- Transferir rol de creador a otro usuario.
- Exportación de resultados.
- Integración con herramientas externas (Jira, Trello, etc.).
- Límite de usuarios por sala.
- Personalización de valores de estimación.

