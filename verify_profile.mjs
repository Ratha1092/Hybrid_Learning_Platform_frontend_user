/**
 * Playwright verification — Profile page redesign
 * Blanket-mocks localhost:8000 so no 401 can redirect us away.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE = "http://localhost:5173";
const API  = "http://localhost:8000";
const SS   = "/tmp/pw_profile_screenshots";
mkdirSync(SS, { recursive: true });

const FAKE_USER = {
  id: 1, name: "Ratha Torn", email: "maosakseth16@gmail.com",
  role: "student", instructor_status: null, avatar_url: null,
  created_at: "2024-07-01T00:00:00.000Z",
};
const FAKE_PROFILE = {
  success: true,
  data: {
    profile: { id:1, name:"Ratha Torn", email:"maosakseth16@gmail.com",
      phone:"", bio:"", learning_goals:"", interests:["Web Development"],
      github:"", linkedin:"", avatar:null, avatar_url:null },
    courses: [], addresses: [],
  },
};

async function shot(page, name) {
  await page.screenshot({ path: join(SS, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function makePage(browser, viewport = { width: 1440, height: 900 }) {
  const ctx  = await browser.newContext({ viewport });
  const page = await ctx.newPage();

  // One blanket rule: anything on port 8000 → return appropriate 200 mock
  await page.route(`${API}/**`, (route) => {
    const url = route.request().url();
    let body;
    if (url.includes("/users/me"))
      body = { data: FAKE_USER };
    else if (url.includes("/profile/dashboard"))
      body = FAKE_PROFILE;
    else if (url.includes("/orders"))
      body = { data: { data: [], last_page: 1, current_page: 1 } };
    else
      body = { data: [], success: true };
    return route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify(body) });
  });

  // Inject user into localStorage before any script runs
  await page.addInitScript((u) => {
    localStorage.setItem("user", JSON.stringify(u));
  }, FAKE_USER);

  return { page, ctx };
}

const results = [];

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

  // ─────────────────────────────────────────────────────────────────
  // STEP 1: Cold load /profile + measure
  // ─────────────────────────────────────────────────────────────────
  console.log("\n[1] Cold load: /profile");
  const { page, ctx } = await makePage(browser);

  const t0 = Date.now();
  await page.goto(`${BASE}/profile`, { waitUntil: "load", timeout: 15000 });
  // Wait for profile content to settle (mocked APIs respond instantly)
  await page.waitForTimeout(800);
  const t_load = Date.now() - t0;
  console.log(`  ⏱  load + settle: ${t_load}ms`);
  results.push({ step: "Cold load /profile (load + 800ms settle)", ms: t_load });

  const greeting = await page.locator("h1").first().textContent();
  console.log(`  h1: "${greeting?.trim()}"`);

  const sidebarVisible  = await page.locator("aside").first().isVisible().catch(() => false);
  const navButtons      = await page.locator("aside button").count();
  const activeBtn       = page.locator("aside button.grad-blue, aside button[class*='grad-blue']").first();
  const activeBtnText   = await activeBtn.textContent().catch(() => "none");
  console.log(`  sidebar: visible=${sidebarVisible}, buttons=${navButtons}, active="${activeBtnText?.trim()}"`);
  await shot(page, "01_overview_desktop");

  results.push({
    step: "Overview: sidebar renders with 8 items, active=Overview",
    pass: sidebarVisible && navButtons === 8 && !!activeBtnText?.includes("Overview"),
    details: `visible=${sidebarVisible}, navBtns=${navButtons}, active="${activeBtnText?.trim()}"`,
  });

  // ─────────────────────────────────────────────────────────────────
  // STEP 2: Sidebar geometry — sticky position + 256px width
  // ─────────────────────────────────────────────────────────────────
  console.log("\n[2] Sidebar geometry");
  const asideBox = await page.locator("aside").first().boundingBox();
  const stickyPos = await page.locator("aside > div").first()
    .evaluate(el => getComputedStyle(el).position);
  console.log(`  aside width: ${asideBox?.width?.toFixed(0)}px  (expected 256)`);
  console.log(`  sidebar inner div position: "${stickyPos}"  (expected "sticky")`);
  results.push({
    step: "Sidebar: sticky + 256px width on 1440px viewport",
    pass: stickyPos === "sticky" && Math.abs((asideBox?.width ?? 0) - 256) < 10,
    details: `position="${stickyPos}", width=${asideBox?.width?.toFixed(0)}px`,
  });

  // ─────────────────────────────────────────────────────────────────
  // STEP 3: Overview page content
  // ─────────────────────────────────────────────────────────────────
  console.log("\n[3] Overview content");
  const profileInitial   = await page.locator("div.grad-blue").first().textContent().catch(() => "");
  const hasStatTiles     = await page.locator("text=Enrolled courses").count() > 0;
  const hasContinue      = await page.locator("text=Continue learning").count() > 0;
  const hasStreak        = await page.locator("text=streak").count() > 0;
  console.log(`  avatar initial: "${profileInitial?.trim()}", statTiles=${hasStatTiles}, continueLearning=${hasContinue}, streak=${hasStreak}`);
  results.push({
    step: "Overview: stat tiles + Continue learning + streak card",
    pass: hasStatTiles && hasContinue && hasStreak,
    details: `statTiles=${hasStatTiles}, continueLearning=${hasContinue}, streak=${hasStreak}`,
  });

  // ─────────────────────────────────────────────────────────────────
  // STEP 4: Tab — My courses
  // ─────────────────────────────────────────────────────────────────
  console.log("\n[4] Tab: My courses");
  const t1 = Date.now();
  await page.locator("aside button", { hasText: "My courses" }).click();
  await page.waitForURL(/view=courses/, { timeout: 5000 });
  await page.waitForTimeout(500);
  const t_courses = Date.now() - t1;
  console.log(`  ⏱  tab switch: ${t_courses}ms`);
  results.push({ step: "My courses tab switch speed", ms: t_courses });

  const coursesH1 = await page.locator("h1").first().textContent();
  const coursesActiveNav = await page.locator("aside button.grad-blue, aside button[class*='grad-blue']").textContent().catch(() => "");
  console.log(`  h1: "${coursesH1?.trim()}", active nav: "${coursesActiveNav?.trim()}"`);
  await shot(page, "02_courses_tab");
  results.push({
    step: "My courses: h1 + active nav item updates",
    pass: coursesH1?.toLowerCase().includes("course") && coursesActiveNav?.includes("courses"),
    details: `h1="${coursesH1?.trim()}", activeNav="${coursesActiveNav?.trim()}"`,
  });

  // ─────────────────────────────────────────────────────────────────
  // STEP 5: Tab — Wishlist
  // ─────────────────────────────────────────────────────────────────
  console.log("\n[5] Tab: Wishlist");
  const t2 = Date.now();
  await page.locator("aside button", { hasText: "Wishlist" }).click();
  await page.waitForURL(/view=wishlist/, { timeout: 5000 });
  await page.waitForTimeout(400);
  const t_wish = Date.now() - t2;
  console.log(`  ⏱  tab switch: ${t_wish}ms`);
  results.push({ step: "Wishlist tab switch speed", ms: t_wish });

  const wishH1 = await page.locator("h1").first().textContent();
  console.log(`  h1: "${wishH1?.trim()}"`);
  await shot(page, "03_wishlist_tab");

  // ─────────────────────────────────────────────────────────────────
  // STEP 6: Tab — Profile (edit)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n[6] Tab: Profile (edit)");
  const t3 = Date.now();
  await page.locator("aside button", { hasText: /^Profile$/ }).click();
  await page.waitForURL(/view=edit/, { timeout: 5000 });
  await page.waitForTimeout(800);
  const t_edit = Date.now() - t3;
  console.log(`  ⏱  tab switch: ${t_edit}ms`);
  results.push({ step: "Profile (edit) tab switch speed", ms: t_edit });

  const editH1       = await page.locator("h1").first().textContent();
  const sectionCards = await page.locator("div.rounded-2xl h3").allTextContents();
  const stickyCards  = await page.locator("div.lg\\:sticky").count();
  console.log(`  h1: "${editH1?.trim()}"`);
  console.log(`  sections: [${sectionCards.join(" | ")}]`);
  console.log(`  sticky avatar card: ${stickyCards} element(s)`);
  await shot(page, "04_edit_profile");
  results.push({
    step: "Edit profile: h1 + 4 sections + sticky avatar card",
    pass: !!editH1?.includes("Edit") && sectionCards.length >= 4 && stickyCards >= 1,
    details: `h1="${editH1?.trim()}", sections=${sectionCards.length}, sticky=${stickyCards}`,
  });

  // ─────────────────────────────────────────────────────────────────
  // STEP 7: Dirty-state save bar
  // ─────────────────────────────────────────────────────────────────
  console.log("\n[7] Save bar: dirty-state detection");
  const nameInput = page.locator("input[name='name']").first();
  await nameInput.waitFor({ state: "visible", timeout: 8000 });
  await nameInput.click({ clickCount: 3 });
  await nameInput.type("X");
  await page.waitForTimeout(400);

  const saveBar      = page.locator("div.fixed.inset-x-0.bottom-0");
  const sbClass      = await saveBar.getAttribute("class");
  const isShowing    = sbClass?.includes("translate-y-0") && !sbClass?.includes("translate-y-full");
  console.log(`  save bar showing: ${isShowing}  (class: "…${sbClass?.slice(-50)}")`);
  await shot(page, "05_save_bar_dirty");
  results.push({
    step: "Save bar: slides up when form is dirty",
    pass: !!isShowing,
    details: `translate-y-0 present: ${isShowing}`,
  });

  // Discard
  await saveBar.locator("button", { hasText: "Discard" }).click();
  await page.waitForTimeout(400);
  const sbAfter   = await saveBar.getAttribute("class");
  const isHidden  = sbAfter?.includes("translate-y-full");
  console.log(`  after Discard: hidden=${isHidden}`);
  results.push({
    step: "Save bar: slides back down on Discard",
    pass: !!isHidden,
    details: `translate-y-full present after discard: ${isHidden}`,
  });

  // ─────────────────────────────────────────────────────────────────
  // STEP 8: Input focus ring
  // ─────────────────────────────────────────────────────────────────
  console.log("\n[8] Input focus ring");
  await nameInput.click();
  await page.waitForTimeout(150);
  const shadow = await nameInput.evaluate(el => getComputedStyle(el).boxShadow);
  const borderC = await nameInput.evaluate(el => getComputedStyle(el).borderColor);
  const hasRing = shadow !== "none" && shadow !== "";
  console.log(`  border: "${borderC}",  shadow: "${shadow.slice(0, 80)}"`);
  console.log(`  focus ring visible: ${hasRing}`);
  await shot(page, "06_input_focused");
  results.push({
    step: "Edit profile inputs: focus ring (box-shadow) on click",
    pass: hasRing,
    details: `border="${borderC}", shadow="${shadow.slice(0, 80)}"`,
  });

  // ─────────────────────────────────────────────────────────────────
  // STEP 9: Direct /profile/edit route
  // ─────────────────────────────────────────────────────────────────
  console.log("\n[9] Direct route: /profile/edit");
  const { page: p2, ctx: c2 } = await makePage(browser);
  const t4 = Date.now();
  await p2.goto(`${BASE}/profile/edit`, { waitUntil: "load", timeout: 15000 });
  await p2.waitForTimeout(800);
  const t_direct = Date.now() - t4;
  const directH1  = await p2.locator("h1").first().textContent().catch(() => "");
  const directSec = await p2.locator("div.rounded-2xl h3").allTextContents().catch(() => []);
  console.log(`  ⏱  load: ${t_direct}ms,  h1: "${directH1?.trim()}",  sections: ${directSec.length}`);
  await p2.screenshot({ path: join(SS, "07_direct_edit_route.png") });
  console.log("  📸 07_direct_edit_route.png");
  await c2.close();
  results.push({ step: "Direct /profile/edit route load", ms: t_direct });
  results.push({
    step: "Direct /profile/edit: renders correctly",
    pass: !!directH1?.includes("Edit") && directSec.length >= 4,
    details: `h1="${directH1?.trim()}", sections=${directSec.length}`,
  });

  // ─────────────────────────────────────────────────────────────────
  // STEP 10: Mobile (375px) — sidebar collapses to horizontal row
  // ─────────────────────────────────────────────────────────────────
  console.log("\n[10] Mobile (375px): sidebar horizontal scroll");
  const { page: pm, ctx: cm } = await makePage(browser, { width: 375, height: 812 });
  await pm.goto(`${BASE}/profile`, { waitUntil: "load", timeout: 15000 });
  await pm.waitForTimeout(600);
  const mNav     = pm.locator("nav").first();
  const mOverflow = await mNav.evaluate(el => getComputedStyle(el).overflowX);
  const mFlex    = await mNav.evaluate(el => getComputedStyle(el).flexDirection);
  console.log(`  overflow-x: "${mOverflow}", flex-direction: "${mFlex}"`);
  await pm.screenshot({ path: join(SS, "08_mobile_sidebar.png") });
  console.log("  📸 08_mobile_sidebar.png");
  await cm.close();
  results.push({
    step: "Mobile 375px: sidebar is horizontal-scroll row",
    pass: mOverflow === "auto" && mFlex === "row",
    details: `overflow-x="${mOverflow}", flex-direction="${mFlex}"`,
  });

  await ctx.close();
  await browser.close();

  // ─────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────
  const FAST = 500, OK = 1500;
  const pass  = results.filter(r => "pass" in r && r.pass).length;
  const total = results.filter(r => "pass" in r).length;
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  VERIFICATION RESULTS");
  console.log("══════════════════════════════════════════════════════════");
  for (const r of results) {
    if ("ms" in r) {
      const icon  = r.ms < FAST ? "✅" : r.ms < OK ? "⚠️" : "❌";
      const label = r.ms < FAST ? "fast" : r.ms < OK ? "acceptable" : "SLOW";
      console.log(`${icon} ${r.step}: ${r.ms}ms (${label})`);
    } else {
      console.log(`${r.pass ? "✅" : "❌"} ${r.step}`);
      if (r.details) console.log(`   → ${r.details}`);
    }
  }
  console.log(`\n  ${pass}/${total} checks passed`);
  console.log(`📁 Screenshots: ${SS}/`);
  if (pass < total) process.exit(1);
})().catch(err => { console.error("\nFATAL:", err.message); process.exit(1); });
