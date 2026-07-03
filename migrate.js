const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./leaderboard.db');

db.serialize(() => {
    db.run('DROP TABLE IF EXISTS users', (err) => {
        if (err) return console.error('Drop error:', err.message);
        console.log('Old users table dropped.');
    });

    db.run(
        `CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => {
            if (err) {
                console.error('Create error:', err.message);
            } else {
                console.log('users table recreated with email column. Database is ready.');
            }
            db.close();
        }
    );
});
