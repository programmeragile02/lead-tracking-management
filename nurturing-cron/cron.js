import fetch from "node-fetch";

const BASE_URL = process.env.APP_BASE_URL;;
const CRON_KEY = process.env.NURTURING_CRON_KEY;

async function call(path) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "x-cron-key": CRON_KEY,
      },
    });

    const json = await res.json();
    console.log(`[${new Date().toISOString()}] ${path}`, json);
  } catch (e) {
    console.error(`[CRON ERROR] ${path}`, e);
  }
}

// auto-resume → tiap 1 menit
setInterval(() => {
  call("/api/cron/nurturing/auto-resume");
}, 60 * 1000);

// send nurturing → tiap 5 menit
setInterval(() => {
  call("/api/cron/nurturing/send");
}, 5 * 60 * 1000);

console.log("🕒 Leadtrack cron runner started");
