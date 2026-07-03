const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

// Database setup
let dbPath = path.join(__dirname, 'leaderboard.db');
if (process.versions && process.versions.electron) {
    const { app } = require('electron');
    dbPath = path.join(app.getPath('userData'), 'leaderboard.db');
}
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Leaderboard table
        db.run(`CREATE TABLE IF NOT EXISTS hell_leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            tier INTEGER NOT NULL,
            time_ms INTEGER NOT NULL,
            deaths INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// ── Auth Routes ──────────────────────────────────────────

// POST /api/signup
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        db.run(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username.trim(), email.trim().toLowerCase(), hash],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(409).json({ error: 'Username or email already taken' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ success: true, username: username.trim() });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    db.get(
        'SELECT * FROM users WHERE username = ? COLLATE NOCASE',
        [username.trim()],
        async (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!row) return res.status(401).json({ error: 'Invalid username or password' });
            try {
                const match = await bcrypt.compare(password, row.password_hash);
                if (!match) return res.status(401).json({ error: 'Invalid username or password' });
                res.json({ success: true, username: row.username });
            } catch (err) {
                res.status(500).json({ error: 'Server error' });
            }
        }
    );
});

// ── Leaderboard Routes ────────────────────────────────────

// API endpoint to fetch leaderboard for a tier
app.get('/api/leaderboard/:tier', (req, res) => {
    const tier = req.params.tier;
    // Get top 10 fastest times. Tie-breaker is fewest deaths.
    const sql = `SELECT player_name, time_ms, deaths FROM hell_leaderboard 
                 WHERE tier = ? 
                 ORDER BY time_ms ASC, deaths ASC 
                 LIMIT 10`;
                 
    db.all(sql, [tier], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// API endpoint to submit a score
app.post('/api/leaderboard', (req, res) => {
    const { player_name, tier, time_ms, deaths } = req.body;
    
    if (player_name === undefined || tier === undefined || time_ms === undefined || deaths === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `INSERT INTO hell_leaderboard (player_name, tier, time_ms, deaths) VALUES (?, ?, ?, ?)`;
    db.run(sql, [player_name, tier, time_ms, deaths], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: this.lastID });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Access the game at http://localhost:${PORT}/index.html`);
});
