// ============================================
// PLAYER - Black pixel block character
// Physics, movement, collision, death
// ============================================

class Player {
    constructor(x, y) {
        // Scale factor based on screen vs design resolution
        const scale = Math.min(window.innerWidth / 800, window.innerHeight / 500);

        this.spawnX = x;
        this.spawnY = y;
        this.x = x;
        this.y = y;
        this.w = Math.round(28 * scale);
        this.h = Math.round(36 * scale);
        this.vx = 0;
        this.vy = 0;
        this.speed = 4.5 * scale;
        this.jumpForce = -10 * scale;
        this.gravity = 0.55 * scale;
        this.maxFallSpeed = 12 * scale;
        this.grounded = false;
        this.facingRight = true;
        this.alive = true;
        this.won = false;
        this.invertControls = false;

        // Input state
        this.keys = {
            left: false,
            right: false,
            jump: false,
        };
    }

    reset() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
        this.alive = true;
        this.won = false;
        this.invertControls = false;
    }

    update(level, canvasW, canvasH) {
        if (!this.alive || this.won) return;

        const platforms = level.platforms.filter(p => p.active);
        const spikes = level.spikes || [];
        const door = level.door;
        const springs = level.springs || [];
        const crates = level.crates || [];
        const coins = level.coins || [];

        // Horizontal movement
        let moveLeft = this.keys.left;
        let moveRight = this.keys.right;

        if (this.invertControls) {
            [moveLeft, moveRight] = [moveRight, moveLeft];
        }

        if (moveLeft) {
            this.vx = -this.speed;
            this.facingRight = false;
        } else if (moveRight) {
            this.vx = this.speed;
            this.facingRight = true;
        } else {
            this.vx *= 0.7; // friction
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Jump
        if (this.keys.jump && this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
            SoundEngine.jump();
        }

        // Gravity
        this.vy += this.gravity;
        if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;

        // Move X
        this.x += this.vx;

        // Collide X with platforms & crates
        this.grounded = false;
        const xColliders = [...platforms, ...crates];
        for (const p of xColliders) {
            if (this.overlaps(p)) {
                if (this.vx > 0) {
                    this.x = p.x - this.w;
                    if (p.pushable) p.x += this.vx; // Push crate
                } else if (this.vx < 0) {
                    this.x = p.x + p.w;
                    if (p.pushable) p.x += this.vx; // Push crate
                }
                this.vx = 0;
            }
        }

        // Move Y
        this.y += this.vy;

        // Collide Y with platforms & crates
        const wasGrounded = this.grounded;
        const yColliders = [...platforms, ...crates];
        for (const p of yColliders) {
            if (this.overlaps(p)) {
                if (this.vy > 0) {
                    this.y = p.y - this.h;
                    this.vy = 0;
                    if (!wasGrounded) SoundEngine.land(); // landing thud
                    this.grounded = true;
                } else if (this.vy < 0) {
                    this.y = p.y + p.h;
                    this.vy = 0;
                }
            }
        }

        // Springs collision
        for (const spring of springs) {
            if (this.overlaps(spring)) {
                // Bounce up strongly
                this.vy = this.jumpForce * 1.5; 
                this.grounded = false;
                spring.bouncing = true; // For animation
                setTimeout(() => spring.bouncing = false, 200);
            }
        }

        // Coins collision
        for (let i = 0; i < coins.length; i++) {
            const coin = coins[i];
            if (!coin.collected && this.overlaps(coin)) {
                coin.collected = true;
                SoundEngine.coin();
                Achievements.onCoinCollect();
            }
        }

        // Boundaries
        if (level.wraparound) {
            // Wraparound world!
            if (this.x < -this.w) this.x = canvasW;
            if (this.x > canvasW) this.x = -this.w;
        } else {
            // Hard walls
            if (this.x < 0) this.x = 0;
            if (this.x + this.w > canvasW) this.x = canvasW - this.w;
        }

        // Ceiling (always hard wall unless flipped gravity?)
        if (this.y < -100 && !level.wraparoundY) {
            this.y = -100;
            this.vy = 0;
        }

        // Fell off screen → death (or wrap if wrapY is enabled, though typically it's just X)
        if (this.y > canvasH + 50) {
            this.die();
            return;
        }

        // Spike collision
        for (const s of spikes) {
            if (!s.active) continue;
            if (this.overlapsSpike(s)) {
                this.die();
                return;
            }
        }

        // Saw collision
        const saws = level.saws || [];
        for (const saw of saws) {
            // Saws use a slightly smaller circular-ish hitbox, but rectangular overlap is fine for now
            if (this.overlaps(saw)) {
                this.die();
                return;
            }
        }

        // Bullet collision
        const bullets = level.bullets || [];
        for (const bullet of bullets) {
            if (this.overlaps(bullet)) {
                this.die();
                return;
            }
        }

        // Door collision → win
        if (door && door.open) {
            if (this.x + this.w > door.x + 8 && this.x < door.x + door.w - 8 &&
                this.y + this.h > door.y + 8 && this.y < door.y + door.h) {
                this.won = true;
            }
        }
    }

    overlaps(rect) {
        return this.x < rect.x + rect.w &&
               this.x + this.w > rect.x &&
               this.y < rect.y + rect.h &&
               this.y + this.h > rect.y;
    }

    overlapsSpike(spike) {
        // Smaller hitbox for spikes horizontally, but deadly on the exact top surface!
        const marginX = 6;
        const marginY = 0; // Spikes are sharp, touching the tip kills you!
        return this.x + marginX < spike.x + spike.w - marginX &&
               this.x + this.w - marginX > spike.x + marginX &&
               this.y + marginY <= spike.y + spike.h - marginY &&
               this.y + this.h >= spike.y + marginY;
    }

    die() {
        this.alive = false;
        Renderer.addDeathParticles(this.x + this.w / 2, this.y + this.h / 2);
        Renderer.startShake(10, 400);
        Renderer.startFlash();
    }

    draw() {
        if (!this.alive) return;
        Renderer.drawPlayer(this.x, this.y, this.w, this.h, this.facingRight);
    }
}
