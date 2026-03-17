import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000";
const outPath = process.argv[3] || "screenshot.png";
const actions = process.argv[4] || "";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });

// Execute actions if provided
if (actions === "select-ironclad") {
  // Click first character card (Ironclad)
  await page.waitForSelector(".char-select__card", { timeout: 5000 });
  const cards = await page.$$(".char-select__card");
  if (cards.length > 0) {
    await cards[0].click();
    await page.waitForTimeout(2000); // wait for cards to load
  }
} else if (actions === "select-ironclad-add-cards") {
  await page.waitForSelector(".char-select__card", { timeout: 5000 });
  const cards = await page.$$(".char-select__card");
  if (cards.length > 0) {
    await cards[0].click();
    await page.waitForTimeout(2000);
    // Double-click a few cards to add them
    const poolCards = await page.$$(".pool-card");
    for (let i = 0; i < Math.min(3, poolCards.length); i++) {
      await poolCards[i].dblclick();
      await page.waitForTimeout(300);
    }
  }
}

await page.screenshot({ path: outPath, fullPage: false });
console.log(`Screenshot saved to ${outPath}`);
await browser.close();
