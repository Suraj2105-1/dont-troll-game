// ============================================
// RENDERER - Level Devil exact visual style
// Mustard yellow bg, orange ground, black player
// triangular spikes, simple clean aesthetic
// ============================================

const Renderer = {
    // Base colors that don't change per world
    COLORS: {
        FRAME_DARK: '#2D2D2D',
        PLAYER_BLACK: '#111111',
        SHADOW: 'rgba(0,0,0,0.15)',
        DOOR_DARK: '#2D2D2D',
        DOOR_INNER: '#1a1a1a',
        TEXT_RED: '#8B1A1A',
        WHITE: '#FFFFFF',
        COIN: '#FFD700',
        SPRING: '#A0A0A0',
        CRATE: '#8B4513',
        SAW: '#708090'
    },

    // 8 distinct palettes for the 8 worlds
    WORLD_COLORS: [
        { bg: '#E8B830', ground: '#C45A2C', groundTop: '#D4663A', spike: '#B5441E' }, // World 1: PITS (Orange)
        { bg: '#FFDAB9', ground: '#FF8C00', groundTop: '#FFA500', spike: '#CD853F' }, // World 2: COINS (Peach/Gold)
        { bg: '#98FB98', ground: '#2E8B57', groundTop: '#3CB371', spike: '#006400' }, // World 3: SPRINGS (Green)
        { bg: '#DDA0DD', ground: '#8A2BE2', groundTop: '#9370DB', spike: '#4B0082' }, // World 4: GRAVITY (Purple)
        { bg: '#87CEFA', ground: '#4682B4', groundTop: '#5F9EA0', spike: '#000080' }, // World 5: WRAPAROUND (Blue)
        { bg: '#F5DEB3', ground: '#A0522D', groundTop: '#CD853F', spike: '#8B4513' }, // World 6: CRATES (Wood/Sand)
        { bg: '#FFB6C1', ground: '#DC143C', groundTop: '#FF69B4', spike: '#8B0000' }, // World 7: BULLETS (Pink/Red)
        { bg: '#696969', ground: '#2F4F4F', groundTop: '#708090', spike: '#000000' }, // World 8: INVERT (Grey/Dark)
    ],

    ctx: null,
    canvas: null,
    shakeX: 0,
    shakeY: 0,
    shakeTimer: 0,
    particles: [],
    flashAlpha: 0,
    currentWorld: 0,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
    },

    // Screen shake effect
    startShake(intensity = 8, duration = 300) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    },

    // Flash effect on death
    startFlash() {
        this.flashAlpha = 0.6;
    },

    // Add death particles
    addDeathParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 3,
                size: 3 + Math.random() * 5,
                life: 1,
                decay: 0.02 + Math.random() * 0.03,
                color: Math.random() > 0.5 ? this.COLORS.PLAYER_BLACK : this.COLORS.FRAME_DARK,
            });
        }
    },

    updateEffects(dt) {
        // Shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }

        // Flash fade
        if (this.flashAlpha > 0) {
            this.flashAlpha -= 0.03;
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    clear() {
        const ctx = this.ctx;
        
        const palette = this.WORLD_COLORS[this.currentWorld] || this.WORLD_COLORS[0];

        // Background (Stays fixed to screen)
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Subtle texture dots on background (parallax later if needed)
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        for (let i = 0; i < 30; i++) {
            const bx = (i * 137 + 50) % this.canvas.width;
            const by = (i * 89 + 30) % (this.canvas.height - 100);
            ctx.fillRect(bx, by, 6, 6);
        }
    },

    beginWorld(cameraX, cameraY) {
        this.ctx.save();
        this.ctx.translate(-cameraX + this.shakeX, -cameraY + this.shakeY);
    },

    // Draw a platform
    drawPlatform(x, y, w, h, type = 'normal') {
        const ctx = this.ctx;
        const palette = this.WORLD_COLORS[this.currentWorld] || this.WORLD_COLORS[0];

        // All platforms must look EXACTLY the same so traps are hidden
        ctx.fillStyle = palette.ground;
        ctx.fillRect(x, y, w, h);

        // Top edge highlight
        ctx.fillStyle = palette.groundTop;
        ctx.fillRect(x, y, w, 3);

        // Subtle brick lines
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        for (let bx = x; bx < x + w; bx += 32) {
            ctx.beginPath();
            ctx.moveTo(bx, y);
            ctx.lineTo(bx, y + h);
            ctx.stroke();
        }
        for (let by = y + 16; by < y + h; by += 16) {
            ctx.beginPath();
            ctx.moveTo(x, by);
            ctx.lineTo(x + w, by);
            ctx.stroke();
        }
    },

    // Draw spikes
    drawSpike(x, y, w, h, direction = 'up') {
        const ctx = this.ctx;
        const palette = this.WORLD_COLORS[this.currentWorld] || this.WORLD_COLORS[0];
        
        ctx.fillStyle = palette.spike;

        const spikeWidth = w;
        const spikeHeight = h;

        ctx.beginPath();
        if (direction === 'up') {
            ctx.moveTo(x, y + spikeHeight);
            ctx.lineTo(x + spikeWidth / 2, y);
            ctx.lineTo(x + spikeWidth, y + spikeHeight);
        } else if (direction === 'down') {
            ctx.moveTo(x, y);
            ctx.lineTo(x + spikeWidth / 2, y + spikeHeight);
            ctx.lineTo(x + spikeWidth, y);
        } else if (direction === 'left') {
            ctx.moveTo(x + spikeWidth, y);
            ctx.lineTo(x, y + spikeHeight / 2);
            ctx.lineTo(x + spikeWidth, y + spikeHeight);
        } else if (direction === 'right') {
            ctx.moveTo(x, y);
            ctx.lineTo(x + spikeWidth, y + spikeHeight / 2);
            ctx.lineTo(x, y + spikeHeight);
        }
        ctx.closePath();
        ctx.fill();

        // Dark edge
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
    },

    // Draw the player - black blocky pixel figure like Level Devil
    drawPlayer(x, y, w, h, facingRight = true) {
        const ctx = this.ctx;

        // Shadow under player
        ctx.fillStyle = this.COLORS.SHADOW;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h + 4, w * 0.6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Player body - solid black block character
        ctx.fillStyle = this.COLORS.PLAYER_BLACK;

        // Head
        const headW = w * 0.65;
        const headH = h * 0.3;
        const headX = x + (w - headW) / 2;
        const headY = y;
        ctx.fillRect(headX, headY, headW, headH);

        // Body
        const bodyW = w * 0.5;
        const bodyH = h * 0.3;
        const bodyX = x + (w - bodyW) / 2;
        const bodyY = y + headH;
        ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

        // Arms
        const armW = w * 0.15;
        const armH = h * 0.25;
        // Left arm
        ctx.fillRect(bodyX - armW - 1, bodyY + 2, armW, armH);
        // Right arm
        ctx.fillRect(bodyX + bodyW + 1, bodyY + 2, armW, armH);

        // Legs
        const legW = w * 0.18;
        const legH = h * 0.35;
        const legY = bodyY + bodyH;
        // Left leg
        ctx.fillRect(bodyX + 2, legY, legW, legH);
        // Right leg
        ctx.fillRect(bodyX + bodyW - legW - 2, legY, legW, legH);
    },

    // Draw the door (exit) - dark rectangle with inner detail
    drawDoor(x, y, w, h, open = true) {
        const ctx = this.ctx;

        // Door frame
        ctx.fillStyle = this.COLORS.DOOR_DARK;
        ctx.fillRect(x, y, w, h);

        // Inner door
        ctx.fillStyle = open ? this.COLORS.DOOR_INNER : '#444';
        ctx.fillRect(x + 4, y + 4, w - 8, h - 4);

        // Door handle
        ctx.fillStyle = open ? '#E8B830' : '#666';
        ctx.fillRect(x + w - 12, y + h / 2 - 2, 4, 4);

        // Light glow if open
        if (open) {
            ctx.fillStyle = 'rgba(232, 184, 48, 0.3)';
            ctx.fillRect(x - 4, y, w + 8, h + 4);
        }
    },

    // Draw Springs
    drawSpring(spring) {
        const ctx = this.ctx;
        ctx.fillStyle = this.COLORS.SPRING;
        const h = spring.bouncing ? spring.h * 0.5 : spring.h;
        const y = spring.y + (spring.h - h);
        ctx.fillRect(spring.x, y, spring.w, h);
        ctx.fillStyle = '#606060';
        ctx.fillRect(spring.x + 2, y + 2, spring.w - 4, h - 4);
    },

    // Draw Coins
    drawCoin(coin) {
        if (coin.collected) return;
        const ctx = this.ctx;
        ctx.fillStyle = this.COLORS.COIN;
        ctx.beginPath();
        const pulse = Math.sin(Date.now() / 150) * 2;
        ctx.arc(coin.x + coin.w / 2, coin.y + coin.h / 2, (coin.w / 2) + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(coin.x + coin.w / 2, coin.y + coin.h / 2, (coin.w / 4) + pulse, 0, Math.PI * 2);
        ctx.fill();
    },

    // Draw Crates
    drawCrate(crate) {
        const ctx = this.ctx;
        ctx.fillStyle = this.COLORS.CRATE;
        ctx.fillRect(crate.x, crate.y, crate.w, crate.h);
        ctx.strokeStyle = '#5C4033';
        ctx.lineWidth = 2;
        ctx.strokeRect(crate.x + 2, crate.y + 2, crate.w - 4, crate.h - 4);
        ctx.beginPath();
        ctx.moveTo(crate.x + 4, crate.y + 4);
        ctx.lineTo(crate.x + crate.w - 4, crate.y + crate.h - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(crate.x + crate.w - 4, crate.y + 4);
        ctx.lineTo(crate.x + 4, crate.y + crate.h - 4);
        ctx.stroke();
    },

    // Draw Saws
    drawSaw(saw) {
        const ctx = this.ctx;
        ctx.fillStyle = this.COLORS.SAW;
        ctx.save();
        ctx.translate(saw.x + saw.w/2, saw.y + saw.h/2);
        ctx.rotate(Date.now() / 100);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            ctx.lineTo(0, -saw.w/2);
            ctx.rotate(Math.PI / 4);
            ctx.lineTo(0, -saw.w/4);
            ctx.rotate(Math.PI / 4);
        }
        ctx.fill();
        ctx.fillStyle = '#404040';
        ctx.beginPath();
        ctx.arc(0, 0, saw.w/4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    
    // Draw Bullets
    drawBullet(bullet) {
        const ctx = this.ctx;
        ctx.fillStyle = this.COLORS.PLAYER_BLACK;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.w/2, bullet.y + bullet.h/2, bullet.w/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.COLORS.TEXT_RED;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.w/2, bullet.y + bullet.h/2, bullet.w/4, 0, Math.PI * 2);
        ctx.fill();
    },

    // Draw particles
    drawParticles() {
        const ctx = this.ctx;
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    },

    // Draw flash overlay
    drawFlash() {
        if (this.flashAlpha > 0) {
            this.ctx.fillStyle = `rgba(255, 50, 50, ${this.flashAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    // End frame
    endFrame() {
        this.drawParticles();
        this.drawFlash();
        this.ctx.restore();
    },

    // Draw text with Level Devil style
    drawText(text, x, y, size = 20, color = '#2D2D2D', align = 'center') {
        const ctx = this.ctx;
        ctx.font = `${size}px 'Press Start 2P', monospace`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    },

    // Draw hint text (smaller, faded)
    drawHint(text, x, y) {
        this.drawText(text, x, y, 10, 'rgba(45,45,45,0.5)');
    },
    
    // Draw the iconic Level Devil closing mouth animation
    drawDevilMouth(progress) {
        if (progress <= 0) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const midY = h / 2;
        
        // Offset is how far the jaws have closed. Progress 1.0 = fully closed.
        // We go slightly past midY so the teeth overlap
        const offset = (midY + 20) * progress;
        
        // The jagged teeth width (more teeth = sharper)
        const numTeeth = 24; 
        const toothWidth = w / numTeeth;
        const toothHeight = 80;
        
        ctx.save();
        ctx.fillStyle = '#8B1A1A'; // Dark red
        
        // --- DRAW TOP HALF ---
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w, 0);
        ctx.lineTo(w, offset - toothHeight);
        
        // Top jagged teeth pointing down
        for (let i = numTeeth; i >= 0; i--) {
            const tx = i * toothWidth;
            const ty = offset - (i % 2 === 0 ? 0 : toothHeight);
            ctx.lineTo(tx, ty);
        }
        ctx.closePath();
        ctx.fill();
        
        // Top Half Eyes (Angry)
        if (progress > 0.4) {
            ctx.fillStyle = '#111'; // Almost black
            // Left eye - moved upward
            ctx.beginPath();
            ctx.moveTo(w/2 - 180, offset - 250); // Top left
            ctx.lineTo(w/2 - 40, offset - 180); // Bottom tip
            ctx.lineTo(w/2 - 250, offset - 120); // Bottom left
            ctx.fill();
            // Right eye - moved upward
            ctx.beginPath();
            ctx.moveTo(w/2 + 180, offset - 250); 
            ctx.lineTo(w/2 + 40, offset - 180); 
            ctx.lineTo(w/2 + 250, offset - 120); 
            ctx.fill();
        }

        // --- DRAW BOTTOM HALF ---
        ctx.fillStyle = '#8B1A1A'; 
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(w, h);
        ctx.lineTo(w, h - offset + toothHeight);
        
        // Bottom jagged teeth pointing up
        for (let i = numTeeth; i >= 0; i--) {
            const tx = i * toothWidth;
            // The teeth should interlock, so reverse the parity
            const ty = h - offset + (i % 2 === 0 ? toothHeight : 0);
            ctx.lineTo(tx, ty);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
};
