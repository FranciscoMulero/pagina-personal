"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Obtiene el año actual automáticamente.
  const elementoAnio = document.getElementById("anio-actual");

  if (elementoAnio) {
    elementoAnio.textContent = String(new Date().getFullYear());
  }

  // Hace que el botón vuelva al principio de la página.
  const botonVolverArriba = document.getElementById("volver-arriba");

  if (botonVolverArriba) {
    botonVolverArriba.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
});