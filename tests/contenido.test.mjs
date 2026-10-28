import test from "node:test";
import assert from "node:assert/strict";

import { PERFIL } from "./perfil.mjs";

import {
  leerFichero,
  extraerAtributos,
  existeFicheroEnlace
} from "./utilidades.mjs";

const PAGINAS = [
  "index.html",
  "proyectos.html"
];

function extraerBloque(html, etiqueta, atributo, valor) {
  const etiquetas = html.match(
    new RegExp(`<${etiqueta}\\b[^>]*>[\\s\\S]*?<\\/${etiqueta}>`, "gi")
  ) ?? [];

  return etiquetas.find((bloque) => {
    const atributos = extraerAtributos(
      bloque.slice(0, bloque.indexOf(">") + 1),
      etiqueta
    )[0] ?? {};

    return atributos[atributo] === valor;
  }) ?? "";
}

function contarCoincidencias(texto, expresion) {
  return [...texto.matchAll(expresion)].length;
}

for (const pagina of PAGINAS) {
  test(`${pagina}: contiene la estructura HTML obligatoria`, async () => {
    const html = await leerFichero(pagina);

    assert.match(
      html,
      /<html\b[^>]*\blang=["']es["']/i,
      `${pagina}: falta lang="es" en la etiqueta html`
    );

    assert.ok(
      extraerAtributos(html, "meta").some(
        (meta) => meta.charset?.toLowerCase() === "utf-8"
      ),
      `${pagina}: falta meta charset UTF-8`
    );

    assert.ok(
      extraerAtributos(html, "meta").some(
        (meta) => meta.name?.toLowerCase() === "viewport" &&
          meta.content.length > 0
      ),
      `${pagina}: falta una meta viewport válida`
    );

    assert.ok(
      extraerAtributos(html, "meta").some(
        (meta) => meta.name?.toLowerCase() === "description" &&
          meta.content.trim().length > 20
      ),
      `${pagina}: falta una meta description de más de 20 caracteres`
    );

    assert.equal(
      contarCoincidencias(html, /<h1\b[^>]*>/gi),
      1,
      `${pagina}: debe existir exactamente un h1`
    );

    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);

    assert.ok(
      h1 && h1[1].includes(PERFIL.nombre),
      `${pagina}: el h1 debe contener el nombre esperado`
    );

    for (const etiqueta of ["header", "nav", "main", "footer"]) {
      assert.ok(
        extraerAtributos(html, etiqueta).length > 0,
        `${pagina}: falta la etiqueta ${etiqueta}`
      );
    }
  });

  test(`${pagina}: todas las imágenes tienen texto alternativo`, async () => {
    const html = await leerFichero(pagina);
    const imagenes = extraerAtributos(html, "img");

    assert.ok(
      imagenes.length > 0,
      `${pagina}: falta la imagen del avatar`
    );

    for (const imagen of imagenes) {
      assert.ok(
        typeof imagen.alt === "string" && imagen.alt.trim().length >= 3,
        `${pagina}: hay una imagen sin un alt de al menos 3 caracteres`
      );
    }
  });

  test(`${pagina}: las rutas son relativas y los enlaces internos existen`, async () => {
    const html = await leerFichero(pagina);

    const enlaces = extraerAtributos(html, "a");
    const imagenes = extraerAtributos(html, "img");
    const hojasEstilo = extraerAtributos(html, "link");
    const scripts = extraerAtributos(html, "script");

    const rutas = [
      ...enlaces.map((atributo) => ({
        atributo: "href",
        valor: atributo.href
      })),
      ...imagenes.map((atributo) => ({
        atributo: "src",
        valor: atributo.src
      })),
      ...hojasEstilo.map((atributo) => ({
        atributo: "href",
        valor: atributo.href
      })),
      ...scripts.map((atributo) => ({
        atributo: "src",
        valor: atributo.src
      }))
    ].filter((ruta) => ruta.valor);

    for (const ruta of rutas) {
      assert.ok(
        !ruta.valor.startsWith("/"),
        `${pagina}: la ruta ${ruta.valor} no debe empezar por /`
      );

      if (
        ruta.atributo === "href" &&
        /^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(ruta.valor)
      ) {
        continue;
      }

      if (ruta.valor.startsWith("#")) {
        continue;
      }

      assert.ok(
        existeFicheroEnlace(pagina, ruta.valor),
        `${pagina}: el enlace interno ${ruta.valor} no apunta a un fichero existente`
      );
    }
  });

  test(`${pagina}: los enlaces externos se abren de forma segura`, async () => {
    const html = await leerFichero(pagina);
    const enlaces = extraerAtributos(html, "a");

    for (const enlace of enlaces) {
      if (!/^https?:\/\//i.test(enlace.href ?? "")) {
        continue;
      }

      assert.equal(
        enlace.target,
        "_blank",
        `${pagina}: el enlace externo ${enlace.href} debe usar target="_blank"`
      );

      assert.ok(
        enlace.rel.split(/\s+/).includes("noopener"),
        `${pagina}: el enlace externo ${enlace.href} debe incluir rel="noopener"`
      );

      assert.ok(
        enlace.rel.split(/\s+/).includes("noreferrer"),
        `${pagina}: el enlace externo ${enlace.href} debe incluir rel="noreferrer"`
      );
    }
  });
}

test("index.html tiene el título y las secciones esperadas", async () => {
  const html = await leerFichero("index.html");

  const titulo = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);

  assert.ok(
    titulo && titulo[1].trim() === PERFIL.titulo,
    "index.html: el título no coincide con PERFIL.titulo"
  );

  for (const id of PERFIL.secciones) {
    const seccion = extraerBloque(html, "section", "id", id);

    assert.ok(
      seccion,
      `index.html: falta la sección con id="${id}"`
    );

    assert.match(
      seccion,
      /<h2\b[^>]*>[\s\S]*?<\/h2>/i,
      `index.html: la sección ${id} necesita un h2`
    );
  }
});

test("index.html tiene suficientes habilidades", async () => {
  const html = await leerFichero("index.html");
  const habilidades = extraerBloque(
    html,
    "section",
    "id",
    "habilidades"
  );

  assert.ok(
    habilidades,
    "index.html: falta la sección de habilidades"
  );

  const cantidad = contarCoincidencias(
    habilidades,
    /<li\b[^>]*>/gi
  );

  assert.ok(
    cantidad >= PERFIL.minimoHabilidades,
    `index.html: faltan habilidades; se necesitan al menos ${PERFIL.minimoHabilidades}`
  );
});

test("index.html tiene el correo y el enlace de GitHub correctos", async () => {
  const html = await leerFichero("index.html");
  const contacto = extraerBloque(html, "section", "id", "contacto");

  assert.ok(
    contacto,
    "index.html: falta la sección de contacto"
  );

  assert.ok(
    extraerAtributos(contacto, "a").some(
      (enlace) => enlace.href === `mailto:${PERFIL.email}`
    ),
    "index.html: falta el enlace mailto con el correo esperado"
  );

  assert.ok(
    extraerAtributos(contacto, "a").some(
      (enlace) => enlace.href === `https://github.com/${PERFIL.usuarioGithub}`
    ),
    "index.html: falta el enlace al perfil de GitHub esperado"
  );
});

test("proyectos.html contiene suficientes proyectos completos", async () => {
  const html = await leerFichero("proyectos.html");

  const articulos = html.match(
    /<article\b[^>]*class=["'][^"']*\bproyecto\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi
  ) ?? [];

  assert.ok(
    articulos.length >= PERFIL.minimoProyectos,
    `proyectos.html: faltan proyectos; se necesitan al menos ${PERFIL.minimoProyectos}`
  );

  for (const articulo of articulos) {
    assert.match(
      articulo,
      /<h[23]\b[^>]*>[\s\S]*?<\/h[23]>/i,
      "proyectos.html: cada proyecto necesita un h2 o h3"
    );

    assert.match(
      articulo,
      /<p\b[^>]*>[\s\S]*?<\/p>/i,
      "proyectos.html: cada proyecto necesita una descripción en un párrafo"
    );

    const listaTecnologias = articulo.match(
      /<ul\b[^>]*class=["'][^"']*\btecnologias\b[^"']*["'][^>]*>[\s\S]*?<\/ul>/i
    );

    assert.ok(
      listaTecnologias,
      "proyectos.html: cada proyecto necesita una lista ul.tecnologias"
    );
  }
});