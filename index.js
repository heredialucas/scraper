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
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--single-process",
        "--disable-dev-shm-usage",
      ],
      timeout: 60000,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    // Evaluar el contenido de la página y extraer los nombres de los productos
    const content = await page.evaluate(() => {
      // Ajusta el selector para los elementos de nombre de producto
      const productElements = document.querySelectorAll(
        ".browse-view .product-item .product-name"
      );

      // Mapea los nombres de los productos a un array
      const productNames = Array.from(productElements).map((product) =>
        product.innerText.trim()
      );

      return { productNames };
    });

    // Respuesta exitosa con los nombres de los productos
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
