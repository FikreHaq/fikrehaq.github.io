import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import {
    getDatabase,
    ref,
    runTransaction,
    onValue,
    set,
    push,
    remove,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

const FH_IDS = Object.freeze({
    footerRoot: "fhpage-custom-footer",
    footerMount: "fhpage-footer-mount",

    // سیشن کے مطابق زائرین
    totalVisits: "fhpage-total-visits-count",
    pageVisits: "fhpage-page-visits-count",

    // ہر لوڈ/ریفریش پر بڑھنے والے ملاحظات
    totalViews: "fhpage-total-views-count",
    pageViews: "fhpage-page-views-count",

    // براہِ راست موجود افراد
    liveTotal: "fhpage-live-total-count",
    livePage: "fhpage-live-page-count",

    copyrightYear: "fhpage-copyright-year-val",

    cacheTotalVisits: "fhpage_rtdb_total_v4",
    cachePageVisitsPrefix: "fhpage_rtdb_page_v4_",
    cacheTotalViews: "fhpage_rtdb_views_total_v1",
    cachePageViewsPrefix: "fhpage_rtdb_views_page_v1_"
});

const firebaseConfig = {
    apiKey: "AIzaSyC8BPwK7PGa9hk0o6isRMfxl-n6cnGop2s",
    authDomain: "fhpage-cda87.firebaseapp.com",
    databaseURL: "https://fhpage-cda87-default-rtdb.firebaseio.com",
    projectId: "fhpage-cda87",
    storageBucket: "fhpage-cda87.firebasestorage.app",
    messagingSenderId: "536731659210",
    appId: "1:536731659210:web:6649e9fa7c568f0931bd33",
    measurementId: "G-B40934Z090"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

function getPageKey() {
    const rawPath = window.location.pathname || "";
    const trimmed = rawPath.replace(/^\/+|\/+$/g, "");

    if (!trimmed || trimmed.toLowerCase() === "index.html" || trimmed.toLowerCase() === "index") {
        return "index";
    }

    // اگر پاتھ کے آخر میں index.html یا index ہے تو فولڈر کے ساتھ _index بنائیں
    if (/(?:^|\/)index(?:\.html)?$/i.test(trimmed)) {
        const folderPart = trimmed.replace(/(?:^|\/)index(?:\.html)?$/i, "");
        const cleanFolder = folderPart
            .replace(/[\/\-.#$\[\]]+/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "");
        return cleanFolder ? `${cleanFolder}_index` : "index";
    }

    // اگر پاتھ کے آخر میں .html ہے تو صرف .html ہٹا کر سادہ نام رکھیں
    if (/\.html$/i.test(trimmed)) {
        return trimmed
            .replace(/\.html$/i, "")
            .replace(/[\/\-.#$\[\]]+/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "") || "index";
    }

    // جن لنکس کے آخر میں نہ index ہے نہ .html (مثلاً /bs یا /rabta) انہیں بھی _index والی ٹری میں شامل کریں
    const cleanDir = trimmed
        .replace(/[\/\-.#$\[\]]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

    return cleanDir ? `${cleanDir}_index` : "index";
}

function formatCount(val) {
    return typeof val === "number" && !Number.isNaN(val) && val >= 0
        ? val.toLocaleString("en-US")
        : "0";
}

function updateUI(el, cacheKey, value) {
    if (!el) return;
    const safeVal = typeof value === "number" && !Number.isNaN(value) ? value : 0;
    if (cacheKey) {
        try {
            localStorage.setItem(cacheKey, String(safeVal));
        } catch (_) {}
    }
    el.textContent = formatCount(safeVal);
}

function incrementDbPath(dbPath) {
    return runTransaction(ref(db, dbPath), (curr) => {
        if (typeof curr === "number" && !Number.isNaN(curr)) {
            return curr + 1;
        }
        return 1;
    }).catch((err) => {
        console.error(`[FH Counter] Increment failed at "${dbPath}":`, err);
    });
}

function subscribeLiveCount(dbPath, uiEl, cacheKey = null) {
    if (!uiEl) return;
    onValue(
        ref(db, dbPath),
        (snapshot) => {
            const val = snapshot.val();
            if (typeof val === "number") {
                updateUI(uiEl, cacheKey, val);
            } else if (!snapshot.exists()) {
                updateUI(uiEl, cacheKey, 0);
            }
        },
        (err) => {
            console.error(`[FH Counter] Live read failed at "${dbPath}":`, err);
        }
    );
}

function subscribeLivePresenceCount(presencePath, uiEl) {
    if (!uiEl) return;
    onValue(
        ref(db, presencePath),
        (snapshot) => {
            const data = snapshot.val();
            let count = 0;
            if (data && typeof data === "object") {
                count = Object.values(data).filter((item) => item && item.online === true).length;
            }
            updateUI(uiEl, null, count);
        },
        (err) => {
            console.error(`[FH Counter] Presence read failed at "${presencePath}":`, err);
        }
    );
}

function setupPresence(pageKey) {
    const connectedRef = ref(db, ".info/connected");
    const siteEntryRef = push(ref(db, "presence/site"));
    const pageEntryRef = push(ref(db, `presence/pages/${pageKey}`));

    const markOnline = () => {
        const data = { online: true, page: pageKey, updatedAt: Date.now() };
        onDisconnect(siteEntryRef).remove().catch(() => {});
        onDisconnect(pageEntryRef).remove().catch(() => {});
        set(siteEntryRef, data).catch((err) => console.error("[FH Counter] Site presence error:", err));
        set(pageEntryRef, data).catch((err) => console.error("[FH Counter] Page presence error:", err));
    };

    const markOffline = () => {
        remove(siteEntryRef).catch(() => {});
        remove(pageEntryRef).catch(() => {});
    };

    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            markOnline();
        }
    });

    window.addEventListener("pagehide", markOffline);
    window.addEventListener("beforeunload", markOffline);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            markOffline();
        } else if (document.visibilityState === "visible") {
            markOnline();
        }
    });
}

function syncFooter() {
    const footerEl =
        document.getElementById(FH_IDS.footerRoot) ||
        document.getElementById(FH_IDS.footerMount) ||
        document.querySelector("footer.fh-footer");

    if (footerEl) {
        footerEl.setAttribute("dir", "rtl");
        footerEl.setAttribute("lang", "ur");
    }

    const yearEl = document.getElementById(FH_IDS.copyrightYear);
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }
}

async function runCounters() {
    const pageKey = getPageKey();

    const totalVisitsCacheKey = FH_IDS.cacheTotalVisits;
    const pageVisitsCacheKey = FH_IDS.cachePageVisitsPrefix + pageKey;
    const totalViewsCacheKey = FH_IDS.cacheTotalViews;
    const pageViewsCacheKey = FH_IDS.cachePageViewsPrefix + pageKey;

    const sessionKey = "fhpage_counted_" + pageKey;

    const totalVisitsEl = document.getElementById(FH_IDS.totalVisits);
    const pageVisitsEl = document.getElementById(FH_IDS.pageVisits);
    const totalViewsEl = document.getElementById(FH_IDS.totalViews);
    const pageViewsEl = document.getElementById(FH_IDS.pageViews);
    const liveTotalEl = document.getElementById(FH_IDS.liveTotal);
    const livePageEl = document.getElementById(FH_IDS.livePage);

    // 1. پہلے کیش شدہ قدریں دکھائیں تاکہ صفحہ فوری صاف نظر آئے
    const cachedTotalVisits = parseInt(localStorage.getItem(totalVisitsCacheKey) || "", 10);
    const cachedPageVisits = parseInt(localStorage.getItem(pageVisitsCacheKey) || "", 10);
    const cachedTotalViews = parseInt(localStorage.getItem(totalViewsCacheKey) || "", 10);
    const cachedPageViews = parseInt(localStorage.getItem(pageViewsCacheKey) || "", 10);

    if (!Number.isNaN(cachedTotalVisits)) updateUI(totalVisitsEl, null, cachedTotalVisits);
    if (!Number.isNaN(cachedPageVisits)) updateUI(pageVisitsEl, null, cachedPageVisits);
    if (!Number.isNaN(cachedTotalViews)) updateUI(totalViewsEl, null, cachedTotalViews);
    if (!Number.isNaN(cachedPageViews)) updateUI(pageViewsEl, null, cachedPageViews);

    // 2. پہلے گنتی بڑھائیں تاکہ ٹرانزیکشن مکمل ہو کر لائیو لسنر تازہ ترین عدد دکھائے
    const writes = [];
    if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1");
        writes.push(incrementDbPath("total"));
        writes.push(incrementDbPath(pageKey));
    }
    writes.push(incrementDbPath("views_total"));
    writes.push(incrementDbPath(`views_${pageKey}`));

    await Promise.allSettled(writes);

    // 3. اب لائیو اپ ڈیٹس اور آن لائن زائرین کو سننا شروع کریں
    subscribeLiveCount("total", totalVisitsEl, totalVisitsCacheKey);
    subscribeLiveCount(pageKey, pageVisitsEl, pageVisitsCacheKey);
    subscribeLiveCount("views_total", totalViewsEl, totalViewsCacheKey);
    subscribeLiveCount(`views_${pageKey}`, pageViewsEl, pageViewsCacheKey);

    subscribeLivePresenceCount("presence/site", liveTotalEl);
    subscribeLivePresenceCount(`presence/pages/${pageKey}`, livePageEl);
    setupPresence(pageKey);
}

function initDeferred() {
    syncFooter();
    const runner = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
    runner(() => {
        runCounters();
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDeferred, { once: true });
} else {
    initDeferred();
}
