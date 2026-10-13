const usuario = document.getElementById("usuario");
const contrasena = document.getElementById("contrasena");

const botonMostrar = document.getElementById("mostrar-contrasena");
const botonLogin = document.getElementById("boton-login");

const errorUsuario = document.getElementById("error-usuario");
const errorContrasena = document.getElementById("error-contrasena");

const mensaje = document.getElementById("mensaje-formulario");
const formulario = document.getElementById("formulario-login");

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();
});

botonMostrar.addEventListener("click", function () {
  const estaOculta = contrasena.type === "password";

  contrasena.type = estaOculta ? "text" : "password";

  botonMostrar.textContent = estaOculta ? "Ocultar" : "Mostrar";

  botonMostrar.setAttribute(
    "aria-label",
    estaOculta ? "Ocultar contraseña" : "Mostrar contraseña",
  );

  botonMostrar.setAttribute("aria-pressed", String(estaOculta));
});

function limpiarError(campo, elementoError) {
  campo.classList.remove("campo-invalido");
  campo.removeAttribute("aria-invalid");
  elementoError.textContent = "";
  mensaje.textContent = "";
  mensaje.className = "mensaje-formulario";
}

usuario.addEventListener("input", function () {
  limpiarError(usuario, errorUsuario);
});

contrasena.addEventListener("input", function () {
  limpiarError(contrasena, errorContrasena);
});

botonLogin.addEventListener("click", function () {
  limpiarError(usuario, errorUsuario);
  limpiarError(contrasena, errorContrasena);

  let camposValidos = true;

  if (usuario.value.trim() === "") {
    errorUsuario.textContent = "Ingrese su usuario o correo.";
    usuario.classList.add("campo-invalido");
    usuario.setAttribute("aria-invalid", "true");
    camposValidos = false;
  }

  if (contrasena.value === "") {
    errorContrasena.textContent = "Ingrese su contraseña.";
    contrasena.classList.add("campo-invalido");
    contrasena.setAttribute("aria-invalid", "true");
    camposValidos = false;
  }

  if (!camposValidos) {
    if (usuario.value.trim() === "") {
      usuario.focus();
    } else {
      contrasena.focus();
    }
    return;
  }

  mensaje.textContent =
    "Formulario completo. La verificación de credenciales estará disponible cuando se integre el backend.";

  mensaje.classList.add("informacion");
});
