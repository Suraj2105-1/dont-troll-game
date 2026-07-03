// ============================================
// TRAPS - Troll mechanics system
// Disappearing floors, moving doors, spikes, etc.
// ============================================

class Trap {
    constructor(config) {
        this.type = config.type;           // 'disappear', 'spike_rise', 'door_move', 'gravity_flip', 'ceiling_drop', 'speed_change', 'mirror'
        this.triggerX = config.triggerX;   // Player X position to trigger
        this.triggerY = config.triggerY;   // Optional Y trigger
        this.triggerType = config.triggerType || 'x_greater'; // 'x_greater', 'x_less', 'y_greater', 'timer', 'step_on'
        this.targetId = config.targetId;   // ID of platform/spike/door to affect
        this.triggered = false;
        this.delay = config.delay || 0;    // Delay before effect (ms)
        this.data = config.data || {};     // Extra data for the trap
        this.timer = 0;
        this.active = true;
    }

    check(player, level) {
        if (this.triggered || !this.active) return;

        let shouldTrigger = false;

        switch (this.triggerType) {
            case 'x_greater':
                shouldTrigger = player.x > this.triggerX;
                break;
            case 'x_less':
                shouldTrigger = player.x < this.triggerX;
                break;
            case 'y_greater':
                shouldTrigger = player.y > this.triggerY;
                break;
            case 'y_less':
                shouldTrigger = player.y < this.triggerY;
                break;
            case 'step_on':
                // Trigger when player stands on a specific platform
                if (this.targetId !== undefined) {
                    const plat = level.platforms[this.targetId];
                    if (plat && plat.active) {
                        const onTop = player.y + player.h >= plat.y - 2 &&
                                      player.y + player.h <= plat.y + 6 &&
                                      player.x + player.w > plat.x &&
                                      player.x < plat.x + plat.w;
                        shouldTrigger = onTop;
                    }
                }
                break;
            case 'timer':
                // Trigger after set time
                this.timer += 16;
                shouldTrigger = this.timer >= this.triggerX;
                break;
            case 'coin_collect':
                if (this.targetId !== undefined && level.coins && level.coins[this.targetId]) {
                    shouldTrigger = level.coins[this.targetId].collected;
                }
                break;
        }

        if (shouldTrigger) {
            this.triggered = true;
            if (this.delay > 0) {
                setTimeout(() => this.execute(level), this.delay);
            } else {
                this.execute(level);
            }
        }
    }

    execute(level) {
        switch (this.type) {
            case 'disappear':
                // Make a platform disappear
                if (level.platforms[this.targetId]) {
                    // Shake before disappearing
                    const plat = level.platforms[this.targetId];
                    plat.shaking = true;
                    setTimeout(() => {
                        plat.active = false;
                        plat.shaking = false;
                        Renderer.startShake(4, 200);
                    }, this.data.shakeTime || 400);
                }
                break;

            case 'spike_rise':
                // Make hidden spikes appear and pop out
                if (level.spikes[this.targetId]) {
                    const sp = level.spikes[this.targetId];
                    sp.active = true;
                    if (sp.direction === 'up' || !sp.direction) sp.y -= sp.h; // Shoot up out of ground!
                    else if (sp.direction === 'down') sp.y += sp.h;
                    Renderer.startShake(3, 150);
                }
                break;

            case 'door_move':
                // Move the door to a new position
                if (level.door) {
                    const newX = this.data.newX !== undefined ? this.data.newX : level.door.x;
                    const newY = this.data.newY !== undefined ? this.data.newY : level.door.y;
                    level.door.targetX = newX;
                    level.door.targetY = newY;
                    level.door.moving = true;
                }
                break;

            case 'gravity_flip':
                // Not implemented via trap - handled in level update
                level.gravityFlipped = true;
                break;

            case 'ceiling_drop':
                // Move ceiling platforms down
                if (level.platforms[this.targetId]) {
                    const ceil = level.platforms[this.targetId];
                    ceil.targetY = this.data.newY || ceil.y + 200;
                    ceil.dropping = true;
                }
                break;

            case 'speed_change':
                if (level.player) {
                    level.player.speed = this.data.newSpeed || 8;
                }
                break;

            case 'mirror':
                if (level.player) {
                    level.player.invertControls = true;
                }
                break;

            case 'platform_move':
                if (level.platforms[this.targetId]) {
                    const p = level.platforms[this.targetId];
                    p.targetX = this.data.newX !== undefined ? this.data.newX : p.x;
                    p.targetY = this.data.newY !== undefined ? this.data.newY : p.y;
                    p.movingTrap = true;
                }
                break;
        }
    }
}

// Update animated traps each frame
function updateTrappedPlatforms(platforms, dt) {
    for (const p of platforms) {
        // Shaking animation before disappear
        if (p.shaking) {
            p.drawOffsetX = (Math.random() - 0.5) * 6;
            p.drawOffsetY = (Math.random() - 0.5) * 3;
        } else {
            p.drawOffsetX = 0;
            p.drawOffsetY = 0;
        }

        // Dropping animation
        if (p.dropping && p.targetY !== undefined) {
            const diff = p.targetY - p.y;
            if (Math.abs(diff) > 1) {
                p.y += diff * 0.08;
            } else {
                p.y = p.targetY;
                p.dropping = false;
            }
        }

        // Moving trap
        if (p.movingTrap) {
            if (p.targetX !== undefined) {
                const dx = p.targetX - p.x;
                if (Math.abs(dx) > 1) {
                    p.x += dx * 0.05;
                } else {
                    p.x = p.targetX;
                }
            }
            if (p.targetY !== undefined) {
                const dy = p.targetY - p.y;
                if (Math.abs(dy) > 1) {
                    p.y += dy * 0.05;
                } else {
                    p.y = p.targetY;
                }
            }
        }
    }
}

// Update door movement
function updateDoor(door) {
    if (!door || !door.moving) return;

    if (door.targetX !== undefined) {
        const dx = door.targetX - door.x;
        if (Math.abs(dx) > 1) {
            door.x += dx * 0.04;
        } else {
            door.x = door.targetX;
        }
    }
    if (door.targetY !== undefined) {
        const dy = door.targetY - door.y;
        if (Math.abs(dy) > 1) {
            door.y += dy * 0.04;
        } else {
            door.y = door.targetY;
        }
    }
}
