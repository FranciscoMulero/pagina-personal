import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIRECTORIO_TESTS = dirname(fileURLToPath(import.meta.url));
const DIRECTORIO_RAIZ = resolve(DIRECTORIO_TESTS, "..");
const DIRECTORIO_SITE = resolve(DIRECTORIO_RAIZ, "site");

/**
 * Lee un fichero dentro de site/.
 * @param {string} ruta Ruta relativa a site/.
 * @returns {Promise<string>} Contenido del fichero.
 */
export async function leerFichero(ruta) {
  const rutaCompleta = resolve(DIRECTORIO_SITE, ruta);

  if (
    rutaCompleta !== DIRECTORIO_SITE &&
    !rutaCompleta.startsWith(DIRECTORIO_SITE + "/") &&
    !rutaCompleta.startsWith(DIRECTORIO_SITE + "\\")
  ) {
    throw new Error("La ruta debe pertenecer al directorio site.");
  }

  return readFile(rutaCompleta, "utf8");
}

/**
 * Extrae los atributos de las etiquetas de un tipo determinado.
 * Admite atributos con comillas dobles, simples o sin comillas.
 * @param {string} html Código HTML.
 * @param {string} etiqueta Nombre de la etiqueta.
 * @returns {Array<Record<string, string>>} Lista de atributos.
 */
export function extraerAtributos(html, etiqueta) {
  const etiquetas = [];
  const expresion = new RegExp(
    `<${etiqueta}\\b([^>]*)>`,
    "gi"
  );

  let coincidencia;

  while ((coincidencia = expresion.exec(html)) !== null) {
    const atributos = {};
    const textoAtributos = coincidencia[1];

    const expresionAtributos =
      /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

    let atributo;

    while (
      (atributo = expresionAtributos.exec(textoAtributos)) !== null
    ) {
      const nombre = atributo[1].toLowerCase();

      const valor =
        atributo[2] ??
        atributo[3] ??
        atributo[4] ??
        "";

      atributos[nombre] = valor;
    }

    etiquetas.push(atributos);
  }

  return etiquetas;
}

/**
 * Comprueba si un enlace interno relativo apunta a un fichero existente.
 * Los fragmentos y parámetros no forman parte de la ruta del fichero.
 * @param {string} pagina Página HTML de origen.
 * @param {string} enlace Valor del href o src.
 * @returns {boolean} True si el fichero existe.
 */
export function existeFicheroEnlace(pagina, enlace) {
  if (
    !enlace ||
    enlace.startsWith("/") ||
    enlace.startsWith("//") ||
    enlace.startsWith("#")
  ) {
    return false;
  }

  if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(enlace)) {
    return false;
  }

  const rutaLimpia = decodeURIComponent(
    enlace.split("#")[0].split("?")[0]
  );

  if (!rutaLimpia) {
    return true;
  }

  const directorioPagina = dirname(
    resolve(DIRECTORIO_SITE, pagina)
  );

  const rutaDestino = resolve(directorioPagina, rutaLimpia);

  if (
    rutaDestino !== DIRECTORIO_SITE &&
    !rutaDestino.startsWith(DIRECTORIO_SITE + "/") &&
    !rutaDestino.startsWith(DIRECTORIO_SITE + "\\")
  ) {
    return false;
  }

  return existsSync(rutaDestino);
}