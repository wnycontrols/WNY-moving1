// Weekly availability reminder emails for WNY Moving.
// Runs in GitHub Actions (see .github/workflows/weekly-reminder.yml).
//
// Required environment variables (set as GitHub Actions secrets):
//   SERVICE_ACCOUNT_JSON — Firebase service account key (read-only, datastore.viewer)
//   GMAIL_USER           — the Gmail address that sends the reminders
//   GMAIL_APP_PASSWORD   — a Gmail "App Password" for that address
// Optional:
//   SITE_URL             — the calendar's address (defaults to the GitHub Pages URL)
//   DRY_RUN              — if set, prints what would be sent without emailing

import crypto from 'node:crypto';

const SITE_URL = process.env.SITE_URL || 'https://wnycontrols.github.io/WNY-moving1/';
const DRY_RUN = !!process.env.DRY_RUN;
const sa = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
const PROJECT = sa.project_id;

// ── Mint a Google access token from the service account (no libraries needed) ──
function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(header + '.' + claims);
  const jwt = header + '.' + claims + '.' + b64url(signer.sign(sa.private_key));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt,
  });
  if (!res.ok) throw new Error('token exchange failed: ' + res.status + ' ' + (await res.text()));
  return (await res.json()).access_token;
}

// ── Firestore REST helpers ──
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
let TOKEN;
async function fsGet(url) {
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + TOKEN } });
  if (!res.ok) throw new Error('firestore read failed: ' + res.status + ' ' + (await res.text()));
  return res.json();
}
function fieldVal(f) {
  if (!f) return undefined;
  if ('stringValue' in f) return f.stringValue;
  if ('booleanValue' in f) return f.booleanValue;
  if ('integerValue' in f) return Number(f.integerValue);
  return undefined;
}

async function listEmployees() {
  const out = [];
  let pageToken = '';
  do {
    const data = await fsGet(FS + '/employees?pageSize=300' + (pageToken ? '&pageToken=' + pageToken : ''));
    for (const doc of data.documents || []) {
      const f = doc.fields || {};
      out.push({
        uid: doc.name.split('/').pop(),
        name: fieldVal(f.name) || 'there',
        email: fieldVal(f.email),
        active: fieldVal(f.active) !== false,
      });
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return out;
}

function dateKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

async function countUpcomingMarks() {
  // Marks per employee over the next 14 days.
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 13);
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'availability' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            { fieldFilter: { field: { fieldPath: 'date' }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: dateKey(start) } } },
            { fieldFilter: { field: { fieldPath: 'date' }, op: 'LESS_THAN_OR_EQUAL', value: { stringValue: dateKey(end) } } },
          ],
        },
      },
    },
  };
  const res = await fetch(FS.replace(/\/documents$/, '/documents:runQuery'), {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('availability query failed: ' + res.status + ' ' + (await res.text()));
  const rows = await res.json();
  const counts = {};
  for (const row of rows) {
    if (!row.document) continue;
    const uid = fieldVal(row.document.fields.uid);
    if (uid) counts[uid] = (counts[uid] || 0) + 1;
  }
  return counts;
}

function emailBody(name, filledCount) {
  const status = filledCount === 0
    ? 'You haven’t filled in any days for the next two weeks yet.'
    : 'You’ve filled in ' + filledCount + ' day' + (filledCount === 1 ? '' : 's') + ' for the next two weeks — please double-check they’re still right.';
  return `
  <div style="background:#000;color:#fff;padding:32px 24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:440px;margin:0 auto;border:1px solid #2a2a2a;padding:28px 24px;background:#0d0d0d">
      <div style="display:inline-block;border:2px solid #fff;padding:8px 10px;font-weight:800;letter-spacing:1px;font-size:14px;color:#fff">WNY</div>
      <h2 style="margin:18px 0 6px;font-size:18px;color:#fff">Hi ${name},</h2>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#9a9a9a">
        It’s time to update your availability for the coming weeks. ${status}
      </p>
      <a href="${SITE_URL}" style="display:inline-block;margin:18px 0 6px;background:#fff;color:#000;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px">Open the calendar</a>
      <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#5c5c5c">
        Tap a day, tap your name, and set Available / Partial / Unavailable.<br>
        — WNY Moving
      </p>
    </div>
  </div>`;
}

// ── Main ──
TOKEN = await getAccessToken();
const employees = (await listEmployees()).filter(e => e.active && e.email);
const counts = await countUpcomingMarks();
console.log('Active employees with an email address: ' + employees.length);

if (DRY_RUN) {
  for (const e of employees) {
    console.log('[dry-run] would email 1 person (upcoming days filled: ' + (counts[e.uid] || 0) + ')');
  }
  process.exit(0);
}

const nodemailer = (await import('nodemailer')).default;
const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

let sent = 0, failed = 0;
for (const e of employees) {
  try {
    await transport.sendMail({
      from: '"WNY Moving" <' + process.env.GMAIL_USER + '>',
      to: e.email,
      subject: 'WNY Moving — update your availability',
      html: emailBody(e.name, counts[e.uid] || 0),
    });
    sent++;
  } catch (err) {
    failed++;
    console.error('send failed for one recipient: ' + err.message);
  }
  await new Promise(r => setTimeout(r, 1500));
}
console.log('Reminders sent: ' + sent + (failed ? ' (failed: ' + failed + ')' : ''));
if (failed > 0 && sent === 0) process.exit(1);
