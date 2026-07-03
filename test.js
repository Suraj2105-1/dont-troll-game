const fs = require('fs');

// We need to simulate the environment enough to load the files.
global.window = { innerWidth: 1366, innerHeight: 641 };
global.Trap = class Trap { constructor(opts) { Object.assign(this, opts); } };

// Read levels.js
let code = fs.readFileSync('levels.js', 'utf8');

// Evaluate levels.js in current context
eval(code);

let errors = [];

for (let i = 0; i < 200; i++) {
    const level = cloneLevel(i);
    
    // Check level width
    if (!level.width || level.width <= 0) {
        errors.push(`Level ${i}: Invalid width ${level.width}`);
    }

    // Check door
    if (!level.door) {
        errors.push(`Level ${i}: Missing door`);
    } else {
        if (level.door.x < 0 || level.door.x > level.width) {
            errors.push(`Level ${i}: Door out of bounds (${level.door.x} vs ${level.width})`);
        }
    }
    
    // Check door_move traps
    if (level.traps) {
        level.traps.forEach((t, tIndex) => {
            if (t.type === 'door_move') {
                const newX = t.data.newX;
                if (newX === undefined) {
                     errors.push(`Level ${i}: door_move trap missing newX`);
                } else if (newX < 0 || newX > level.width) {
                     errors.push(`Level ${i}: door_move trap newX out of bounds (${newX} vs ${level.width})`);
                }
            }
        });
    }
}

if (errors.length === 0) {
    console.log('ALL 200 LEVELS PASSED DOOR AND BOUNDS CHECKS!');
} else {
    console.log('ERRORS FOUND:\n' + errors.join('\n'));
}
