import express from "express";
import puppeteer from "puppeteer";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  let browser;
  try {
    // Configuración de Puppeteer
    browser = await puppeteer.launch({
      headless: true, // Corre en modo headless
      args: [
        "--no-sandbox", // Desactiva el sandbox para compatibilidad en la nube
        "--disable-setuid-sandbox", // Opción adicional para evitar problemas de permisos
        "--disable-gpu", // Desactiva la GPU para entornos de servidor
        "--single-process", // Ejecuta en un solo proceso
        "--disable-dev-shm-usage", // Evita problemas de memoria compartida
      ],
      timeout: 60000, // Timeout más largo para garantizar la carga en la nube
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    const content = await page.evaluate(() => {
      const title = document.querySelector("h1#content")?.innerText || "";

      // Obtener el contenido del artículo
      const articleElement = document.querySelector("article");

      // Eliminar los elementos de encabezado (h1, h2, h3, h4) y obtener solo el texto
      if (articleElement) {
        // Clonamos el nodo para no alterar el DOM original
        const clonedArticle = articleElement.cloneNode(true);

        // Eliminamos los encabezados
        const headers = clonedArticle.querySelectorAll("h1, h2, h3, h4");
        headers.forEach((header) => header.remove());

        return {
          title,
          content: clonedArticle.innerText.trim(), // Solo el texto sin títulos
          links: Array.from(clonedArticle.querySelectorAll("a")).map((a) => ({
            text: a.innerText,
            href: a.href,
          })),
        };
      }

      return {
        title,
        content: "", // Si no hay artículo, el contenido será vacío
        links: [],
      };
    });

    // Respuesta exitosa con los datos scrapeados
    res.json(content);
  } catch (error) {
    console.error("Error al hacer scraping:", error);
    res.status(500).json({ error: "Error al hacer scraping" });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
