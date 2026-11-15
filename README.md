# Sistema de Gestion de Activos

Sistema web para la gestion de activos e inventario del CTP Osa.

El proyecto se encuentra actualmente en desarrollo. El backend se desarrolla primero y posteriormente se integrara el frontend.

## Estructura del proyecto

```text
sistema-gestion-activos/

├── backend/

│   └── asset-management-api/

│       ├── src/

│       ├── pom.xml

│       └── ...

├── frontend/

│   └── ...

└── README.md
```

## Backend

El backend esta desarrollado con las siguientes tecnologias:

* Java 21

* Spring Boot 4.1.1

* Maven

* Spring Web

* Spring Data JPA

* Hibernate

* Spring Security

* JWT

* Validation

* MySQL

### Requisitos

Para ejecutar el backend se necesita:

* JDK 21

* NetBeans u otro IDE compatible con Maven

* MySQL

* Acceso a la base de datos utilizada por el proyecto

El proyecto incluye Maven Wrapper, por lo que no es necesario instalar Maven de forma global.

## Configuracion

La configuracion del proyecto utiliza perfiles de Spring Boot.

El archivo `application.properties` activa el perfil local:

```properties
spring.profiles.active=local
```

La configuracion local se encuentra en:

```text
src/main/resources/application-local.properties
```

Este archivo no debe incluirse en el repositorio si contiene credenciales o informacion sensible.

Ejemplo de configuracion:

```properties
spring.datasource.url=jdbc:mysql://HOST:PUERTO/NOMBRE_BASE_DATOS

spring.datasource.username=USUARIO

spring.datasource.password=CONTRASENA
```

Ejemplo para una instalacion local:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/control_activos

spring.datasource.username=app_user

spring.datasource.password=CONTRASENA
```

## Ejecucion

Desde NetBeans:

1. Abrir el proyecto `asset-management-api`.
2. Configurar el JDK 21.
3. Verificar la configuracion de la base de datos.
4. Ejecutar el proyecto como aplicacion Spring Boot.

Tambien se puede ejecutar mediante Maven Wrapper:

```powershell
.\mvnw.cmd spring-boot:run
```

El backend queda disponible por defecto en:

```text
http://localhost:8080
```

## Base de datos

El backend utiliza MySQL como sistema gestor de base de datos.

La configuracion de JPA utiliza:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

No se utilizan las opciones `create`, `create-drop` o `update`, debido a que la base de datos puede ser compartida y su estructura debe administrarse de forma controlada.

## Autenticacion

El sistema utiliza autenticacion mediante correo electronico, contrasena y tokens JWT.

### Inicio de sesion

Endpoint:

```http
POST /api/v1/auth/login
```

Solicitud:

```json
{
    "email": "usuario@example.com",
    "password": "contrasena"
}
```

Respuesta exitosa:

```json
{
    "token": "eyJ...",
    "id": 1,
    "name": "Nombre del usuario",
    "email": "usuario@example.com",
    "role": "Nombre del rol"
}
```

El token JWT generado contiene informacion necesaria para identificar al usuario autenticado y controlar el acceso a los recursos protegidos.

### Creacion de usuarios

La creacion de usuarios requiere autenticacion y autorizacion mediante permisos.

Endpoint:

```http
POST /api/v1/users
```

Este endpoint requiere el permiso rol `SUPERUSER`.

Actualmente el rol `SUPERUSER` posee el permiso `ALL`, por lo que puede crear usuarios.

Solicitud:

```json
{
    "name": "Juan Perez",
    "email": "juan@ctposa.ac.cr",
    "password": "123456",
    "role": "BASIC_USER"
}
```

Respuesta exitosa:

```http
201 Created
```

```json
{
    "id": 2,
    "name": "Juan Perez",
    "email": "juan@ctposa.ac.cr",
    "role": "BASIC_USER",
    "active": true
}
```

Las contrasenas son almacenadas mediante BCrypt. La contrasena y su hash no se incluyen en la respuesta del endpoint.

El correo debe ser unico y el rol indicado debe existir en la base de datos.

### Autorizacion

Los endpoints protegidos requieren un token JWT valido mediante el encabezado:

```http
Authorization: Bearer <TOKEN>
```

El sistema utiliza roles y permisos para controlar el acceso a las operaciones.

Actualmente se utiliza el permiso `ALL` para otorgar acceso completo al `SUPERUSER`.

### Codigos de respuesta

| Codigo             | Significado                                                           |
| ------------------ | --------------------------------------------------------------------- |
| `200 OK`           | Inicio de sesion o consulta exitosa                                   |
| `201 Created`      | Recurso creado correctamente                                          |
| `400 Bad Request`  | Datos faltantes, formato invalido, correo duplicado o rol inexistente |
| `401 Unauthorized` | Credenciales incorrectas o falta de autenticacion                     |
| `403 Forbidden`    | Usuario autenticado sin permisos para realizar la operacion           |

La autenticacion mediante JWT y la autorizacion mediante roles y permisos se encuentran implementadas.

## Estado actual

Actualmente el backend cuenta con:

* Estructura inicial de Spring Boot.

* Configuracion con Java 25.

* Configuracion de Maven.

* Spring Web.

* Spring Data JPA.

* Hibernate.

* Spring Security.

* Validacion de datos.

* Conexion con MySQL.

* Perfiles de configuracion local.

* Modelo inicial de usuarios y roles.

* Autenticacion mediante correo y contrasena.

* Validacion de credenciales.

* Generacion de tokens JWT.

* Manejo de errores HTTP para autenticacion y autorizacion.

* Configuracion para proteger endpoints mediante JWT.

* Autorizacion mediante roles y permisos.

* Creacion de usuarios mediante endpoint protegido.

* Validacion de correo duplicado.

* Almacenamiento seguro de contrasenas mediante BCrypt.

* Modificacion del rol de un usuario mediante endpoint PATCH protegido (HU-GU-04).

* Registro de activos mediante endpoint POST protegido, con formulario y trazabilidad (HU-GA-01).

Las funcionalidades de gestion de activos, inventario, roles, permisos y auditoria continuaran implementandose por etapas.

## Seguridad

No se deben almacenar en el repositorio:

* Contrasenas de usuarios.

* Credenciales de la base de datos.

* Secretos utilizados para firmar tokens JWT.

* Tokens JWT.

* Archivos de configuracion local que contengan informacion sensible.

La configuracion sensible debe mantenerse en archivos locales o variables de entorno y debe excluirse del control de versiones.

## Git

Las ramas principales utilizadas durante el desarrollo son:

```text
main

sprint/01

feature/backend-setup

feature/database-connection

feature/asset-crud
```

Las funcionalidades nuevas deben desarrollarse preferiblemente en ramas `feature/*` y posteriormente integrarse mediante el flujo definido para el proyecto.

## Licencia

Proyecto academico desarrollado para el CTP Osa.


## Integración de actualización de usuarios (HU-GU-03)

Se conserva la base `sistema-gestion-activos1.zip` y su estructura Java
(config, controller, dto, exception, model, repository, security y service).
La pantalla de actualización del otro proyecto fue adaptada a la interfaz,
autenticación y auditoría de la versión base.

- Entrar a `panel.html` con rol `SUPERUSER` y elegir **Actualizar usuario**.
- Indicar ID, nombre, correo y rol; la contraseña es opcional.
- `PUT /api/v1/users/{id}` requiere el rol `SUPERUSER`.
- La actualización crea una entrada `UPDATE_USER` en la tabla `auditoria`
  dentro de la misma transacción, sin guardar contraseñas ni sus hashes.
- Si cambia su propia cuenta, el administrador debe iniciar sesión de nuevo.
- Configurar `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` como variables
  del entorno antes de ejecutar la aplicación. Nunca publicar credenciales reales.

Nota: Este archivo ZIP contiene exclusivamente el código fuente del proyecto;
no incluye historial Git ni archivos de credenciales reales.


## Modificacion de rol de usuario (HU-GU-04)

Permite al superusuario cambiar el rol de una cuenta existente para administrar sus permisos.

### Endpoint

```http
PATCH /api/v1/users/{id}/role
```

Requiere el rol `SUPERUSER` y el encabezado `Authorization: Bearer <TOKEN>`.

Solicitud:

```json
{
    "role": "INTERMEDIATE_USER"
}
```

Respuesta exitosa:

```http
200 OK
```

```json
{
    "id": 2,
    "name": "Juan Perez",
    "email": "juan@ctposa.ac.cr",
    "role": "INTERMEDIATE_USER",
    "active": true
}
```

| Codigo             | Cuando ocurre                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `200 OK`           | El rol se modifico correctamente                                                               |
| `400 Bad Request`  | Rol vacio o inexistente, usuario inexistente, el usuario ya tiene ese rol o regla de CA04       |
| `401 Unauthorized` | Falta el token o no es valido                                                                  |
| `403 Forbidden`    | El usuario autenticado no es `SUPERUSER`                                                       |

### Reglas de negocio

* CA03: el rol es obligatorio y debe existir en la base de datos.

* CA04: no se puede quitar el rol `SUPERUSER` al ultimo superusuario activo. El sistema responde `400` con el mensaje "No se puede cambiar el rol: el sistema debe conservar al menos un superusuario activo".

* Si el usuario ya tiene el rol indicado se responde `400` y no se registra ningun cambio.

* Un superusuario puede cambiar su propio rol siempre que exista otro superusuario activo. El filtro JWT consulta el rol en la base de datos, por lo que el cambio aplica de inmediato.

### Trazabilidad

Cada cambio guarda un registro en la tabla `auditoria` dentro de la misma transaccion:

* `accion`: `UPDATE_USER_ROLE`

* `tabla_afectada`: `usuario`

* `id_usuario`: superusuario que realizo la accion

* `detalles`: ID y correo del usuario modificado, rol anterior y rol nuevo

* `fecha_hora`: la asigna MySQL con `CURRENT_TIMESTAMP`

### Interfaz

La pantalla `modificar-rol.html` se abre desde el panel con **Modificar rol de usuario** y usa los mismos estilos que el resto de pantallas (`css/login.css` y `css/crear-usuario.css`).

* Se indica el ID del usuario y se elige el nuevo rol de una lista (Superusuario, Usuario intermedio, Usuario basico).

* CA03: si no se selecciona un rol se muestra el error y no se envia nada al servidor.

* CA02: **Cancelar** descarta los datos, no envia ninguna solicitud y vuelve al panel.

* CA04: el mensaje de rechazo del servidor se muestra en pantalla.

* Sin sesion se redirige a `index.html`. Si el usuario no es `SUPERUSER` se redirige a `panel.html`.

* Si el superusuario cambia el rol de su propia cuenta, se cierra la sesion y debe iniciar sesion nuevamente.

### Archivos nuevos o modificados

```text
backend/.../controller/UserController.java              (nuevo metodo updateUserRole)
backend/.../service/UserService.java                    (nuevo metodo updateUserRole)
backend/.../repository/UserRepository.java             (countByRoleNameAndActive)
backend/.../dto/user/UpdateUserRoleRequest.java         (nuevo)
backend/.../config/SecurityConfig.java                  (se permite /modificar-rol.html)
frontend/modificar-rol.html                             (nuevo)
frontend/js/modificar-rol.js                            (nuevo)
frontend/js/modificar-rol-validaciones.js               (nuevo)
frontend/panel.html y frontend/js/panel.js              (enlace a la nueva pantalla)
```

### Pruebas unitarias

Backend (JUnit 5 y Mockito, sin base de datos):

```powershell
.\mvnw.cmd test
```

* `UpdateUserRoleServiceTest`: CA01, CA03 y CA04 sobre `UserService.updateUserRole()`.

* `UpdateUserRoleRequestTest`: CA01 y CA03 sobre la validacion del rol.

* `UserRoleControllerTest`: respuesta 200, endpoint PATCH protegido y respuesta 400 de CA04.

Frontend (Node.js 18 o superior, sin navegador), desde la carpeta `frontend`:

```powershell
node --test tests/modificar-rol.test.cjs
```

Para ejecutar todas las pruebas del frontend: `node --test tests/*.test.cjs`.

| Criterio | Backend | Frontend |
| -------- | ------- | -------- |
| CA01 Cambio de rol exitoso | si | si |
| CA02 Cancelacion | no aplica | si |
| CA03 No se selecciona un rol | si | si |
| CA04 Intento de dejar el sistema sin superusuarios | si | si |


## Registro de activos (HU-GA-01)

Permite al superusuario registrar un activo mediante un formulario para anadirlo al sistema y permitir su gestion. Cada activo se guarda en la tabla `bien`.

### Endpoints

| Metodo y ruta                  | Quien puede usarlo                    | Para que sirve                                           |
| ------------------------------ | ------------------------------------- | -------------------------------------------------------- |
| `POST /api/v1/assets`          | `SUPERUSER`                           | Registrar un activo                                      |
| `GET /api/v1/assets`           | `SUPERUSER` o permiso `ASSET_READ`    | Lista de activos, para comprobar que el registro quedo   |
| `GET /api/v1/assets/catalog`   | `SUPERUSER`                           | Opciones de las listas desplegables del formulario       |
| `GET /api/v1/assets/{id}/audit`| `SUPERUSER`                           | Trazabilidad del activo: quien, cuando y que accion      |

Todos requieren el encabezado `Authorization: Bearer <TOKEN>`.

Solicitud de registro:

```json
{
    "assetNumber": "ACT-2026-0001",
    "description": "Computadora portatil de escritorio",
    "brand": "Dell",
    "model": "OptiPlex 7010",
    "serial": "SN-8841207",
    "price": 450000.00,
    "statusId": 1,
    "locationId": 2,
    "categoryId": 3,
    "acquisitionModeId": 4,
    "currentResponsibleId": null,
    "notes": "Entregado con cargador"
}
```

Respuesta exitosa:

```http
201 Created
```

```json
{
    "id": 5,
    "assetNumber": "ACT-2026-0001",
    "description": "Computadora portatil de escritorio",
    "brand": "Dell",
    "model": "OptiPlex 7010",
    "serial": "SN-8841207",
    "price": 450000.00,
    "status": "Bueno",
    "location": "Laboratorio 1",
    "category": "Equipo de computo",
    "acquisitionMode": "Compra",
    "currentResponsible": null,
    "decommissioned": false,
    "notes": "Entregado con cargador"
}
```

| Codigo             | Cuando ocurre                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `201 Created`      | El activo se registro correctamente                                                             |
| `400 Bad Request`  | Datos obligatorios incompletos, formato invalido, activo ya existente, catalogo o responsable inexistente |
| `401 Unauthorized` | Falta el token o no es valido                                                                   |
| `403 Forbidden`    | El usuario autenticado no es `SUPERUSER`                                                        |

### Datos del formulario

| Campo                  | Obligatorio | Regla                                                                  |
| ---------------------- | ----------- | ---------------------------------------------------------------------- |
| `assetNumber`          | si          | Unico, hasta 50 caracteres: letras, numeros, punto, guion y barra, sin espacios (`numero_id`) |
| `description`          | si          | Hasta 500 caracteres                                                   |
| `categoryId`           | si          | Debe existir en la tabla `categoria`                                   |
| `statusId`             | si          | Debe existir en la tabla `estado`                                      |
| `locationId`           | si          | Debe existir en la tabla `ubicacion`                                   |
| `acquisitionModeId`    | si          | Debe existir en la tabla `modo_adquisicion`                            |
| `brand`, `model`, `serial` | no      | Hasta 50 caracteres cada uno                                           |
| `price`                | no          | Punto decimal, maximo 10 enteros y 2 decimales, no negativo            |
| `currentResponsibleId` | no          | Usuario existente y activo                                             |
| `notes`                | no          | Hasta 1000 caracteres                                                  |

Al registrar, `dado_baja` queda en `false` y `id_acta` en `NULL`.

### Reglas de negocio

* CA02 y CA03: se validan los datos obligatorios y el formato tanto en la interfaz como en el backend.

* CA04: si el numero de identificacion ya existe se responde `400` con el mensaje "Ya existe un activo con ese numero de identificacion". La restriccion `UNIQUE` de MySQL cubre ademas los registros simultaneos.

* Los datos de catalogo (estado, ubicacion, categoria y modo de adquisicion) y el responsable deben existir en la base de datos.

### Trazabilidad

Cada registro guarda una fila en la tabla `auditoria` dentro de la misma transaccion:

* `accion`: `CREATE_ASSET`

* `tabla_afectada`: `bien`

* `id_usuario`: superusuario que realizo la accion

* `detalles`: empieza con `id_activo=<ID>;` seguido del numero, categoria, estado y ubicacion del activo

* `fecha_hora`: la asigna MySQL con `CURRENT_TIMESTAMP`

El superusuario puede consultarla con `GET /api/v1/assets/{id}/audit`.

### Datos iniciales de catalogos

El formulario necesita opciones en sus listas. Al iniciar, si una de las tablas `estado`, `modo_adquisicion`, `categoria` o `ubicacion` esta vacia, `DataInitializer` inserta valores iniciales:

* Estados: Nuevo, Bueno, Regular, Malo.

* Modos de adquisicion: Compra, Donacion, Traspaso.

* Categorias: Equipo de computo, Mobiliario, Equipo de laboratorio, Otros.

* Ubicacion: Bodega general (Edificio principal).

Si la tabla ya tiene datos no se modifica. Los valores reales de la institucion se administran directamente en la base de datos.

### Interfaz

La pantalla `registrar-activo.html` se abre desde el panel con **Registrar activo** y usa el mismo diseno que el resto de pantallas (`css/app.css`).

* Las listas desplegables se llenan con `GET /api/v1/assets/catalog`.

* CA02 y CA03: se senalan los campos con error junto a cada campo, con un ejemplo de entrada, y no se envia nada al servidor.

* CA01: al registrar se muestra el mensaje de confirmacion con el numero y el ID del activo.

* CA04: el mensaje de rechazo del servidor se muestra en pantalla.

* CA05: **Cancelar** descarta los datos, no envia ninguna solicitud y vuelve al panel.

* Sin sesion se redirige a `index.html`. Si el usuario no es `SUPERUSER` se redirige a `panel.html`.

### Archivos nuevos o modificados

```text
backend/.../model/Asset.java, AssetStatus.java, Location.java, Category.java, AcquisitionMode.java   (nuevos)
backend/.../model/Audit.java                            (fecha_hora de solo lectura)
backend/.../repository/AssetRepository.java y los 4 repositorios de catalogos   (nuevos)
backend/.../repository/AuditRepository.java y UserRepository.java              (nuevas consultas)
backend/.../dto/asset/*                                 (nuevos)
backend/.../service/AssetService.java                   (nuevo)
backend/.../controller/AssetController.java             (nuevo)
backend/.../config/DataInitializer.java                 (datos iniciales de catalogos)
backend/.../config/SecurityConfig.java                  (se permite /registrar-activo.html)
frontend/registrar-activo.html                          (nuevo)
frontend/js/registrar-activo.js                         (nuevo)
frontend/js/registrar-activo-validaciones.js            (nuevo)
frontend/panel.html                                     (enlace a la nueva pantalla)
```

### Pruebas unitarias

Backend (JUnit 5 y Mockito, sin base de datos):

```powershell
.\mvnw.cmd test
```

* `AssetServiceTest`: CA01, CA02 y CA04 sobre `AssetService`.

* `CreateAssetRequestTest`: CA01, CA02 y CA03 sobre la validacion de los datos.

* `AssetControllerTest`: respuesta 201, endpoint protegido y respuesta 400 de CA04.

Frontend (Node.js 18 o superior, sin navegador), desde la carpeta `frontend`:

```powershell
node --test tests/registrar-activo.test.cjs
```

Para ejecutar todas las pruebas del frontend: `node --test tests/*.test.cjs`.

| Criterio | Backend | Frontend |
| -------- | ------- | -------- |
| CA01 Se registra de manera exitosa el activo | si | si |
| CA02 Datos obligatorios incompletos | si | si |
| CA03 Formato invalido de los datos | si | si |
| CA04 El activo ya existe | si | si |
| CA05 Se cancela el registro | no aplica | si |
