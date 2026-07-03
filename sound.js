// ============================================================
//  sound.js – Don't Troll Game  |  Clean Chiptune Sound Engine
//  All sounds generated via Web Audio API — no files needed.
//  Replaced all harsh sawtooth oscillators with smooth
//  sine/triangle waves and soft envelopes to avoid distortion.
// ============================================================

const SoundEngine = (() => {
    let ctx = null;
    let masterGain = null;
    let enabled = true;

    function init() {
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.18; // Low master volume — prevents any clipping
            masterGain.connect(ctx.destination);
        } catch (e) {
            console.warn('Web Audio not supported:', e);
        }
    }

    function resume() {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    function setEnabled(val) {
        enabled = val;
        if (masterGain) masterGain.gain.value = val ? 0.18 : 0;
    }

    function now() { return ctx ? ctx.currentTime : 0; }

    // ── Core tone helper (sine or triangle only — no harsh waves) ──
    function tone(freq, startTime, duration, vol = 0.4, type = 'sine', fadeIn = 0.005) {
        if (!ctx || !enabled) return;

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(vol, startTime + fadeIn);        // smooth attack
        g.gain.setValueAtTime(vol, startTime + duration * 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // smooth release
        g.connect(masterGain);

        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(freq, startTime);
        o.connect(g);
        o.start(startTime);
        o.stop(startTime + duration + 0.02);
    }

    // Soft noise burst (landing thud, etc.) using band-pass filtered noise
    function softNoise(startTime, duration, vol = 0.15, bpFreq = 200) {
        if (!ctx || !enabled) return;
        const bufSize = Math.floor(ctx.sampleRate * duration);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

        const src = ctx.createBufferSource();
        src.buffer = buf;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = bpFreq;
        filter.Q.value = 1.5;

        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, startTime);
        g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        src.connect(filter);
        filter.connect(g);
        g.connect(masterGain);
        src.start(startTime);
        src.stop(startTime + duration + 0.02);
    }

    // ── Sound Effects ──────────────────────────────────────

    /**
     * JUMP — smooth rising sine chirp (classic Mario-style)
     */
    function jump() {
        resume();
        if (!ctx || !enabled) return;
        const t = now();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(280, t);
        o.frequency.exponentialRampToValueAtTime(560, t + 0.15);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.45, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(g);
        g.connect(masterGain);
        o.start(t);
        o.stop(t + 0.2);
    }

    /**
     * LAND — soft thud: low sine bump + gentle noise
     */
    function land() {
        resume();
        if (!ctx || !enabled) return;
        const t = now();
        // Low sine bump
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(110, t);
        o.frequency.exponentialRampToValueAtTime(55, t + 0.08);
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        o.connect(g);
        g.connect(masterGain);
        o.start(t);
        o.stop(t + 0.1);
        // Soft noise layer
        softNoise(t, 0.07, 0.1, 180);
    }

    /**
     * DEATH — gentle descending arpeggio (no harsh noise)
     */
    function death() {
        resume();
        if (!ctx || !enabled) return;
        const t = now();
        // Three descending triangle tones
        const notes = [440, 330, 220];
        notes.forEach((freq, i) => {
            tone(freq, t + i * 0.12, 0.18, 0.35, 'triangle');
        });
        // Very soft low rumble
        softNoise(t + 0.1, 0.25, 0.08, 120);
    }

    /**
     * WIN / LEVEL CLEAR — bright upward arpeggio (pure sine)
     */
    function win() {
        resume();
        if (!ctx || !enabled) return;
        const t = now();
        const notes = [
            [261, 0.0],  // C4
            [329, 0.09], // E4
            [392, 0.18], // G4
            [523, 0.27], // C5
            [659, 0.38], // E5
            [784, 0.50], // G5
        ];
        notes.forEach(([freq, delay]) => {
            tone(freq, t + delay, 0.22, 0.3, 'sine');
        });
        // Soft sparkle on top
        tone(1046, t + 0.55, 0.35, 0.18, 'sine');
    }

    /**
     * TRAP trigger — short descending two-tone alert (triangle, soft)
     */
    function trap() {
        resume();
        if (!ctx || !enabled) return;
        const t = now();
        tone(520, t,        0.08, 0.3, 'triangle');
        tone(390, t + 0.07, 0.10, 0.28, 'triangle');
        softNoise(t, 0.1, 0.07, 500);
    }

    /**
     * BUTTON CLICK — tiny two-note blip (sine)
     */
    function click() {
        resume();
        if (!ctx || !enabled) return;
        const t = now();
        tone(660, t,        0.05, 0.25, 'sine');
        tone(880, t + 0.04, 0.05, 0.18, 'sine');
    }

    /**
     * COIN — bright two-ping chime (sine, very clean)
     */
    function coin() {
        resume();
        if (!ctx || !enabled) return;
        const t = now();
        tone(1047, t,        0.1, 0.28, 'sine');
        tone(1319, t + 0.08, 0.12, 0.22, 'sine');
    }

    /**
     * LEVEL START — three-note ascending fanfare (triangle)
     */
    function levelStart() {
        resume();
        if (!ctx || !enabled) return;
        const t = now();
        tone(330, t,        0.14, 0.28, 'triangle');
        tone(392, t + 0.12, 0.14, 0.25, 'triangle');
        tone(523, t + 0.24, 0.22, 0.28, 'triangle');
    }

    /**
     * MENU JINGLE — simple pleasant 8-bar chip tune (sine + triangle)
     *  Plays once when the user first clicks on the menu.
     */
    function menuJingle() {
        resume();
        if (!ctx || !enabled) return;
        const t = now();

        // Melody (sine, gentle)
        const melody = [
            [392, 0.00, 0.10],  // G4
            [440, 0.11, 0.10],  // A4
            [523, 0.22, 0.18],  // C5
            [494, 0.42, 0.10],  // B4
            [440, 0.54, 0.10],  // A4
            [392, 0.66, 0.22],  // G4
            [349, 0.90, 0.10],  // F4
            [392, 1.02, 0.10],  // G4
            [440, 1.14, 0.14],  // A4
            [523, 1.30, 0.28],  // C5
        ];
        melody.forEach(([freq, delay, dur]) => {
            tone(freq, t + delay, dur, 0.22, 'sine');
        });

        // Bass (triangle, very quiet)
        const bass = [
            [130, 0.00, 0.20],
            [130, 0.44, 0.20],
            [110, 0.88, 0.20],
            [130, 1.28, 0.30],
        ];
        bass.forEach(([freq, delay, dur]) => {
            tone(freq, t + delay, dur, 0.12, 'triangle');
        });
    }

    // ── Background Music (BGM) ────────────────────────────────
    let bgmLoopId = null;
    let bgmNotes = [
        [261, 0.15], [329, 0.15], [392, 0.15], [329, 0.15], // C E G E
        [349, 0.15], [440, 0.15], [523, 0.15], [440, 0.15], // F A C A
        [392, 0.15], [493, 0.15], [587, 0.15], [493, 0.15], // G B D B
        [261, 0.30], [261, 0.30]                            // C C (long)
    ];
    let isBGMPlaying = false;
    let currentBGMTime = 0;

    function playBGM() {
        if (isBGMPlaying || !enabled) return;
        resume();
        if (!ctx) return;
        isBGMPlaying = true;
        currentBGMTime = now() + 0.1;
        scheduleBGM();
    }

    function scheduleBGM() {
        if (!isBGMPlaying || !enabled) return;
        const lookahead = 0.5; // Schedule half a second ahead
        while (currentBGMTime < now() + lookahead) {
            let patternDuration = 0;
            bgmNotes.forEach(([freq, dur]) => {
                tone(freq, currentBGMTime + patternDuration, dur * 0.8, 0.08, 'square');
                patternDuration += dur;
            });
            currentBGMTime += patternDuration;
        }
        bgmLoopId = setTimeout(scheduleBGM, 200);
    }

    function stopBGM() {
        isBGMPlaying = false;
        if (bgmLoopId) {
            clearTimeout(bgmLoopId);
            bgmLoopId = null;
        }
    }

    return {
        init,
        setEnabled,
        resume,
        jump,
        land,
        death,
        win,
        trap,
        click,
        coin,
        levelStart,
        menuJingle,
        playBGM,
        stopBGM
    };
})();
