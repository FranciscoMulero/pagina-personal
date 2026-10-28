import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIRECTORIO_TESTS = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(DIRECTORIO_TESTS, "..");

const FICHEROS_REQUERIDOS = [
  ".github/workflows/pages.yml",
  ".gitignore",
  ".htmlvalidate.json",
  "package.json",
  "README.md",
  "site/index.html",
  "site/proyectos.html",
  "site/css/estilos.css",
  "site/js/main.js",
  "site/img/avatar.svg",
  "tests/perfil.mjs",
  "tests/utilidades.mjs",
  "tests/estructura.test.mjs",
  "tests/contenido.test.mjs",
  "tests/estilo.test.mjs"
];

test("Existen todos los ficheros requeridos del proyecto", () => {
  for (const fichero of FICHEROS_REQUERIDOS) {
    assert.ok(
      existsSync(resolve(RAIZ, fichero)),
      `Falta el fichero requerido: ${fichero}`
    );
  }
});

test("El fichero .gitignore ignora node_modules", () => {
  const contenido = readFileSync(
    resolve(RAIZ, ".gitignore"),
    "utf8"
  );

  assert.match(
    contenido,
    /(^|\n)\s*node_modules\/?\s*(?:\r?\n|$)/,
    "Falta node_modules en el fichero .gitignore"
  );
});

test("Existe la configuración de GitHub Actions", () => {
  assert.ok(
    existsSync(
      resolve(RAIZ, ".github/workflows/pages.yml")
    ),
    "Falta el workflow de pruebas y despliegue de GitHub Pages"
  );
});