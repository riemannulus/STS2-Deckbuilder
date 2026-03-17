import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

// 1. Go to deck building and select Ironclad (2nd character)
await page.goto("http://localhost:3000/deck-building", { waitUntil: "networkidle" });
await page.waitForSelector(".char-select__card", { timeout: 5000 });
const charCards = await page.$$(".char-select__card");
// Ironclad is second (sorted alphabetically: Defect, Ironclad, Necrobinder, Regent, Silent)
if (charCards.length >= 2) await charCards[1].click();
await page.waitForTimeout(2000);

// 2. Screenshot: builder with starting deck + relics in header
await page.screenshot({ path: "screenshots/final-01-builder.png" });
console.log("Saved: final-01-builder.png");

// 3. Hover a relic in header to test tooltip
const headerRelics = await page.$$(".deck-builder__header-relic-wrap .relic");
if (headerRelics.length > 0) {
  await headerRelics[0].hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/final-02-relic-tooltip.png" });
  console.log("Saved: final-02-relic-tooltip.png");
  // Move mouse away
  await page.mouse.move(700, 400);
  await page.waitForTimeout(300);
}

// 4. Expand relic browser in sidebar and select a relic
const relicBrowserBtn = await page.$(".relic-browser__header");
if (relicBrowserBtn) {
  await relicBrowserBtn.click();
  await page.waitForTimeout(500);

  // Click first non-starting relic card to select it
  const relicCards = await page.$$(".relic-card:not(.relic-card--starting)");
  if (relicCards.length > 0) {
    await relicCards[0].click();
    await page.waitForTimeout(300);
  }
  if (relicCards.length > 1) {
    await relicCards[1].click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: "screenshots/final-03-relics-selected.png" });
  console.log("Saved: final-03-relics-selected.png");
}

// 5. Add some cards by double-clicking
const poolCards = await page.$$(".pool-card");
for (let i = 0; i < Math.min(5, poolCards.length); i++) {
  await poolCards[i].dblclick();
  await page.waitForTimeout(200);
}
await page.waitForTimeout(500);

// 6. Final screenshot with deck + relics + synergies
await page.screenshot({ path: "screenshots/final-04-full-state.png" });
console.log("Saved: final-04-full-state.png");

// 7. Scroll sidebar to see synergy breakdown
const sidebar = await page.$(".deck-builder__sidebar");
if (sidebar) {
  await sidebar.evaluate((el) => el.scrollTop = 0);
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/final-05-stats.png" });
  console.log("Saved: final-05-stats.png");
}

await browser.close();
console.log("Done!");
