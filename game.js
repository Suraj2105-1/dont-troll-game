// ============================================
// GAME - Main game loop & state management
// ============================================

// ── Session Guard ─────────────────────────────
// If no user session found, send to login page.
(function checkSession() {
    const user = sessionStorage.getItem('dt_user') || localStorage.getItem('dt_user');
    if (!user) {
        window.location.replace('login.html');
    }
})();


// Game State
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    DEAD: 'dead',
    WIN: 'win',
    LEVEL_SELECT: 'level_select',
    COMPLETE: 'complete',
};

// ── Session user (from login page) ─────────────────────────────────
const _sessionUser = JSON.parse(
    sessionStorage.getItem('dt_user') || localStorage.getItem('dt_user') || '{"username":"GUEST"}'
);
const PLAYER_USERNAME = (_sessionUser.username || 'GUEST').toUpperCase();

// Game variables
let canvas, ctx;
let state = GameState.MENU;
let currentLevelIndex = 0;
let currentLevel = null;
let player = null;
let deathCount = 0;
let totalDeaths = 0;
let unlockedLevels = 1;
let deathTimer = 0;
let winTimer = 0;
let hintTimer = 0;
let hintAlpha = 0;
let levelStartTime = 0; // For speedrunner achievement

// Hell mode variables
let cameraX = 0;
let cameraY = 0;

// Hell Mode variables
let isHellMode = false;
let hellTier = 0;
let hellStartTime = 0;
let hellCurrentTime = 0;

// Settings
let gameSettings = {
    sound: true,
    difficulty: 'NORMAL',
    screenShake: true,
    showFPS: false,
};
const DIFFICULTIES = ['EASY', 'NORMAL', 'HARD'];

function loadSettings() {
    try {
        const saved = localStorage.getItem('donttroll_settings');
        if (saved) Object.assign(gameSettings, JSON.parse(saved));
    } catch (e) { }
}

function saveSettings() {
    try {
        localStorage.setItem('donttroll_settings', JSON.stringify(gameSettings));
    } catch (e) { }
}

function showSettings() {
    showScreen('settings-screen');
    updateSettingsUI();
}

function updateSettingsUI() {
    const soundBtn = document.getElementById('btn-sound');
    soundBtn.textContent = gameSettings.sound ? 'ON' : 'OFF';
    soundBtn.classList.toggle('active', gameSettings.sound);

    const diffBtn = document.getElementById('btn-difficulty');
    diffBtn.textContent = gameSettings.difficulty;

    const shakeBtn = document.getElementById('btn-shake');
    shakeBtn.textContent = gameSettings.screenShake ? 'ON' : 'OFF';
    shakeBtn.classList.toggle('active', gameSettings.screenShake);

    const fpsBtn = document.getElementById('btn-fps');
    fpsBtn.textContent = gameSettings.showFPS ? 'ON' : 'OFF';
    fpsBtn.classList.toggle('active', gameSettings.showFPS);
}

function toggleSound() {
    gameSettings.sound = !gameSettings.sound;
    SoundEngine.setEnabled(gameSettings.sound);
    saveSettings();
    updateSettingsUI();
    if (gameSettings.sound) SoundEngine.click();
}

function cycleDifficulty() {
    const idx = DIFFICULTIES.indexOf(gameSettings.difficulty);
    gameSettings.difficulty = DIFFICULTIES[(idx + 1) % DIFFICULTIES.length];
    saveSettings();
    updateSettingsUI();
}

function toggleShake() {
    gameSettings.screenShake = !gameSettings.screenShake;
    saveSettings();
    updateSettingsUI();
}

function toggleFPS() {
    gameSettings.showFPS = !gameSettings.showFPS;
    saveSettings();
    updateSettingsUI();
}

function resetProgress() {
    if (confirm('Reset ALL progress? This cannot be undone!')) {
        unlockedLevels = 1;
        totalDeaths = 0;
        saveProgress();
        showMenu();
    }
}

// === HELL MODE LOGIC ===
function showHellMenu() {
    showScreen('hell-screen');
    loadLeaderboard(0);
}

function loadLeaderboard(tier) {
    // Update active tab UI
    const tabs = document.querySelectorAll('.leaderboard-tabs .tab-btn');
    tabs.forEach((t, i) => {
        if (i === tier) t.classList.add('active');
        else t.classList.remove('active');
    });

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

    fetch(`http://localhost:3000/api/leaderboard/${tier}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data.length > 0) {
                tbody.innerHTML = '';
                data.data.forEach((row, i) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>#${i + 1}</td>
                        <td>${row.player_name}</td>
                        <td>${(row.time_ms / 1000).toFixed(2)}s</td>
                        <td>${row.deaths}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4">No runs yet. Be the first!</td></tr>';
            }
        })
        .catch(err => {
            tbody.innerHTML = '<tr><td colspan="4" style="color:red;">Error loading leaderboard.</td></tr>';
        });
}

function startHellLevel(tier) {
    isHellMode = true;
    hellTier = tier;
    hellStartTime = Date.now();
    Achievements.onHellStart();
    loadLevel(200 + tier); // Treat Hell levels as index 200, 201, 202
}

async function submitHellScore() {
    Achievements.onHellWin();
    const finalTime = Date.now() - hellStartTime;
    const playerName = prompt(`HELL SURVIVED in ${(finalTime / 1000).toFixed(2)}s with ${deathCount} deaths!\n\nEnter your name for the Leaderboard:`, PLAYER_USERNAME);
    
    if (playerName) {
        try {
            await fetch('http://localhost:3000/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_name: playerName,
                    tier: hellTier + 200, // Offset hell tiers so they don't clash with normal levels
                    time_ms: finalTime,
                    deaths: deathCount
                })
            });
        } catch (e) {
            console.error('Leaderboard error', e);
        }
    }
    
    isHellMode = false;
    showHellMenu();
}

// Automatically submit normal level scores in the background
function submitLevelScore(levelIndex, finalTime, deaths) {
    if (PLAYER_USERNAME === 'GUEST') return; // Don't clutter with guests
    fetch('http://localhost:3000/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            player_name: PLAYER_USERNAME,
            tier: levelIndex, // Normal level index
            time_ms: finalTime,
            deaths: deaths
        })
    }).catch(e => console.error('Silent leaderboard error', e));
}

// Load saved progress
function loadProgress() {
    try {
        const saved = localStorage.getItem('donttroll_progress');
        if (saved) {
            const data = JSON.parse(saved);
            const unlocked = data.unlocked || 1;
            // Sanity check: if all levels were unlocked (test mode leftover), reset to 1
            if (unlocked >= 200) {
                unlockedLevels = 1;
                totalDeaths = 0;
                localStorage.removeItem('donttroll_progress');
            } else {
                unlockedLevels = unlocked;
                totalDeaths = data.totalDeaths || 0;
            }
        }
    } catch (e) { }
}

function saveProgress() {
    try {
        localStorage.setItem('donttroll_progress', JSON.stringify({
            unlocked: unlockedLevels,
            totalDeaths: totalDeaths,
        }));
    } catch (e) { }
}

// Initialize
function init() {
    canvas = document.getElementById('gameCanvas');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    Renderer.init(canvas);
    loadProgress();

    // ── TEST MODE ── set to false when done testing
    const TEST_MODE = false;
    if (TEST_MODE) unlockedLevels = 200;

    loadSettings();
    SoundEngine.init();
    SoundEngine.setEnabled(gameSettings.sound);
    setupInput();
    gameLoop();
    document.addEventListener('click', function onFirstClick() {
        SoundEngine.menuJingle();
        document.removeEventListener('click', onFirstClick);
    }, { once: true });

    // ── CUSTOM LEVEL TEST MODE ──
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === '1') {
        setTimeout(loadCustomLevel, 100);
    }
}

function loadCustomLevel() {
    try {
        const data = localStorage.getItem('dt_test_level');
        if (!data) return;
        const parsed = JSON.parse(data);
        
        currentLevelIndex = -1; // Indicates custom level
        Renderer.currentWorld = 0;
        
        // Emulate the cloneLevel logic without scaling so we don't mess up builder coordinates
        currentLevel = parsed;
        // In the game engine, x/y coords assume a canvas scaling.
        // We'll scale it to fit the window exactly like base levels.
        const cw = window.innerWidth;
        const ch = window.innerHeight;
        const sy = ch / 500; // BASE_H
        const sx = sy;

        currentLevel.width = Math.max(...(currentLevel.platforms||[]).map(p => p.x + p.w), 800) * sx;
        currentLevel.playerStart = { x: parsed.playerStart.x * sx, y: parsed.playerStart.y * sy };
        if (currentLevel.door) {
            currentLevel.door.x *= sx; currentLevel.door.y *= sy;
            currentLevel.door.w *= sx; currentLevel.door.h *= sy;
        }
        
        const scaleArr = (arr) => {
            (arr||[]).forEach(item => {
                item.x *= sx; item.y *= sy;
                if (item.w) item.w *= sx;
                if (item.h) item.h *= sy;
                if (item.startX) item.startX *= sx;
                if (item.startY) item.startY *= sy;
                if (item.patrolRangeX) item.patrolRangeX *= sx;
                if (item.patrolRangeY) item.patrolRangeY *= sy;
            });
        };
        
        scaleArr(currentLevel.platforms);
        scaleArr(currentLevel.spikes);
        scaleArr(currentLevel.saws);
        scaleArr(currentLevel.coins);
        scaleArr(currentLevel.springs);
        
        // Traps don't need scaling EXCEPT triggerX/Y and data.newX/newY
        currentLevel.traps = (currentLevel.traps || []).map(t => {
            let trapData = { ...t };
            if (trapData.triggerX) trapData.triggerX *= sx;
            if (trapData.triggerY) trapData.triggerY *= sy;
            if (trapData.data && trapData.data.newX) trapData.data.newX *= sx;
            if (trapData.data && trapData.data.newY) trapData.data.newY *= sy;
            const tr = new Trap(trapData);
            if (tr.type === 'spike_rise' && currentLevel.spikes[tr.targetId]) {
                currentLevel.spikes[tr.targetId].active = false; // Force hide initially!
            }
            return tr;
        });

        player = new Player(currentLevel.playerStart.x, currentLevel.playerStart.y);
        currentLevel.player = player;
        deathCount = 0; deathTimer = 0; winTimer = 0; hintTimer = 180; hintAlpha = 1; levelStartTime = Date.now();
        cameraX = Math.max(0, player.x - canvas.width / 2); cameraY = 0;
        
        state = GameState.PLAYING;
        showScreen(null);
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('ui-overlay').style.pointerEvents = 'none';
        document.getElementById('game-hud').classList.remove('hidden');
        document.getElementById('pause-hint').classList.remove('hidden');
        
        updateHUD();
        SoundEngine.levelStart();
        SoundEngine.playBGM();
        const hudUser = document.getElementById('hud-username');
        if (hudUser) hudUser.textContent = '👤 ' + PLAYER_USERNAME;
        
    } catch(e) {
        console.error("Failed to load custom level", e);
    }
}

// Resize canvas to fill the full window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (state === GameState.LEVEL_SELECT) {
        initMap();
    }
}

// Input handling
function setupInput() {
    document.addEventListener('keydown', (e) => {
        if (!player) return;

        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                player.keys.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                player.keys.right = true;
                e.preventDefault();
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'Space':
                player.keys.jump = true;
                e.preventDefault();
                break;
            case 'Escape':
                if (state === GameState.PLAYING) {
                    togglePause();
                }
                break;
            case 'KeyR':
                if (state === GameState.PLAYING || state === GameState.DEAD) {
                    retryLevel();
                }
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (!player) return;

        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                player.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                player.keys.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'Space':
                player.keys.jump = false;
                break;
        }
    });
}

// ── Mobile Touch Controls ────────────────────────────────
function handleTouch(e, action, isDown) {
    e.preventDefault(); // Prevent scrolling/zooming
    if (!player || state !== GameState.PLAYING) return;
    
    if (action === 'left')  player.keys.left = isDown;
    if (action === 'right') player.keys.right = isDown;
    if (action === 'jump')  player.keys.jump = isDown;
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
}

function showMenu() {
    state = GameState.MENU;
    isPaused = false;
    SoundEngine.stopBGM();
    showScreen('menu-screen');
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('pause-hint').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('ui-overlay').style.pointerEvents = '';
    
    if (typeof mapCanvas !== 'undefined' && mapCanvas) {
        mapCanvas.style.display = 'none';
    }
}

// ── Pause ────────────────────────────────────────────────
let isPaused = false;

function togglePause() {
    isPaused = !isPaused;
    const overlay = document.getElementById('pause-overlay');
    if (isPaused) {
        overlay.classList.remove('hidden');
        SoundEngine.stopBGM();
        state = GameState.MENU;
    } else {
        resumeGame();
    }
}

function resumeGame() {
    isPaused = false;
    document.getElementById('pause-overlay').classList.add('hidden');
    state = GameState.PLAYING;
    SoundEngine.playBGM();
}

function showAchievements() {
    state = GameState.MENU;
    showScreen('achievements-screen');
    const list = document.getElementById('ach-list');
    list.innerHTML = '';
    const all = Achievements.getAll();
    all.forEach(ach => {
        const card = document.createElement('div');
        card.className = 'ach-card ' + (ach.earned ? 'earned' : '');
        card.innerHTML = `
            <div class="ach-icon">${ach.icon}</div>
            <div class="ach-info">
                <div class="ach-name">${ach.name}</div>
                <div class="ach-desc">${ach.desc}</div>
            </div>
        `;
        list.appendChild(card);
    });
}

let mapCanvas, mapCtx;
let mapOffset = 0;
let targetMapOffset = 0;
let mapNodes = [];
let hoveredNode = -1;

function initMap() {
    if (!mapCanvas) {
        mapCanvas = document.getElementById('mapCanvas');
        mapCtx = mapCanvas.getContext('2d');
        
        // Handle map clicks/taps
        const handleMapClick = (e) => {
            if (state !== GameState.LEVEL_SELECT) return;
            
            let clientX = e.clientX;
            let clientY = e.clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            
            const rect = mapCanvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            for (let i = 0; i < mapNodes.length; i++) {
                const node = mapNodes[i];
                const nx = node.x - mapOffset;
                if (x >= nx - 25 && x <= nx + 25 && y >= node.y - 30 && y <= node.y + 30) {
                    if (i < unlockedLevels) {
                        loadLevel(i);
                    }
                    break;
                }
            }
        };
        mapCanvas.addEventListener('mousedown', handleMapClick);
        mapCanvas.addEventListener('touchstart', handleMapClick, { passive: true });
        
        // Handle hover
        mapCanvas.addEventListener('mousemove', (e) => {
            if (state !== GameState.LEVEL_SELECT) return;
            const rect = mapCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            hoveredNode = -1;
            for (let i = 0; i < mapNodes.length; i++) {
                const node = mapNodes[i];
                const nx = node.x - mapOffset;
                if (x >= nx - 25 && x <= nx + 25 && y >= node.y - 30 && y <= node.y + 30) {
                    hoveredNode = i;
                    break;
                }
            }
            
            const nameLabel = document.getElementById('map-level-name');
            if (hoveredNode !== -1 && hoveredNode < unlockedLevels) {
                const world = Math.floor(hoveredNode / 25) + 1;
                const subLevel = (hoveredNode % 25) + 1;
                nameLabel.textContent = `Level ${world}-${subLevel}`;
                nameLabel.classList.add('visible');
                mapCanvas.style.cursor = 'pointer';
            } else {
                nameLabel.classList.remove('visible');
                mapCanvas.style.cursor = hoveredNode !== -1 ? 'not-allowed' : 'default';
            }
        });
    }
    
    // Size map canvas
    mapCanvas.width = window.innerWidth;
    mapCanvas.height = window.innerHeight;
    
    // Generate node positions for 200 levels
    mapNodes = [];
    let curX = window.innerWidth * 0.15;
    let curY = mapCanvas.height / 2;
    for (let i = 0; i < 200; i++) {
        mapNodes.push({ x: curX, y: curY, world: Math.floor(i / 25) });
        // Winding path math
        curX += window.innerWidth * 0.18;
        curY = mapCanvas.height / 2 + Math.sin(i * 1.5) * (mapCanvas.height * 0.15);
    }
}

function showLevelSelect() {
    state = GameState.LEVEL_SELECT;
    initMap();
    if (typeof mapCanvas !== 'undefined' && mapCanvas) {
        mapCanvas.style.display = 'block';
    }
    showScreen('level-select-screen');
    document.getElementById('ui-overlay').style.pointerEvents = 'none';
    document.getElementById('btn-back-menu').style.pointerEvents = 'all';
    document.getElementById('map-arrow-right').style.pointerEvents = 'all';
}

function mapScrollRight() {
    targetMapOffset += window.innerWidth * 0.5;
    const maxOffset = Math.max(0, mapNodes[mapNodes.length - 1].x - window.innerWidth * 0.8);
    if (targetMapOffset > maxOffset) targetMapOffset = 0; // wrap around
}

function renderMap(dt) {
    if (!mapCtx) return;
    
    try {
        // Smooth scroll
        mapOffset += (targetMapOffset - mapOffset) * 0.1;
        
        mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
        
        // Draw background silhouettes (Parallax hills/trees)
        mapCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        mapCtx.beginPath();
        mapCtx.moveTo(0, mapCanvas.height);
        for (let x = 0; x <= mapCanvas.width + 50; x += 20) {
            // Use mapOffset * 0.4 for parallax effect
            const worldX = x + mapOffset * 0.4;
            const y = mapCanvas.height * 0.4 
                    + Math.sin(worldX * 0.01) * 60 
                    + Math.cos(worldX * 0.025) * 30 
                    + Math.sin(worldX * 0.05) * 15;
            mapCtx.lineTo(x, y);
        }
        mapCtx.lineTo(mapCanvas.width, mapCanvas.height);
        mapCtx.fill();
        
        // Draw path
        mapCtx.beginPath();
        mapCtx.strokeStyle = 'rgba(139, 26, 26, 0.4)';
        mapCtx.lineWidth = 14;
        mapCtx.lineCap = 'round';
        mapCtx.lineJoin = 'round';
        
        let pathStarted = false;
        if (mapNodes.length > 0) {
            for (let i = 1; i < mapNodes.length; i++) {
                const prev = mapNodes[i-1];
                const curr = mapNodes[i];
                const nx1 = prev.x - mapOffset;
                const nx2 = curr.x - mapOffset;
                
                // Cull offscreen path
                if (Math.max(nx1, nx2) < -100 || Math.min(nx1, nx2) > mapCanvas.width + 100) {
                    pathStarted = false;
                    continue;
                }
                
                if (!pathStarted) {
                    mapCtx.moveTo(nx1, prev.y);
                    pathStarted = true;
                }
                const midX = (prev.x + curr.x) / 2;
                mapCtx.quadraticCurveTo(midX - mapOffset, prev.y, nx2, curr.y);
            }
        }
        mapCtx.stroke();
        
        // Draw nodes
        for (let i = 0; i < mapNodes.length; i++) {
            const node = mapNodes[i];
            const nx = node.x - mapOffset;
            const ny = node.y;
            
            // Cull offscreen node
            if (nx < -50 || nx > mapCanvas.width + 50) continue;
            
            // Tombstone shape
            mapCtx.fillStyle = (i < unlockedLevels) ? 
                (i === hoveredNode ? '#A52A2A' : '#8B1A1A') : 
                '#555555'; 
                
            if (i === unlockedLevels - 1 && Math.floor(Date.now() / 250) % 2 === 0) {
                // Flash latest unlocked level
                mapCtx.fillStyle = '#C45A2C';
            }
                
            mapCtx.beginPath();
            mapCtx.moveTo(nx - 22, ny + 28);
            mapCtx.lineTo(nx - 22, ny - 10);
            mapCtx.arc(nx, ny - 10, 22, Math.PI, 0);
            mapCtx.lineTo(nx + 22, ny + 28);
            mapCtx.closePath();
            mapCtx.fill();
            
            mapCtx.strokeStyle = '#2d2d2d';
            mapCtx.lineWidth = 4;
            mapCtx.stroke();
            
            // Draw number or lock
            mapCtx.fillStyle = '#fff';
            mapCtx.font = '14px "Press Start 2P"';
            mapCtx.textAlign = 'center';
            mapCtx.textBaseline = 'middle';
            
            if (i < unlockedLevels) {
                mapCtx.fillText((i + 1).toString(), nx, ny + 8);
            } else {
                // Draw a simple lock icon (rect + arc)
                mapCtx.fillStyle = '#aaa';
                mapCtx.fillRect(nx - 8, ny, 16, 12);
                mapCtx.beginPath();
                mapCtx.arc(nx, ny, 6, Math.PI, 0);
                mapCtx.strokeStyle = '#aaa';
                mapCtx.lineWidth = 3;
                mapCtx.stroke();
            }
        }
    } catch (err) {
        const lbl = document.getElementById('map-level-name');
        lbl.textContent = 'ERR: ' + err.message;
        lbl.classList.add('visible');
    }
}

// Start game
function startGame() {
    loadLevel(0);
}

// Load a specific level
function loadLevel(index) {
    currentLevelIndex = index;
    // Keep the original color palette for all levels, unless in Hell Mode
    Renderer.currentWorld = isHellMode ? 7 : 0;  
    if (isHellMode) {
        // Index 200 = Beginner, 201 = Pro, 202 = Hacker
        currentLevel = generateHellLevel(index - 200);
    } else {
        currentLevel = cloneLevel(index);
    }
    player = new Player(currentLevel.playerStart.x, currentLevel.playerStart.y);
    currentLevel.player = player;
    deathCount = 0;
    deathTimer = 0;
    winTimer = 0;
    hintTimer = 180; // Show hint for 3 seconds (60fps * 3)
    hintAlpha = 1;
    levelStartTime = Date.now();
    
    // Reset camera to player
    cameraX = Math.max(0, player.x - canvas.width / 2);
    cameraY = 0; // We only scroll horizontally for now

    state = GameState.PLAYING;
    showScreen(null);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('ui-overlay').style.pointerEvents = 'none';
    document.getElementById('game-hud').classList.remove('hidden');
    document.getElementById('pause-hint').classList.remove('hidden');
    
    if (typeof mapCanvas !== 'undefined' && mapCanvas) {
        mapCanvas.style.display = 'none';
    }

    updateHUD();
    SoundEngine.levelStart();
    SoundEngine.playBGM();

    // Show username on HUD
    const hudUser = document.getElementById('hud-username');
    if (hudUser) hudUser.textContent = '👤 ' + PLAYER_USERNAME;
    const hudStars = document.getElementById('hud-stars');
    if (hudStars) hudStars.textContent = '';

    // Run level onStart hook
    if (currentLevel.onStart) {
        currentLevel.onStart(currentLevel);
    }
}

function retryLevel() {
    Achievements.onRetry(currentLevelIndex);
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('test')) {
        loadCustomLevel();
    } else {
        loadLevel(currentLevelIndex);
    }
}

function nextLevel() {
    if (currentLevelIndex + 1 < 200) {
        loadLevel(currentLevelIndex + 1);
    } else {
        state = GameState.COMPLETE;
        showScreen('complete-screen');
        const title = document.querySelector('#complete-screen .screen-title');
        if (title) title.textContent = "COMING SOON";
        document.getElementById('game-hud').classList.add('hidden');
        document.getElementById('ui-overlay').style.pointerEvents = '';
    }
}

function updateHUD() {
    if (isHellMode) {
        // Show live timer and deaths for this run
        const elapsed = Date.now() - hellStartTime;
        document.getElementById('hud-level-num').textContent = `HELL - ${(elapsed/1000).toFixed(1)}s`;
        document.getElementById('hud-death-count').textContent = deathCount;
    } else {
        const world = Math.floor(currentLevelIndex / 25) + 1;
        const subLevel = (currentLevelIndex % 25) + 1;
        document.getElementById('hud-level-num').textContent = `${world}-${subLevel}`;
        document.getElementById('hud-death-count').textContent = totalDeaths;
    }
}

// ========== MAIN GAME LOOP ==========
let lastTime = 0;

function gameLoop(timestamp = 0) {
    const dt = Math.min(timestamp - lastTime, 33); // Cap at ~30fps min
    lastTime = timestamp;

    if (state === GameState.PLAYING) {
        update(dt);
        render();
        if (isHellMode) updateHUD(); // Live timer update
    } else if (state === GameState.DEAD) {
        deathTimer++;
        // Keep rendering during death
        Renderer.updateEffects(dt);
        Renderer.clear();
        Renderer.beginWorld(cameraX, cameraY);
        renderLevel();
        Renderer.endFrame();
        
        // Draw Devil Mouth Animation over everything
        // Starts closing immediately, takes 30 frames to fully close
        const progress = Math.min(1, deathTimer / 30);
        Renderer.drawDevilMouth(progress);

        if (deathTimer > 60) { // 1 second delay
            showScreen('death-screen');
            document.getElementById('ui-overlay').style.pointerEvents = '';
        }
    } else if (state === GameState.WIN) {
        winTimer++;
        Renderer.updateEffects(dt);
        Renderer.clear();
        Renderer.beginWorld(cameraX, cameraY);
        renderLevel();
        player.draw();
        Renderer.endFrame();

        if (winTimer > 40) {
            if (isHellMode) {
                submitHellScore();
            } else {
                const msgs = [
                    "Don't get cocky...",
                    "That was the easy one.",
                    "Wait till you see what's next.",
                    "You got lucky.",
                    "Hmm, suspicious...",
                    "The game is watching you.",
                    "Or IS it clear?",
                    "That wasn't supposed to happen.",
                    "Fine. You win. This time.",
                    "Congratulations... for now.",
                ];
                document.getElementById('win-message').textContent = msgs[currentLevelIndex] || "Well done!";

                // ── Star rating ──
                const stars = deathCount === 0 ? 3 : deathCount <= 3 ? 2 : 1;
                const starEls = document.getElementById('win-stars');
                starEls.innerHTML = '';
                ['⭐','⭐','⭐'].forEach(function(s, i) {
                    const el = document.createElement('span');
                    el.className = 'win-star';
                    el.textContent = s;
                    starEls.appendChild(el);
                    setTimeout(function() {
                        el.classList.add(i < stars ? 'lit' : 'dim');
                    }, 200 + i * 180);
                });
                const statMsg = deathCount === 0
                    ? '✨ PERFECT — NO DEATHS!'
                    : '💀 ' + deathCount + ' DEATH' + (deathCount > 1 ? 'S' : '');
                document.getElementById('win-deaths-stat').textContent = statMsg;

                // Reflect stars in HUD too
                const hudSt = document.getElementById('hud-stars');
                if (hudSt) hudSt.textContent = '⭐'.repeat(stars);

                showScreen('win-screen');
                document.getElementById('ui-overlay').style.pointerEvents = '';
                const urlParams = new URLSearchParams(window.location.search);
                document.getElementById('btn-next').style.display = urlParams.has('test') ? 'none' : 'inline-block';
            }
        }
    } else if (state === GameState.LEVEL_SELECT) {
        renderMap(dt);
    }

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (!currentLevel || !player) return;

    // Update traps
    for (const trap of currentLevel.traps) {
        trap.check(player, currentLevel);
    }

    // Update trap animations
    updateTrappedPlatforms(currentLevel.platforms, dt);
    updateDoor(currentLevel.door);

    // Update moving spikes (follow their ceiling block if ceiling drop)
    for (let i = 0; i < currentLevel.spikes.length; i++) {
        const spike = currentLevel.spikes[i];
        // Move spikes that are attached to dropping platforms
        if (spike.attachedTo !== undefined) {
            const plat = currentLevel.platforms[spike.attachedTo];
            if (plat && plat.dropping) {
                spike.y = plat.y + plat.h;
            }
        }
    }

    // Gravity flip
    if (currentLevel.gravityFlipped) {
        player.gravity = -0.55;
        player.jumpForce = 10;
    }

    // Update projectiles
    if (currentLevel.bullets) {
        for (const b of currentLevel.bullets) {
            b.x += b.vx || 0;
            b.y += b.vy || 0;
        }
    }
    if (currentLevel.saws) {
        for (const s of currentLevel.saws) {
            if (s.patrolRangeX) {
                s.startX = s.startX || s.x;
                s.x = s.startX + Math.sin(Date.now() / (s.speed || 500)) * s.patrolRangeX;
            }
            if (s.patrolRangeY) {
                s.startY = s.startY || s.y;
                s.y = s.startY + Math.sin(Date.now() / (s.speed || 500)) * s.patrolRangeY;
            }
        }
    }

    // Update player (Using level width instead of canvas width for bounds)
    const levelWidth = currentLevel.width || canvas.width;
    player.update(currentLevel, levelWidth, canvas.height);

    // Update camera (Smooth follow)
    const targetCamX = player.x - canvas.width / 2 + player.w / 2;
    cameraX += (targetCamX - cameraX) * 0.1;
    
    // Clamp camera to level bounds
    if (cameraX < 0) cameraX = 0;
    const maxCamX = Math.max(0, levelWidth - canvas.width);
    if (cameraX > maxCamX) cameraX = maxCamX;

    // Hint fade
    if (hintTimer > 0) {
        hintTimer--;
        if (hintTimer < 60) {
            hintAlpha = hintTimer / 60;
        }
    }

    // Check death
    if (!player.alive) {
        state = GameState.DEAD;
        SoundEngine.stopBGM();
        deathCount++;
        totalDeaths++;
        deathTimer = 0;
        updateHUD();
        saveProgress();
        SoundEngine.death();
        Achievements.onDeath(totalDeaths);
    }

    // Check win
    if (player.won) {
        state = GameState.WIN;
        SoundEngine.stopBGM();
        winTimer = 0;
        if (currentLevelIndex + 1 >= unlockedLevels) {
            unlockedLevels = Math.min(currentLevelIndex + 2, 200);
        }
        saveProgress();
        SoundEngine.win();
        const timeElapsed = Date.now() - levelStartTime;
        Achievements.onLevelWin(currentLevelIndex, deathCount, timeElapsed);
        if (!isHellMode) submitLevelScore(currentLevelIndex, timeElapsed, deathCount);
    }

    Renderer.updateEffects(dt);
}

function render() {
    Renderer.clear();
    Renderer.beginWorld(cameraX, cameraY);
    renderLevel();
    player.draw();

    // Draw hint text
    if (hintAlpha > 0 && currentLevel.hint) {
        Renderer.ctx.globalAlpha = hintAlpha;
        Renderer.drawText(currentLevel.hint, canvas.width / 2, 40, 11, '#5a4510');
        Renderer.ctx.globalAlpha = 1;
    }

    Renderer.endFrame();
}

function renderLevel() {
    if (!currentLevel) return;

    // Draw platforms
    for (const p of currentLevel.platforms) {
        if (!p.active) continue;
        const dx = p.drawOffsetX || 0;
        const dy = p.drawOffsetY || 0;
        Renderer.drawPlatform(p.x + dx, p.y + dy, p.w, p.h, p.type || 'normal');
    }
    
    // Draw Crates
    if (currentLevel.crates) {
        for (const c of currentLevel.crates) {
            Renderer.drawCrate(c);
        }
    }

    // Draw Springs
    if (currentLevel.springs) {
        for (const s of currentLevel.springs) {
            Renderer.drawSpring(s);
        }
    }

    // Draw Coins
    if (currentLevel.coins) {
        for (const c of currentLevel.coins) {
            Renderer.drawCoin(c);
        }
    }

    // Draw spikes
    if (currentLevel.spikes) {
        for (const s of currentLevel.spikes) {
            if (!s.active) continue;
            Renderer.drawSpike(s.x, s.y, s.w, s.h, s.direction || 'up');
        }
    }

    // Draw Saws
    if (currentLevel.saws) {
        for (const s of currentLevel.saws) {
            Renderer.drawSaw(s);
        }
    }

    // Draw Bullets
    if (currentLevel.bullets) {
        for (const b of currentLevel.bullets) {
            Renderer.drawBullet(b);
        }
    }

    // Draw door
    if (currentLevel.door) {
        Renderer.drawDoor(
            currentLevel.door.x,
            currentLevel.door.y,
            currentLevel.door.w,
            currentLevel.door.h,
            currentLevel.door.open
        );
    }
}

// Start when page loads
window.addEventListener('load', init);
