import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

// Step 1: Go to deck building page and select first character (Ironclad/Defect)
await page.goto("http://localhost:3000/deck-building", { waitUntil: "networkidle" });
await page.waitForSelector(".char-select__card", { timeout: 5000 });
const charCards = await page.$$(".char-select__card");
if (charCards.length > 0) {
  await charCards[0].click();
  await page.waitForTimeout(2000);
}

// Step 2: Take screenshot showing card pool with synergy pills
await page.screenshot({ path: "screenshots/02-card-pool-synergies.png", fullPage: false });
console.log("Screenshot 1: Card pool with synergy pills saved");

// Step 3: Scroll down in the card pool to see more cards
const poolEl = await page.$(".card-pool");
if (poolEl) {
  await poolEl.evaluate((el) => el.scrollTop = 400);
  await page.waitForTimeout(500);
}
await page.screenshot({ path: "screenshots/03-card-pool-scrolled.png", fullPage: false });
console.log("Screenshot 2: Scrolled card pool saved");

// Step 4: Click the Relics section to expand it
const relicHeader = await page.$(".relic-browser__header");
if (relicHeader) {
  await relicHeader.click();
  await page.waitForTimeout(1000);
}
await page.screenshot({ path: "screenshots/04-relic-browser-expanded.png", fullPage: false });
console.log("Screenshot 3: Expanded relic browser saved");

// Step 5: Double-click some cards to add them to deck
// Scroll card pool back to top first
if (poolEl) {
  await poolEl.evaluate((el) => el.scrollTop = 0);
  await page.waitForTimeout(300);
}

const poolCards = await page.$$(".pool-card");
const cardsToAdd = Math.min(6, poolCards.length);
for (let i = 0; i < cardsToAdd; i++) {
  await poolCards[i].dblclick();
  await page.waitForTimeout(200);
}
console.log(`Added ${cardsToAdd} cards to deck`);

// Step 6: Collapse relic browser first to see stats
if (relicHeader) {
  await relicHeader.click();
  await page.waitForTimeout(300);
}

await page.screenshot({ path: "screenshots/05-deck-with-synergies.png", fullPage: false });
console.log("Screenshot 4: Deck with synergy stats saved");

// Step 7: Expand relic browser again and click some relics to add them
if (relicHeader) {
  await relicHeader.click();
  await page.waitForTimeout(500);
}

const relicCards = await page.$$(".relic-card");
const relicsToAdd = Math.min(3, relicCards.length);
for (let i = 0; i < relicsToAdd; i++) {
  // Skip starting relics (they have --starting class)
  const isStarting = await relicCards[i].evaluate((el) => el.classList.contains("relic-card--starting"));
  if (!isStarting) {
    await relicCards[i].click();
    await page.waitForTimeout(200);
  }
}

await page.screenshot({ path: "screenshots/06-relics-added.png", fullPage: false });
console.log("Screenshot 5: Relics added saved");

await browser.close();
console.log("All verification screenshots saved!");
