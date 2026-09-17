# Sistema de Gestion de Activos

Sistema de Gestion de Activos para el CTP Osa.

Actualmente el proyecto se encuentra en desarrollo y cuenta con el backend de la aplicacion. El frontend sera incorporado posteriormente.

## Estructura del proyecto

```text
sistema-gestion-activos/
├── backend/
│   └── asset-management-api/
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/
│       │   │   └── resources/
│       │   ├── test/
│       │   └── ...
│       ├── .gitignore
│       ├── pom.xml
│       ├── mvnw
│       └── mvnw.cmd
│
├── frontend/
│   └── ...
│
└── README.md
```

## Backend

El backend se encuentra desarrollado utilizando:

* Java 25
* Spring Boot 4.1.1
* Maven
* Spring Web
* Spring Data JPA
* Hibernate
* Spring Security
* Validation
* MySQL

### Requisitos

Para ejecutar el backend se necesita:

* JDK 25
* NetBeans u otro IDE compatible con Maven
* Acceso a la base de datos MySQL
* Credenciales de acceso a la base de datos

El proyecto incluye Maven Wrapper, por lo que no es necesario instalar Maven manualmente.

## Configuracion

La aplicacion utiliza los perfiles de configuracion de Spring Boot para separar la configuracion general de la configuracion local.

El archivo:

```text
src/main/resources/application.properties
```

contiene la configuracion general del proyecto y activa el perfil `local` durante el desarrollo.

La configuracion especifica del entorno local debe encontrarse en:

```text
src/main/resources/application-local.properties
```

Este archivo **no se encuentra incluido en el repositorio**, ya que contiene informacion sensible, como las credenciales de la base de datos.

### Configuracion local

Cada desarrollador debe crear manualmente el archivo:

```text
src/main/resources/application-local.properties
```

con la siguiente estructura:

```properties
spring.datasource.url=jdbc:mysql://HOST:PUERTO/NOMBRE_BASE_DATOS
spring.datasource.username=USUARIO
spring.datasource.password=CONTRASENA
```

Se deben reemplazar los valores de ejemplo por las credenciales correspondientes al entorno de desarrollo.

Por ejemplo:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/control_activos
spring.datasource.username=app_user
spring.datasource.password=TU_CONTRASENA
```

**No se deben agregar credenciales reales al repositorio.**

El archivo `application-local.properties` se encuentra excluido mediante `.gitignore`.

### Ejecucion

El proyecto esta configurado para utilizar el perfil `local` durante el desarrollo.

Para ejecutar el backend desde NetBeans:

1. Abrir el proyecto `asset-management-api`.
2. Verificar que el archivo `application-local.properties` exista dentro de `src/main/resources/`.
3. Verificar que las credenciales de la base de datos sean correctas.
4. Ejecutar el proyecto utilizando la opcion **Run Project** de NetBeans.

La aplicacion se inicia por defecto en:

```text
http://localhost:8080
```

## Base de datos

El backend utiliza MySQL como sistema gestor de base de datos.

La aplicacion utiliza:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

Esto permite que Hibernate valide que la estructura de la base de datos sea compatible con las entidades sin modificar automaticamente las tablas existentes.

No se deben utilizar configuraciones como `create`, `create-drop` o `update` en este proyecto, debido a que la base de datos es compartida entre los integrantes del equipo.

## Estado del proyecto

Actualmente se encuentra configurada la estructura inicial del backend, incluyendo:

* Spring Boot
* Java 25
* Maven
* Spring Web
* Spring Data JPA
* Hibernate
* Spring Security
* Validation
* MySQL
* Conexion con la base de datos
* Configuracion mediante perfiles de Spring Boot
* Configuracion del entorno local

Las entidades, repositorios, servicios, controladores, autenticacion y autorizacion se desarrollaran progresivamente durante los sprints del proyecto.

## Git

El proyecto utiliza Git para el control de versiones.

La rama `main` se utilizara para mantener la version estable e integrada del proyecto.

Cada sprint tendra su propia rama:

```text
main
└── sprint/01
```

Dentro de los sprints se pueden crear ramas de funcionalidad cuando sea necesario:

```text
main
└── sprint/01
    ├── feature/backend-setup
    ├── feature/database-connection
    └── feature/asset-crud
```

Las funcionalidades terminadas se integraran primero en la rama correspondiente al sprint y posteriormente el sprint se integrara a `main`.

## Seguridad

Las credenciales, contrasenas y cualquier otra informacion sensible no deben almacenarse directamente en el repositorio.

La configuracion local debe mantenerse en:

```text
application-local.properties
```

Este archivo se encuentra excluido mediante `.gitignore`.

Cada integrante debe utilizar sus propias credenciales de desarrollo y mantenerlas fuera del repositorio.

## Licencia

Proyecto academico desarrollado para el CTP Osa.
