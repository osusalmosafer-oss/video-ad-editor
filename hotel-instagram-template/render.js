const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
const globalRoot = execSync('npm root -g').toString().trim();
const { chromium } = require(path.join(globalRoot, 'playwright'));

const ICONS = {
  meal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v8M4 2v5a2 2 0 0 0 2 2 2 2 0 0 0 2-2V2M6 12v10"/><path d="M18 2c-2 0-3 2-3 6s1 4 3 4v10"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>'
};

function metaItem(icon, text) {
  return `<div class="meta-item">${ICONS[icon]}<span>${text}</span></div>`;
}

function abs(p) {
  return 'file://' + path.resolve(__dirname, p);
}

function build(hotelDataPath, format) {
  const data = JSON.parse(fs.readFileSync(hotelDataPath, 'utf-8'));
  let template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf-8');

  const isStory = format === 'story';
  const CANVAS_W = 1080;
  const CANVAS_H = isStory ? 1920 : 1350;

  const nameLen = data.hotelName.length;
  const HOTEL_NAME_SIZE = nameLen > 28 ? 46 : nameLen > 20 ? 54 : 62;
  const charsPerLine = nameLen > 28 ? 34 : nameLen > 20 ? 30 : 26;
  const estimatedLines = Math.max(1, Math.ceil(nameLen / charsPerLine));
  const metaCount = [data.meals, data.offerDate, data.distanceFromHaram].filter(Boolean).length;
  const density = (estimatedLines - 1) * 2 + metaCount;
  const GAP_SCALE = density >= 4 ? 0.62 : density >= 2 ? 0.85 : 1;
  const PANEL_PAD_TOP_EXTRA = (estimatedLines - 1) * 40;

  const heroFactor = isStory ? 0.40 : (density >= 4 ? 0.40 : 0.44);
  const HERO_H = Math.round(CANVAS_H * heroFactor);
  const PANEL_TOP = HERO_H - 70;
  const MEDALLION_TOP = HERO_H - 110;
  const PANEL_PAD_TOP_BASE = 190;
  const FOOT_PAD = 8;

  const heroPct = (HERO_H / CANVAS_H) * 100;
  const SCRIM_START = Math.max(18, Math.round(heroPct - 14));
  const SCRIM_MID = Math.round(heroPct + 6);
  const SCRIM_LATE = Math.min(88, Math.round(heroPct + 26));

  const metaBlocks = [];
  const mealsBlock = data.meals ? metaItem('meal', data.meals) : '';
  const dateBlock = data.offerDate ? metaItem('calendar', data.offerDate) : '';
  const distanceBlock = data.distanceFromHaram ? metaItem('pin', data.distanceFromHaram) : '';

  const replacements = {
    CANVAS_W, CANVAS_H, HERO_H, PANEL_TOP, MEDALLION_TOP,
    SCRIM_START, SCRIM_MID, SCRIM_LATE,
    PANEL_PAD_TOP: PANEL_PAD_TOP_BASE + PANEL_PAD_TOP_EXTRA, FOOT_PAD, GAP_SCALE,
    PANEL_PAD_BOTTOM: isStory ? 260 : 50,
    PANEL_JUSTIFY: isStory ? 'center' : 'flex-start',
    PANEL_CONTENT_HEIGHT: isStory ? `${CANVAS_H - PANEL_TOP}px` : 'auto',
    HOTEL_NAME_SIZE,
    HOTEL_PHOTO: abs(data.hotelPhoto),
    AGENCY_LOGO: abs(data.agencyLogo),
    HOTEL_LOGO: abs(data.hotelLogo),
    AGENCY_LOGO_ICON: abs('assets/osus-logo-icon.png'),
    LOCATION: data.location || '',
    HOTEL_NAME: data.hotelName,
    ROOM_TYPE: data.roomType,
    PRICE: data.pricePerNight,
    CURRENCY: data.currency,
    MEALS_BLOCK: mealsBlock,
    DATE_BLOCK: dateBlock,
    DISTANCE_BLOCK: distanceBlock,
    WHATSAPP: data.whatsapp,
    OFFER_DATE: data.offerDate || ''
  };

  for (const [key, val] of Object.entries(replacements)) {
    template = template.split(`{{${key}}}`).join(val);
  }

  return { html: template, CANVAS_W, CANVAS_H };
}

(async () => {
  const [,, hotelJson, formatArg, outName] = process.argv;
  const format = formatArg || 'post';
  const { html, CANVAS_W, CANVAS_H } = build(hotelJson, format);

  const tmpHtml = path.join(__dirname, 'output', `_tmp_${Date.now()}.html`);
  fs.writeFileSync(tmpHtml, html);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: CANVAS_W, height: CANVAS_H } });
  await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const outPath = path.join(__dirname, 'output', outName || `output_${format}.png`);
  await page.screenshot({ path: outPath });
  await browser.close();
  if (!process.env.KEEP_TMP) fs.unlinkSync(tmpHtml);
  else console.log('kept tmp html at', tmpHtml);
  console.log('Saved:', outPath);
})();
