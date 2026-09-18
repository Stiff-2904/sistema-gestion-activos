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

* Java 25
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

* JDK 25
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
2. Configurar el JDK 25.
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

El token JWT generado contiene informacion necesaria para identificar al usuario autenticado y posteriormente controlar el acceso a los recursos protegidos.

### Codigos de respuesta

| Codigo             | Significado                                                 |
| ------------------ | ----------------------------------------------------------- |
| `200 OK`           | Inicio de sesion exitoso                                    |
| `400 Bad Request`  | Datos faltantes o con formato invalido                      |
| `401 Unauthorized` | Credenciales incorrectas o falta de autenticacion           |
| `403 Forbidden`    | Usuario autenticado sin permisos para realizar la operacion |

La autenticacion mediante JWT y la validacion de credenciales se encuentran implementadas.

La autorizacion mediante roles y permisos continuara desarrollandose progresivamente.

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
* Manejo de errores HTTP para autenticacion.
* Configuracion inicial para proteger endpoints mediante JWT.

Las funcionalidades de gestion de usuarios, activos, inventario, roles, permisos y auditoria continuaran implementandose por etapas.

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
