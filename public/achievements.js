// ============================================================
//  achievements.js – Don't Troll Game
//  Tracks, saves, and toasts achievement unlocks
// ============================================================

const Achievements = (() => {

    const DEFS = [
        { id: 'first_blood',     name: 'FIRST BLOOD',      desc: 'Die for the first time',            icon: '💀' },
        { id: 'no_hit',          name: 'UNTOUCHABLE',       desc: 'Complete a level without dying',     icon: '✨' },
        { id: 'speedrunner',     name: 'SPEEDRUNNER',       desc: 'Complete a level in under 10s',      icon: '⚡' },
        { id: 'perfectionist',   name: 'PERFECTIONIST',     desc: 'Get 3 stars on any level',           icon: '⭐' },
        { id: 'masochist',       name: 'MASOCHIST',         desc: '100 total deaths',                   icon: '🔥' },
        { id: 'troll_survivor',  name: 'TROLL SURVIVOR',    desc: 'Complete Level 5',                   icon: '😈' },
        { id: 'troll_master',    name: 'TROLL MASTER',      desc: 'Complete all 10 handcrafted levels', icon: '👑' },
        { id: 'coin_lover',      name: 'COIN LOVER',        desc: 'Collect 10 coins',                   icon: '🪙' },
        { id: 'hell_entry',      name: 'HELL BOUND',        desc: 'Start a Hell Mode level',            icon: '🔴' },
        { id: 'hell_survivor',   name: 'HELL SURVIVOR',     desc: 'Complete any Hell Mode level',       icon: '💪' },
        { id: 'mirror_master',   name: 'MIRROR MASTER',     desc: 'Complete the Mirror level (Level 7)',icon: '🪞' },
        { id: 'persistent',      name: 'PERSISTENT',        desc: 'Retry a level 10 times',             icon: '🔁' },
    ];

    let unlocked = {};
    let stats    = { totalDeaths: 0, coinsCollected: 0, levelRetries: {} };

    // ── Persistence ────────────────────────────────────────
    function load() {
        try {
            const d = localStorage.getItem('donttroll_achievements');
            if (d) {
                const obj = JSON.parse(d);
                unlocked = obj.unlocked || {};
                stats    = Object.assign(stats, obj.stats || {});
            }
        } catch (_) {}
    }

    function save() {
        try {
            localStorage.setItem('donttroll_achievements', JSON.stringify({ unlocked, stats }));
        } catch (_) {}
    }

    // ── Toast notification ─────────────────────────────────
    let toastQueue = [];
    let toastShowing = false;

    function showToast(def) {
        toastQueue.push(def);
        if (!toastShowing) flushToast();
    }

    function flushToast() {
        if (!toastQueue.length) { toastShowing = false; return; }
        toastShowing = true;
        const def = toastQueue.shift();

        let toast = document.getElementById('ach-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'ach-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `
            <span class="ach-toast-icon">${def.icon}</span>
            <div class="ach-toast-text">
                <div class="ach-toast-title">ACHIEVEMENT UNLOCKED</div>
                <div class="ach-toast-name">${def.name}</div>
                <div class="ach-toast-desc">${def.desc}</div>
            </div>`;
        toast.className = 'ach-toast show';
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(flushToast, 500);
        }, 3200);
    }

    // ── Unlock ─────────────────────────────────────────────
    function unlock(id) {
        if (unlocked[id]) return;
        const def = DEFS.find(d => d.id === id);
        if (!def) return;
        unlocked[id] = Date.now();
        save();
        showToast(def);
    }

    // ── Event hooks ────────────────────────────────────────
    function onDeath(totalDeaths) {
        if (totalDeaths === 1)  unlock('first_blood');
        if (totalDeaths >= 100) unlock('masochist');
        stats.totalDeaths = totalDeaths;
        save();
    }

    function onLevelWin(levelIndex, deathCount, elapsedMs) {
        if (deathCount === 0)     unlock('no_hit');
        if (deathCount === 0)     unlock('perfectionist'); // 3 stars
        if (elapsedMs < 10000)    unlock('speedrunner');
        if (levelIndex === 4)     unlock('troll_survivor');
        if (levelIndex === 6)     unlock('mirror_master');
        if (levelIndex >= 9)      unlock('troll_master');
        save();
    }

    function onRetry(levelIndex) {
        stats.levelRetries[levelIndex] = (stats.levelRetries[levelIndex] || 0) + 1;
        const totalRetries = Object.values(stats.levelRetries).reduce((a, b) => a + b, 0);
        if (totalRetries >= 10) unlock('persistent');
        save();
    }

    function onCoinCollect() {
        stats.coinsCollected = (stats.coinsCollected || 0) + 1;
        if (stats.coinsCollected >= 10) unlock('coin_lover');
        save();
    }

    function onHellStart()   { unlock('hell_entry'); }
    function onHellWin()     { unlock('hell_survivor'); }

    // ── All achievements list (for display) ────────────────
    function getAll() {
        return DEFS.map(d => ({ ...d, earned: !!unlocked[d.id], earnedAt: unlocked[d.id] || null }));
    }

    load();
    return { unlock, onDeath, onLevelWin, onRetry, onCoinCollect, onHellStart, onHellWin, getAll };
})();
