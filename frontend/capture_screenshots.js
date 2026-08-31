import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/GunaPawan/.gemini/antigravity-ide/brain/65c34c0f-1c14-4dbb-8381-afaa6541720c';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Complete onboarding
  await page.goto('http://localhost:5173/?new=1');
  await page.waitForTimeout(400);
  await page.fill('input[placeholder="Your name"]', 'Alex');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400);
  await page.click('text=Some experience');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400);
  await page.fill('input[placeholder=\'e.g. "Become a backend developer"\']', 'Become a Backend Engineer');
  await page.click('text=Chart my path');

  // Wait for graph navigation
  await page.waitForURL(/\/graph\//, { timeout: 10000 });
  await page.waitForTimeout(2000); // allow graph simulation to settle & fit

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'graph_view.png') });
  console.log('Graph view screenshot captured!');

  await browser.close();
}

run().catch(console.error);
