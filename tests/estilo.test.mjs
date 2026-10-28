import test from "node:test";
import assert from "node:assert/strict";

import { PERFIL } from "./perfil.mjs";
import { leerFichero } from "./utilidades.mjs";

test("La paleta define todas las variables con sus valores exactos en :root", async () => {
  const css = await leerFichero("css/estilos.css");

  const coincidencia = css.match(/:root\s*\{([^}]*)\}/i);

  assert.ok(
    coincidencia,
    "Falta el bloque :root con las variables de la paleta"
  );

  const contenidoRoot = coincidencia[1];

  for (const [variable, valorEsperado] of Object.entries(PERFIL.paleta)) {
    const expresion = new RegExp(
      `(?:^|\\n)\\s*${variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+);`,
      "m"
    );

    const resultado = contenidoRoot.match(expresion);

    assert.ok(
      resultado,
      `Falta la variable ${variable} dentro de :root`
    );

    assert.equal(
      resultado[1].trim(),
      valorEsperado,
      `La variable ${variable} debe tener el valor ${valorEsperado}`
    );
  }
});

test("Los colores de la paleta solo aparecen como valores literales dentro de :root", async () => {
  const css = await leerFichero("css/estilos.css");

  const coincidencia = css.match(/:root\s*\{[^}]*\}/i);

  assert.ok(
    coincidencia,
    "No se puede comprobar la paleta porque falta el bloque :root"
  );

  const cssFueraRoot = css.replace(coincidencia[0], "");

  for (const [variable, valor] of Object.entries(PERFIL.paleta)) {
    const expresionColor = new RegExp(
      valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    assert.doesNotMatch(
      cssFueraRoot,
      expresionColor,
      `El color ${valor} de ${variable} aparece fuera de :root; utiliza var()`
    );
  }
});

test("La hoja de estilos utiliza la variable de color primario", async () => {
  const css = await leerFichero("css/estilos.css");

  assert.match(
    css,
    /var\(\s*--color-primario\s*\)/,
    "Falta el uso de var(--color-primario) en la hoja de estilos"
  );
});

test("La hoja de estilos utiliza las fuentes definidas en PERFIL", async () => {
  const css = await leerFichero("css/estilos.css");

  assert.ok(
    css.includes(PERFIL.fuenteTitulos),
    `Falta la fuente de títulos ${PERFIL.fuenteTitulos}`
  );

  assert.ok(
    css.includes(PERFIL.fuenteTexto),
    `Falta la fuente de texto ${PERFIL.fuenteTexto}`
  );
});

test("La hoja de estilos define el punto de ruptura esperado", async () => {
  const css = await leerFichero("css/estilos.css");

  const puntoRuptura = PERFIL.puntoRuptura.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const expresion = new RegExp(
    `@media\\s*\\(\\s*max-width\\s*:\\s*${puntoRuptura}\\s*\\)`,
    "i"
  );

  assert.match(
    css,
    expresion,
    `Falta la media query para pantallas de hasta ${PERFIL.puntoRuptura}`
  );
});

test("El modo oscuro se configura según PERFIL.modoOscuro", async () => {
  const css = await leerFichero("css/estilos.css");

  if (PERFIL.modoOscuro) {
    assert.match(
      css,
      /prefers-color-scheme\s*:\s*dark/i,
      "Falta la media query prefers-color-scheme: dark"
    );
  } else {
    assert.doesNotMatch(
      css,
      /prefers-color-scheme\s*:\s*dark/i,
      "No debe existir prefers-color-scheme: dark cuando el modo oscuro está desactivado"
    );
  }
});