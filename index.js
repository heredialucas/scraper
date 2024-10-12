import express from "express";
import puppeteer from "puppeteer";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // Optar por el nuevo modo Headless
      timeout: 60000,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    const content = await page.evaluate(() => {
      const title = document.querySelector("h1#content")?.innerText || "";
      const articleContent = document.querySelector("article")?.innerHTML || "";

      const links = Array.from(document.querySelectorAll("article a")).map(
        (a) => ({
          text: a.innerText,
          href: a.href,
        })
      );

      return {
        title,
        content: articleContent,
        links,
      };
    });

    // Return the successful response with scraped data
    res.json(content);
  } catch (error) {
    console.error("Error al hacer scraping:", error);
    // Return an error response
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
