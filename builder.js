const canvas = document.getElementById('builder-canvas');
const ctx = canvas.getContext('2d');
const jsonEditor = document.getElementById('json-editor');

// State
let currentTool = 'select';
let levelData = {
    name: "Custom Level",
    hint: "",
    playerStart: { x: 40, y: 380 },
    platforms: [],
    spikes: [],
    saws: [],
    coins: [],
    springs: [],
    door: { x: 700, y: 384, w: 36, h: 56, open: true },
    traps: []
};

let selectedItem = null;
let selectedType = null; // 'platform', 'spike', 'saw'
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Setup Renderer (reuse game's drawing logic)
Renderer.init(canvas);
Renderer.currentWorld = 0;

// Update UI
function updateJson() {
    jsonEditor.value = JSON.stringify(levelData, null, 4);
}

function applyJson() {
    try {
        levelData = JSON.parse(jsonEditor.value);
        selectedItem = null;
        render();
    } catch (e) {
        alert("Invalid JSON!");
    }
}

// Draw Loop
function render() {
    Renderer.clear();
    Renderer.beginWorld(0, 0);

    // Draw Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw platforms
    (levelData.platforms || []).forEach((p, i) => {
        Renderer.drawPlatform(p.x, p.y, p.w, p.h);
        if (selectedItem === p) drawHighlight(p.x, p.y, p.w, p.h);
        
        // Trap indicator
        const trap = (levelData.traps || []).find(t => t.targetId === i && (t.type === 'disappear' || t.type === 'ceiling_drop'));
        if (trap) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '10px monospace';
            ctx.fillText(trap.type === 'disappear' ? '⚠️ FAKE' : '⚠️ DROP', p.x + 5, p.y + 15);
        }
    });

    // Draw spikes
    (levelData.spikes || []).forEach((s, i) => {
        Renderer.drawSpike(s.x, s.y, s.w, s.h, s.direction || 'up');
        if (selectedItem === s) drawHighlight(s.x, s.y, s.w, s.h);
        
        // Trap indicator
        const trap = (levelData.traps || []).find(t => t.targetId === i && t.type === 'spike_rise');
        if (trap) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '10px monospace';
            ctx.fillText('⚠️ HIDDEN', s.x - 5, s.y - 5);
        }
    });

    // Draw saws
    (levelData.saws || []).forEach(s => {
        Renderer.drawSaw(s);
        if (selectedItem === s) drawHighlight(s.x, s.y, s.w, s.h);
    });

    // Draw springs
    (levelData.springs || []).forEach(s => {
        Renderer.drawSpring(s);
        if (selectedItem === s) drawHighlight(s.x, s.y, s.w, s.h);
    });

    // Draw coins
    (levelData.coins || []).forEach(c => {
        Renderer.drawCoin(c);
        if (selectedItem === c) drawHighlight(c.x, c.y, c.w, c.h);
    });

    // Draw Door
    if (levelData.door) {
        Renderer.drawDoor(levelData.door.x, levelData.door.y, levelData.door.w, levelData.door.h, true);
        if (selectedItem === levelData.door) drawHighlight(levelData.door.x, levelData.door.y, levelData.door.w, levelData.door.h);
    }

    // Draw Player Start
    if (levelData.playerStart) {
        Renderer.drawPlayer(levelData.playerStart.x, levelData.playerStart.y, 24, 24, true);
        if (selectedItem === levelData.playerStart) drawHighlight(levelData.playerStart.x, levelData.playerStart.y, 24, 24);
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText("START", levelData.playerStart.x, levelData.playerStart.y - 10);
    }

    Renderer.ctx.restore();
}

function drawHighlight(x, y, w, h) {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
}

// Tool Selection
document.querySelectorAll('.tool-btn').forEach(btn => {
    if (btn.dataset.tool === 'delete') {
        btn.addEventListener('click', () => {
            if (selectedItem && selectedType) {
                let arrName = selectedType + 's';
                if (arrName === 'boxs') arrName = 'boxes'; // Just in case
                if (arrName === 'springs') arrName = 'springs'; // etc
                
                let arr = levelData[arrName];
                if (arr) {
                    const idx = arr.indexOf(selectedItem);
                    if (idx !== -1) {
                        arr.splice(idx, 1);
                        
                        // Fix orphaned/shifted traps!
                        if (levelData.traps) {
                            for (let i = levelData.traps.length - 1; i >= 0; i--) {
                                let t = levelData.traps[i];
                                let isTarget = false;
                                if (selectedType === 'platform' && (t.type === 'disappear' || t.type === 'ceiling_drop' || t.type === 'platform_move')) isTarget = true;
                                if (selectedType === 'spike' && t.type === 'spike_rise') isTarget = true;
                                
                                if (isTarget) {
                                    if (t.targetId === idx) {
                                        levelData.traps.splice(i, 1); // Delete orphaned trap
                                    } else if (t.targetId > idx) {
                                        t.targetId--; // Shift target id down
                                    }
                                }
                            }
                        }
                    }
                }
                
                selectedItem = null;
                updateJson();
                render();
            }
        });
        return;
    }
    
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
    });
});

// Canvas Interactions
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: Math.round((e.clientX - rect.left) * scaleX / 20) * 20, // Snap to 20px grid
        y: Math.round((e.clientY - rect.top) * scaleY / 20) * 20
    };
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    
    if (currentTool === 'select') {
        // Try to select
        selectedItem = null;
        selectedType = null;
        
        const checkHit = (arr, type) => {
            if (!arr) return;
            for (let item of arr) {
                if (pos.x >= item.x && pos.x <= item.x + (item.w||24) &&
                    pos.y >= item.y && pos.y <= item.y + (item.h||24)) {
                    selectedItem = item;
                    selectedType = type;
                    return true;
                }
            }
            return false;
        };

        checkHit(levelData.platforms, 'platform') ||
        checkHit(levelData.spikes, 'spike') ||
        checkHit(levelData.saws, 'saw') ||
        checkHit(levelData.springs, 'spring') ||
        checkHit(levelData.coins, 'coin') ||
        checkHit([levelData.door], 'door') ||
        checkHit([levelData.playerStart], 'start');

        if (selectedItem) {
            isDragging = true;
            dragStartX = pos.x - selectedItem.x;
            dragStartY = pos.y - selectedItem.y;
        }
        
    } else {
        // Place new item
        if (currentTool === 'platform') levelData.platforms.push({ x: pos.x, y: pos.y, w: 100, h: 60, active: true });
        if (currentTool === 'spike') levelData.spikes.push({ x: pos.x, y: pos.y, w: 24, h: 24, direction: 'up', active: true });
        if (currentTool === 'hidden_spike') {
            levelData.spikes.push({ x: pos.x, y: pos.y, w: 24, h: 24, direction: 'up', active: true });
            levelData.traps = levelData.traps || [];
            levelData.traps.push({
                type: 'spike_rise',
                triggerType: 'x_greater',
                triggerX: pos.x - 40,
                targetId: levelData.spikes.length - 1
            });
        }
        if (currentTool === 'saw') levelData.saws.push({ x: pos.x, y: pos.y, w: 40, h: 40, speed: 500, patrolRangeX: 100 });
        if (currentTool === 'coin') levelData.coins.push({ x: pos.x, y: pos.y, w: 20, h: 20 });
        if (currentTool === 'spring') levelData.springs.push({ x: pos.x, y: pos.y, w: 40, h: 20 });
        if (currentTool === 'door') levelData.door = { x: pos.x, y: pos.y, w: 36, h: 56, open: true };
        if (currentTool === 'start') levelData.playerStart = { x: pos.x, y: pos.y };
        updateJson();
    }
    render();
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && selectedItem) {
        const pos = getMousePos(e);
        selectedItem.x = pos.x - dragStartX;
        selectedItem.y = pos.y - dragStartY;
        render();
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        updateJson();
    }
});

function applyTrap() {
    if (!selectedItem) return alert("Select an item first!");
    const type = document.getElementById('trap-type').value;
    if (!type) return;
    
    // Find index of selected item in its array
    let targetId = -1;
    let arr = [];
    if (selectedType === 'platform') arr = levelData.platforms;
    if (selectedType === 'spike') arr = levelData.spikes;
    
    if (arr) targetId = arr.indexOf(selectedItem);

    const triggerX = selectedItem.x - 40; // Trigger slightly before
    let trap = { type: type, triggerType: 'x_greater', triggerX: triggerX };
    
    if (type === 'disappear' || type === 'ceiling_drop') {
        trap.triggerType = 'step_on';
        trap.targetId = targetId;
        trap.delay = 100;
    } else if (type === 'spike_rise') {
        trap.targetId = targetId;
    } else if (type === 'door_move') {
        trap.data = { newX: selectedItem.x - 200, newY: selectedItem.y };
    }
    
    levelData.traps = levelData.traps || [];
    levelData.traps.push(trap);
    updateJson();
    alert("Trap added! Check the JSON editor to tweak details.");
}

function testLevel() {
    const data = JSON.stringify(levelData);
    localStorage.setItem('dt_test_level', data);
    window.location.href = 'index.html?test=1';
}

updateJson();
render();
