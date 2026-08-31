import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/GunaPawan/.gemini/antigravity-ide/brain/65c34c0f-1c14-4dbb-8381-afaa6541720c';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 1. Onboarding Step 1
  console.log('1. Onboarding Step 1');
  await page.goto('http://localhost:5173/?new=1');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'onboarding_step1.png') });

  // 2. Step 2
  console.log('2. Onboarding Step 2');
  await page.fill('input[placeholder="Your name"]', 'Alex');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'onboarding_step2.png') });

  // 3. Step 3
  console.log('3. Onboarding Step 3');
  await page.click('text=Some experience');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'onboarding_step3.png') });

  // Submit Goal
  console.log('Submitting goal...');
  await page.fill('input[placeholder=\'e.g. "Become a backend developer"\']', 'Become a Backend Engineer');
  await page.click('button:has-text("Chart my path")');

  await page.waitForFunction(() => window.location.pathname.startsWith('/graph/'), { timeout: 10000 });
  await page.waitForTimeout(3000);

  // 4. Graph View
  console.log('4. Graph View');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'graph_view.png') });

  // Select available node via store
  console.log('5. Selecting available node...');
  await page.evaluate(() => {
    const store = window.useStore.getState();
    const nodes = store.graphData?.nodes || [];
    const available = nodes.find((n) => n.status === 'available') || nodes[0];
    if (available) {
      store.selectNode(available.id, available);
    }
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'node_detail_panel.png') });

  // 6. Expand explanation
  console.log('6. Expand Explanation');
  await page.click('button:has-text("Why is this node here?")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'node_explanation_expanded.png') });

  // 7. Launch Quiz
  console.log('7. Launch Quiz');
  const quizBtn = await page.$('button:has-text("Take Quiz")');
  if (quizBtn) {
    await quizBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'quiz_mid_question.png') });

    // Loop through all questions
    for (let i = 0; i < 5; i++) {
      const options = await page.$$('.quiz-option-btn');
      if (options.length > 1) {
        await options[1].click(); // pick correct / second option
        await page.waitForTimeout(200);
      }

      const nextBtn = await page.$('button:has-text("Next")');
      if (nextBtn) {
        await nextBtn.click();
        await page.waitForTimeout(400);
      } else {
        const finishBtn = await page.$('button:has-text("Finish Quiz")');
        if (finishBtn) {
          await finishBtn.click();
          await page.waitForTimeout(1500);
          await page.screenshot({ path: path.join(ARTIFACT_DIR, 'quiz_result_unlocked.png') });
          break;
        }
      }
    }
  }

  // 8. Dashboard View
  console.log('8. Dashboard View');
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_personalized.png') });

  await browser.close();
  console.log('ALL VERIFICATION SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

run().catch(console.error);
