import { chromium } from "playwright";
import { encodeDeck } from "../src/shared/codec";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

// Create a permalink for a Silent deck with some cards
const encoded = encodeDeck("SILENT", [
  "STRIKE_SILENT", "STRIKE_SILENT", "STRIKE_SILENT", "STRIKE_SILENT", "STRIKE_SILENT",
  "DEFEND_SILENT", "DEFEND_SILENT", "DEFEND_SILENT", "DEFEND_SILENT", "DEFEND_SILENT",
  "NEUTRALIZE", "SURVIVOR",
  "ACCURACY", "BLADE_DANCE", "POISONED_STAB",
]);

console.log("Encoded deck:", encoded);
const url = `http://localhost:3000/deck-building?deck=${encoded}`;
console.log("URL:", url);

// Load permalink URL
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(3000); // Wait for all queries to resolve

await page.screenshot({ path: "screenshots/permalink-01-loaded.png" });
console.log("Saved: permalink-01-loaded.png");

// Also test normal flow
await page.goto("http://localhost:3000/deck-building", { waitUntil: "networkidle" });
await page.waitForSelector(".char-select__card", { timeout: 5000 });
const charCards = await page.$$(".char-select__card");
// Click Silent (last one alphabetically)
if (charCards.length >= 5) await charCards[4].click();
await page.waitForTimeout(2000);

// Add some cards
const poolCards = await page.$$(".pool-card");
for (let i = 0; i < Math.min(4, poolCards.length); i++) {
  await poolCards[i].dblclick();
  await page.waitForTimeout(200);
}

await page.screenshot({ path: "screenshots/permalink-02-normal-flow.png" });
console.log("Saved: permalink-02-normal-flow.png");

await browser.close();
console.log("Done!");
