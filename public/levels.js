// ============================================
// LEVELS - 10 troll levels
// Each level has platforms, spikes, door, traps
// ============================================

const LEVELS = [
    // =============================
    // LEVEL 1 - "Normal" Tutorial
    // Builds false confidence
    // =============================
    {
        name: "Welcome",
        hint: "Just reach the door. Easy, right?",
        playerStart: { x: 60, y: 380 },
        platforms: [
            // Ground
            { x: 0, y: 440, w: 800, h: 60, active: true },
            // Small step
            { x: 300, y: 370, w: 120, h: 20, active: true },
            // Higher step
            { x: 500, y: 300, w: 120, h: 20, active: true },
        ],
        spikes: [],
        door: { x: 560, y: 244, w: 36, h: 56, open: true },
        traps: [],
    },

    // =============================
    // LEVEL 2 - Floor Drop
    // Floor disappears when you walk on it
    // =============================
    {
        name: "Solid Ground?",
        hint: "The floor looks safe...",
        playerStart: { x: 60, y: 380 },
        platforms: [
            // Starting ground
            { x: 0, y: 440, w: 200, h: 60, active: true },
            // Middle floor (will disappear!)
            { x: 200, y: 440, w: 200, h: 60, active: true, type: 'disappearing' },
            // More middle floor
            { x: 400, y: 440, w: 150, h: 60, active: true, type: 'disappearing' },
            // End ground
            { x: 550, y: 440, w: 250, h: 60, active: true },
            // Safe platform above
            { x: 280, y: 340, w: 180, h: 20, active: true },
        ],
        spikes: [],
        door: { x: 700, y: 384, w: 36, h: 56, open: true },
        traps: [
            new Trap({ type: 'disappear', triggerType: 'step_on', targetId: 1, delay: 100, data: { shakeTime: 300 } }),
            new Trap({ type: 'disappear', triggerType: 'step_on', targetId: 2, delay: 100, data: { shakeTime: 300 } }),
        ],
    },

    // =============================
    // LEVEL 3 - Spike Surprise
    // Spikes pop up from nowhere
    // =============================
    {
        name: "Watch Your Step",
        hint: "Nothing suspicious here...",
        playerStart: { x: 60, y: 380 },
        platforms: [
            { x: 0, y: 440, w: 800, h: 60, active: true },
            { x: 200, y: 360, w: 100, h: 20, active: true },
            { x: 450, y: 320, w: 100, h: 20, active: true },
        ],
        spikes: [
            // Hidden spikes that will appear
            { x: 250, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 280, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 310, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 340, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 500, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 530, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 560, y: 440, w: 24, h: 24, direction: 'up', active: false },
        ],
        door: { x: 700, y: 384, w: 36, h: 56, open: true },
        traps: [
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 220, targetId: 0 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 220, targetId: 1 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 220, targetId: 2 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 220, targetId: 3 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 460, targetId: 4 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 460, targetId: 5 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 460, targetId: 6 }),
        ],
    },

    // =============================
    // LEVEL 4 - The Door Runs Away
    // Door moves when you get close
    // =============================
    {
        name: "Almost There",
        hint: "The exit is right there!",
        playerStart: { x: 60, y: 380 },
        platforms: [
            { x: 0, y: 440, w: 800, h: 60, active: true },
            { x: 100, y: 340, w: 200, h: 20, active: true },
        ],
        spikes: [
            { x: 380, y: 416, w: 24, h: 24, direction: 'up', active: true },
            { x: 410, y: 416, w: 24, h: 24, direction: 'up', active: true },
        ],
        door: { x: 700, y: 384, w: 36, h: 56, open: true },
        traps: [
            // Door runs away first time
            new Trap({ type: 'door_move', triggerType: 'x_greater', triggerX: 600, data: { newX: 120, newY: 284 } }),
        ],
    },

    // =============================
    // LEVEL 5 - Fake Floor
    // Some platforms look solid but aren't
    // =============================
    {
        name: "Trust Issues",
        hint: "Not everything is what it seems...",
        playerStart: { x: 60, y: 300 },
        platforms: [
            // Real starting platform
            { x: 0, y: 350, w: 150, h: 20, active: true },
            // FAKE platform (will disappear instantly)
            { x: 200, y: 350, w: 120, h: 20, active: true, type: 'fake' },
            // Real platform (hidden safe route below)
            { x: 200, y: 440, w: 400, h: 60, active: true },
            // FAKE
            { x: 370, y: 350, w: 120, h: 20, active: true, type: 'fake' },
            // Real end platform
            { x: 540, y: 350, w: 150, h: 20, active: true },
            // Real stepping stones below
            { x: 650, y: 440, w: 150, h: 60, active: true },
        ],
        spikes: [
            { x: 250, y: 416, w: 24, h: 24, direction: 'up', active: true },
            { x: 280, y: 416, w: 24, h: 24, direction: 'up', active: true },
            { x: 400, y: 416, w: 24, h: 24, direction: 'up', active: true },
            { x: 430, y: 416, w: 24, h: 24, direction: 'up', active: true },
        ],
        door: { x: 600, y: 294, w: 36, h: 56, open: true },
        traps: [
            new Trap({ type: 'disappear', triggerType: 'step_on', targetId: 1, delay: 0, data: { shakeTime: 100 } }),
            new Trap({ type: 'disappear', triggerType: 'step_on', targetId: 3, delay: 0, data: { shakeTime: 100 } }),
        ],
    },

    // =============================
    // LEVEL 6 - Ceiling Crush
    // Ceiling drops on you
    // =============================
    {
        name: "Look Up",
        hint: "The ceiling seems fine...",
        playerStart: { x: 60, y: 380 },
        platforms: [
            { x: 0, y: 440, w: 800, h: 60, active: true },
            // Ceiling blocks that will drop
            { x: 200, y: -20, w: 150, h: 30, active: true },
            { x: 450, y: -20, w: 150, h: 30, active: true },
            // Shelter
            { x: 340, y: 360, w: 120, h: 20, active: true },
        ],
        spikes: [
            // Spikes on ceiling blocks
            { x: 215, y: 10, w: 24, h: 24, direction: 'down', active: true },
            { x: 245, y: 10, w: 24, h: 24, direction: 'down', active: true },
            { x: 275, y: 10, w: 24, h: 24, direction: 'down', active: true },
            { x: 305, y: 10, w: 24, h: 24, direction: 'down', active: true },
            { x: 465, y: 10, w: 24, h: 24, direction: 'down', active: true },
            { x: 495, y: 10, w: 24, h: 24, direction: 'down', active: true },
            { x: 525, y: 10, w: 24, h: 24, direction: 'down', active: true },
            { x: 555, y: 10, w: 24, h: 24, direction: 'down', active: true },
        ],
        door: { x: 720, y: 384, w: 36, h: 56, open: true },
        traps: [
            new Trap({ type: 'ceiling_drop', triggerType: 'x_greater', triggerX: 180, targetId: 1, data: { newY: 340 } }),
            new Trap({ type: 'ceiling_drop', triggerType: 'x_greater', triggerX: 420, targetId: 2, data: { newY: 340 } }),
        ],
    },

    // =============================
    // LEVEL 7 - Mirror Controls
    // Left = Right, Right = Left
    // =============================
    {
        name: "Mirror Mirror",
        hint: "Something feels backwards...",
        playerStart: { x: 400, y: 380 },
        platforms: [
            { x: 0, y: 440, w: 800, h: 60, active: true },
            { x: 100, y: 360, w: 100, h: 20, active: true },
            { x: 600, y: 360, w: 100, h: 20, active: true },
            { x: 300, y: 300, w: 200, h: 20, active: true },
        ],
        spikes: [
            { x: 200, y: 416, w: 24, h: 24, direction: 'up', active: true },
            { x: 230, y: 416, w: 24, h: 24, direction: 'up', active: true },
            { x: 530, y: 416, w: 24, h: 24, direction: 'up', active: true },
            { x: 560, y: 416, w: 24, h: 24, direction: 'up', active: true },
        ],
        door: { x: 130, y: 304, w: 36, h: 56, open: false },
        traps: [
            // Controls get reversed immediately
            new Trap({ type: 'mirror', triggerType: 'timer', triggerX: 500, targetId: 0 }),
        ],
        onStart: (level) => {
            // Door opens after a delay
            setTimeout(() => { if (level.door) level.door.open = true; }, 2000);
        },
    },

    // =============================
    // LEVEL 8 - Platform Slide
    // Platforms slide away when you jump
    // =============================
    {
        name: "Slippery",
        hint: "Platforms have somewhere to be...",
        playerStart: { x: 60, y: 380 },
        platforms: [
            { x: 0, y: 440, w: 150, h: 60, active: true },
            { x: 200, y: 380, w: 120, h: 20, active: true },
            { x: 380, y: 320, w: 120, h: 20, active: true },
            { x: 560, y: 260, w: 120, h: 20, active: true },
            { x: 680, y: 440, w: 120, h: 60, active: true },
        ],
        spikes: [],
        door: { x: 710, y: 384, w: 36, h: 56, open: true },
        traps: [
            new Trap({ type: 'platform_move', triggerType: 'x_greater', triggerX: 170, targetId: 1, data: { newX: 250, newY: 400 } }),
            new Trap({ type: 'platform_move', triggerType: 'x_greater', triggerX: 350, targetId: 2, data: { newX: 430, newY: 360 } }),
            new Trap({ type: 'platform_move', triggerType: 'x_greater', triggerX: 520, targetId: 3, data: { newX: 610, newY: 300 } }),
        ],
    },

    // =============================
    // LEVEL 9 - The Gauntlet
    // Multiple traps combined
    // =============================
    {
        name: "The Gauntlet",
        hint: "Good luck...",
        playerStart: { x: 60, y: 380 },
        platforms: [
            { x: 0, y: 440, w: 160, h: 60, active: true },
            { x: 160, y: 440, w: 120, h: 60, active: true, type: 'disappearing' },
            { x: 340, y: 380, w: 100, h: 20, active: true },
            { x: 500, y: 320, w: 100, h: 20, active: true },
            { x: 500, y: 440, w: 300, h: 60, active: true },
            { x: 200, y: 0, w: 100, h: 20, active: true }, // Ceiling block
        ],
        spikes: [
            { x: 310, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 340, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 600, y: 416, w: 24, h: 24, direction: 'up', active: true },
            { x: 630, y: 416, w: 24, h: 24, direction: 'up', active: true },
            { x: 660, y: 416, w: 24, h: 24, direction: 'up', active: true },
        ],
        door: { x: 730, y: 384, w: 36, h: 56, open: true },
        traps: [
            new Trap({ type: 'disappear', triggerType: 'step_on', targetId: 1, delay: 50, data: { shakeTime: 200 } }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 280, targetId: 0 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 280, targetId: 1 }),
            new Trap({ type: 'ceiling_drop', triggerType: 'x_greater', triggerX: 180, targetId: 5, data: { newY: 350 } }),
            new Trap({ type: 'door_move', triggerType: 'x_greater', triggerX: 650, data: { newX: 730, newY: 264 } }),
        ],
    },

    // =============================
    // LEVEL 10 - Ultimate Troll
    // The door is right there... or is it?
    // =============================
    {
        name: "THE END?",
        hint: "It's right there. Just walk to it.",
        playerStart: { x: 60, y: 380 },
        platforms: [
            { x: 0, y: 440, w: 800, h: 60, active: true },
            // Safe elevated platform for final door — lowered so it's jumpable
            { x: 330, y: 300, w: 120, h: 20, active: true },
        ],
        spikes: [
            // Left spike group — gap at index 2 (x=220 removed) so player can jump through
            { x: 160, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 190, y: 440, w: 24, h: 24, direction: 'up', active: false },
            // GAP here (x=220 removed) — one jumpable tile gap
            { x: 250, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 280, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 310, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 340, y: 440, w: 24, h: 24, direction: 'up', active: false },
            // Right spike group
            { x: 500, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 530, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 560, y: 440, w: 24, h: 24, direction: 'up', active: false },
            { x: 590, y: 440, w: 24, h: 24, direction: 'up', active: false },
        ],
        door: { x: 700, y: 384, w: 36, h: 56, open: true },
        traps: [
            // Door runs to far left when you get close
            new Trap({ type: 'door_move', triggerType: 'x_greater', triggerX: 500, data: { newX: 50, newY: 384 } }),
            // Left spike group rises when you pass x=140
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 140, targetId: 0 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 140, targetId: 1 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 140, targetId: 2 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 140, targetId: 3 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 140, targetId: 4 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 140, targetId: 5 }),
            // Right spike group rises when you pass x=400
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 400, targetId: 6 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 400, targetId: 7 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 400, targetId: 8 }),
            new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: 400, targetId: 9 }),
            // Door teleports UP to platform when you reach the left side
            new Trap({ type: 'door_move', triggerType: 'x_less', triggerX: 150, data: { newX: 358, newY: 244 } }),
            // Controls reverse as you go back left — the real troll!
            new Trap({ type: 'mirror', triggerType: 'x_less', triggerX: 200, targetId: 0 }),
        ],
    },
    // =============================
    // LEVEL 11 - Moving Saws
    // Introduces patrolling sawblades
    // =============================
    {
        name: "Sawblade Dance",
        hint: "Watch your step... and your head.",
        playerStart: { x: 40, y: 380 },
        platforms: [
            { x: 0, y: 440, w: 100, h: 60, active: true },
            { x: 150, y: 440, w: 200, h: 60, active: true },
            { x: 450, y: 440, w: 200, h: 60, active: true },
            { x: 750, y: 440, w: 100, h: 60, active: true },
        ],
        saws: [
            { x: 200, y: 400, w: 40, h: 40, startX: 150, patrolRangeX: 100, speed: 600 },
            { x: 500, y: 400, w: 40, h: 40, startX: 450, patrolRangeX: 100, speed: 400 },
            // Floating saws
            { x: 350, y: 300, w: 60, h: 60, startX: 350, patrolRangeY: 80, speed: 800 },
        ],
        spikes: [
            { x: 100, y: 480, w: 50, h: 20, direction: 'up', active: true }, // Pit spikes
            { x: 350, y: 480, w: 100, h: 20, direction: 'up', active: true }, // Pit spikes
            { x: 650, y: 480, w: 100, h: 20, direction: 'up', active: true }, // Pit spikes
        ],
        door: { x: 780, y: 384, w: 36, h: 56, open: true },
        traps: [
            // Extra saw that spawns when you jump the second gap
            new Trap({ type: 'platform_move', triggerType: 'x_greater', triggerX: 400, targetId: 2, delay: 500, data: { newY: 500 } }),
        ]
    },

    // =============================
    // LEVEL 12 - Bridge Collapse
    // Cascading falling platforms on delay
    // =============================
    {
        name: "Run For It",
        hint: "Don't stop moving!",
        playerStart: { x: 40, y: 380 },
        platforms: [
            { x: 0, y: 440, w: 100, h: 60, active: true },
            // The bridge segments
            { x: 100, y: 440, w: 80, h: 60, active: true },
            { x: 180, y: 440, w: 80, h: 60, active: true },
            { x: 260, y: 440, w: 80, h: 60, active: true },
            { x: 340, y: 440, w: 80, h: 60, active: true },
            { x: 420, y: 440, w: 80, h: 60, active: true },
            { x: 500, y: 440, w: 80, h: 60, active: true },
            { x: 580, y: 440, w: 80, h: 60, active: true },
            // End platform
            { x: 700, y: 380, w: 100, h: 120, active: true },
        ],
        spikes: [],
        door: { x: 730, y: 324, w: 36, h: 56, open: true },
        traps: [
            // Step on each segment to make it fall with a 200ms delay
            new Trap({ type: 'ceiling_drop', triggerType: 'step_on', targetId: 1, delay: 150 }),
            new Trap({ type: 'ceiling_drop', triggerType: 'step_on', targetId: 2, delay: 150 }),
            new Trap({ type: 'ceiling_drop', triggerType: 'step_on', targetId: 3, delay: 150 }),
            new Trap({ type: 'ceiling_drop', triggerType: 'step_on', targetId: 4, delay: 150 }),
            new Trap({ type: 'ceiling_drop', triggerType: 'step_on', targetId: 5, delay: 150 }),
            new Trap({ type: 'ceiling_drop', triggerType: 'step_on', targetId: 6, delay: 150 }),
            new Trap({ type: 'ceiling_drop', triggerType: 'step_on', targetId: 7, delay: 150 }),
            // Troll trick at the end - the end platform drops slightly
            new Trap({ type: 'ceiling_drop', triggerType: 'x_greater', triggerX: 620, targetId: 8, delay: 0, data: { newY: 460 } }),
        ]
    }
];

// Base design resolution (levels were designed at this size)
const BASE_W = 800;
const BASE_H = 500;

// Deep clone a level and scale to current canvas size
function cloneLevel(levelIndex) {
    let src = LEVELS[levelIndex];
    if (!src) {
        src = generateLevel(levelIndex); // Procedurally generate levels > 10
    }

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const sy = ch / BASE_H;
    const sx = sy; // Uniform scaling so we can have scrolling levels!

    let maxPlatX = 800;
    for (const p of (src.platforms || [])) {
        if (p.x + p.w > maxPlatX) maxPlatX = p.x + p.w;
    }
    const levelWidth = maxPlatX * sx;

    const level = {
        name: src.name,
        hint: src.hint,
        width: levelWidth,
        platforms: (src.platforms || []).map(p => ({
            ...p,
            x: p.x * sx,
            y: p.y * sy,
            w: p.w * sx,
            h: p.h * sy,
            drawOffsetX: 0,
            drawOffsetY: 0,
        })),
        spikes: (src.spikes || []).map(s => ({
            ...s,
            x: s.x * sx,
            y: s.y * sy,
            w: s.w * sx,
            h: s.h * sy,
        })),
        springs: (src.springs || []).map(s => ({
            ...s,
            x: s.x * sx,
            y: s.y * sy,
            w: s.w * sx,
            h: s.h * sy,
        })),
        coins: (src.coins || []).map(c => ({
            ...c,
            x: c.x * sx,
            y: c.y * sy,
            w: c.w * sx,
            h: c.h * sy,
        })),
        crates: (src.crates || []).map(c => ({
            ...c,
            x: c.x * sx,
            y: c.y * sy,
            w: c.w * sx,
            h: c.h * sy,
        })),
        saws: (src.saws || []).map(s => ({
            ...s,
            x: s.x * sx,
            y: s.y * sy,
            w: s.w * sx,
            h: s.h * sy,
            startX: s.startX ? s.startX * sx : undefined,
            startY: s.startY ? s.startY * sy : undefined,
            patrolRangeX: s.patrolRangeX ? s.patrolRangeX * sx : undefined,
            patrolRangeY: s.patrolRangeY ? s.patrolRangeY * sy : undefined,
        })),
        bullets: (src.bullets || []).map(b => ({
            ...b,
            x: b.x * sx,
            y: b.y * sy,
            w: b.w * sx,
            h: b.h * sy,
            vx: b.vx ? b.vx * sx : 0,
            vy: b.vy ? b.vy * sy : 0,
        })),
        door: src.door ? {
            ...src.door,
            x: src.door.x * sx,
            y: src.door.y * sy,
            w: src.door.w * sx,
            h: src.door.h * sy,
            moving: false,
        } : null,
        traps: (src.traps || []).map(t => new Trap({
            type: t.type,
            triggerX: t.triggerX !== undefined ? t.triggerX * sx : undefined,
            triggerY: t.triggerY !== undefined ? t.triggerY * sy : undefined,
            triggerType: t.triggerType,
            targetId: t.targetId,
            delay: t.delay,
            data: t.data ? {
                ...t.data,
                newX: t.data.newX !== undefined ? t.data.newX * sx : undefined,
                newY: t.data.newY !== undefined ? t.data.newY * sy : undefined,
            } : {},
        })),
        gravityFlipped: false,
        onStart: src.onStart || null,
        // Store scale factors for player spawn
        _sx: sx,
        _sy: sy,
    };

    // Scale playerStart
    level.playerStart = {
        x: src.playerStart.x * sx,
        y: src.playerStart.y * sy,
    };

    return level;
}

// ============================================
// PROCEDURAL GENERATOR (Levels 11 - 200)
// ============================================

// Simple seeded RNG to ensure levels are the same every time you play
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateLevel(index) {
    const world = Math.floor(index / 25);
    const subLevel = (index % 25) + 1;
    let seed = index * 1337;

    function random() {
        seed += 1;
        return seededRandom(seed);
    }
    
    function randomRange(min, max) {
        return min + random() * (max - min);
    }

    const level = {
        name: `World ${world + 1}-${subLevel}`,
        hint: "",
        playerStart: { x: 60, y: 380 },
        platforms: [
            { x: 0, y: 440, w: 150, h: 60, active: true }, // Start platform
        ],
        spikes: [],
        springs: [],
        coins: [],
        crates: [],
        saws: [],
        bullets: [],
        traps: [],
        door: { x: 720, y: 384, w: 36, h: 56, open: true },
        gravityFlipped: false,
        wraparound: false,
    };
    
    // World 4: GRAVITY
    if (world === 3) level.gravityFlipped = random() > 0.5;
    // World 5: WRAPAROUND
    if (world === 4) level.wraparound = true;

    // Generate path
    let curX = 150;
    let curY = 440;
    
    let platId = 1;
    
    while (curX < 1800) {
        const gap = randomRange(40, 100);
        
        // If the gap pushes us too far, stop generating platforms here.
        if (curX + gap > 1800) {
            break;
        }
        
        curX += gap;
        
        let width = randomRange(80, 200);
        
        // Ensure width doesn't push us off screen before the end platform
        if (curX + width > 1850) {
            width = 1850 - curX;
        }
        
        curY += randomRange(-40, 40);
        
        // Keep in bounds
        if (curY < 200) curY = 200;
        if (curY > 440) curY = 440;
        
        const plat = { x: curX, y: curY, w: width, h: 60, active: true };
        level.platforms.push(plat);
        
        // --- RANDOM TRAP INJECTION ---
        // ANY trap can appear in ANY world! The user wants frustration.
        const r = random();
        
        // Spike trap
        if (r < 0.2) {
            level.spikes.push({ x: curX + width/2 - 12, y: curY });
            level.traps.push(new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: curX - 50, targetId: level.spikes.length - 1 }));
        } 
        // Disappearing floor
        else if (r < 0.4) {
            plat.type = 'disappearing';
            level.traps.push(new Trap({ type: 'disappear', triggerType: 'step_on', targetId: platId, delay: 100 }));
        }
        // Falling Ceiling
        else if (r < 0.5) {
            level.platforms.push({ x: curX, y: -100, w: width, h: 60, active: true });
            level.traps.push(new Trap({ type: 'ceiling_drop', triggerType: 'x_greater', triggerX: curX - 20, targetId: level.platforms.length - 1 }));
        }
        // Fake floor
        else if (r < 0.6) {
            plat.type = 'fake';
        }
        // Control Invert Trap
        else if (r < 0.65) {
            level.traps.push(new Trap({ type: 'mirror', triggerType: 'x_greater', triggerX: curX }));
        }
        
        // World Mechanics Injections (More heavily weighted towards their respective worlds)
        if (world >= 2 || random() < 0.1) { // SPRINGS (World 3+)
            if (random() < 0.3) {
                level.springs.push({ x: curX + width/2 - 20, y: curY - 20, w: 40, h: 20 });
            }
        }
        
        if (world >= 1 || random() < 0.1) { // COINS (World 2+)
            if (random() < 0.4) {
                const coinX = curX + width/2 - 10;
                const coinY = curY - 60;
                level.coins.push({ x: coinX, y: coinY, w: 20, h: 20, collected: false });
                
                // Coin Bait Trap (Spike falls when you go for coin)
                if (random() < 0.5) {
                    level.platforms.push({ x: coinX - 40, y: -100, w: 100, h: 60, active: true });
                    level.traps.push(new Trap({ type: 'ceiling_drop', triggerType: 'x_greater', triggerX: coinX - 40, targetId: level.platforms.length - 1 }));
                }
            }
        }
        
        if (world >= 5 || random() < 0.1) { // CRATES (World 6+)
            if (random() < 0.3) {
                level.crates.push({ x: curX + 20, y: curY - 40, w: 40, h: 40, pushable: true });
            }
        }
        
        if (world >= 6 || random() < 0.1) { // SAWS & BULLETS (World 7+)
            if (random() < 0.3) {
                if (random() < 0.5) {
                    level.saws.push({ x: curX + width/2 - 15, y: curY - 60, w: 30, h: 30, startX: curX, patrolRangeX: 50, speed: 500 });
                } else {
                    level.bullets.push({ x: curX + width, y: curY - 30, w: 16, h: 16, vx: -3 });
                }
            }
        }

        curX += width;
        platId = level.platforms.length; // Track the main platform index
    }
    
    // Add end platform (Guarantees the door is always at x=1920 so it's perfectly visible)
    level.platforms.push({ x: curX, y: 440, w: Math.max(200, 2000 - curX), h: 60, active: true });
    level.door.x = curX + 100;
    level.door.y = 440 - 56;
    
    // Final Door troll (Door moves away backwards!)
    if (random() < 0.3) {
        level.traps.push(new Trap({ type: 'door_move', triggerType: 'x_greater', triggerX: level.door.x - 100, data: { newX: level.door.x - 600, newY: level.door.y } }));
        // Ensure there is a platform where the door teleports
        level.platforms.push({ x: level.door.x - 650, y: level.door.y + 56, w: 200, h: 20, active: true });
    } else if (random() < 0.4) {
        // Spikes right before the door
        level.spikes.push({ x: level.door.x - 30, y: 440 });
        level.traps.push(new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: level.door.x - 80, targetId: level.spikes.length - 1 }));
    }

    return level;
}

// ============================================
// HELL MODE GENERATOR
// ============================================
function generateHellLevel(tier) {
    // Reset seed for consistency or let it be random every time
    // For Hell speedruns, it's usually the same seed so players can compete on the exact same layout!
    let RNG_STATE = 666 + tier;

    function random() {
        RNG_STATE += 1;
        return seededRandom(RNG_STATE);
    }
    
    function randomRange(min, max) {
        return min + random() * (max - min);
    }

    const level = {
        name: tier === 0 ? "HELL: BEGINNER" : tier === 1 ? "HELL: PRO" : "HELL: HACKER",
        hint: "Welcome to Hell. There are no rules.",
        playerStart: { x: 50, y: 384 },
        platforms: [{ x: 0, y: 440, w: 150, h: 60, active: true }],
        door: { x: 0, y: 0, w: 36, h: 56, open: true },
        traps: [],
        spikes: [],
        coins: [],
        crates: [],
        springs: [],
        bullets: [],
        saws: [],
        gravityFlipped: false
    };

    const targetX = 4000 + (tier * 2000); // 4000, 6000, 8000
    let curX = 150;
    let curY = 440;

    let platId = 1;

    while (curX < targetX) {
        const gap = randomRange(30, 90);
        curX += gap;
        let width = randomRange(60, 180);
        
        curY += randomRange(-60, 60);
        if (curY < 200) curY = 200;
        if (curY > 500) curY = 500;

        level.platforms.push({ x: curX, y: curY, w: width, h: 60, active: true });
        
        // Massive trap density
        const r = random();
        
        // 1. Invisible hole
        if (r < 0.15) {
            level.traps.push(new Trap({ type: 'platform_drop', triggerType: 'x_greater', triggerX: curX + width/2 - 20, targetId: platId }));
        }
        // 2. Rising Spike
        else if (r < 0.3) {
            level.spikes.push({ x: curX + width/2 - 12, y: curY });
            level.traps.push(new Trap({ type: 'spike_rise', triggerType: 'x_greater', triggerX: curX + 10, targetId: level.spikes.length - 1 }));
        }
        // 3. Falling Spike (Ceiling block)
        else if (r < 0.4) {
            level.platforms.push({ x: curX + width/2 - 20, y: curY - 200, w: 40, h: 40, active: true, dropping: false });
            const ceilId = level.platforms.length - 1;
            level.spikes.push({ x: curX + width/2 - 12, y: curY - 160, w: 24, h: 24, direction: 'down', attachedTo: ceilId, active: true });
            level.traps.push(new Trap({ type: 'ceiling_drop', triggerType: 'x_greater', triggerX: curX + 10, targetId: ceilId }));
        }
        // 4. Spring into spikes
        else if (r < 0.5) {
            level.springs.push({ x: curX + width/2 - 16, y: curY - 16, w: 32, h: 16 });
            level.spikes.push({ x: curX + width/2 - 12, y: curY - 200, w: 24, h: 24, direction: 'down', active: true });
        }
        // 5. Crate drop
        else if (r < 0.6) {
            level.crates.push({ x: curX + width/2 - 20, y: curY - 200, w: 40, h: 40, vx: 0, vy: 0, grounded: false });
        }
        // 6. Projectile Shooter
        else if (r < 0.7 && tier > 0) {
            level.bullets.push({ x: curX + width, y: curY - 30, w: 10, h: 10, vx: -5, vy: 0 });
        }
        // 7. Patrolling Saw
        else if (r < 0.8 && tier > 0) {
            level.saws.push({ x: curX + width/2, y: curY - 30, radius: 15, patrolRangeX: width/2, speed: 500 });
        }
        // 8. Fake Coin Trap
        else if (r < 0.9) {
            level.coins.push({ x: curX + width/2 - 10, y: curY - 80, w: 20, h: 20, collected: false });
            level.spikes.push({ x: curX + width/2 - 12, y: curY });
            level.traps.push(new Trap({ type: 'spike_rise', triggerType: 'coin_collect', triggerX: 0, targetId: level.spikes.length - 1 }));
        }
        
        // Randomly flip gravity if Hacker
        if (tier === 2 && random() < 0.05) {
            level.gravityFlipped = true;
        }

        curX += width;
        platId = level.platforms.length - 1;
    }

    // End platform
    level.platforms.push({ x: curX, y: 440, w: 400, h: 60, active: true });
    level.door.x = curX + 150;
    level.door.y = 440 - 56;

    // Hell Door Troll
    level.traps.push(new Trap({ type: 'door_move', triggerType: 'x_greater', triggerX: level.door.x - 100, data: { newX: level.door.x - 800, newY: level.door.y } }));
    level.platforms.push({ x: level.door.x - 850, y: level.door.y + 56, w: 200, h: 20, active: true });

    // Ensure Hell level sets width properly for camera
    let maxPlatX = 800;
    for (const p of level.platforms) {
        if (p.x + p.w > maxPlatX) maxPlatX = p.x + p.w;
    }
    const sy = window.innerHeight / 500;
    level.width = maxPlatX * sy;

    return level;
}

