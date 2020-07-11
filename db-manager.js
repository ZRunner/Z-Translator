const DB = require('better-sqlite3-helper');

class DatabaseManager {
    constructor() {
        this.db = DB()
    }

    close() {
        this.db.close();
    }

    reset_users() {
        const stmt = this.db.prepare('DELETE FROM users');
        return stmt.run();
    }

    new_user(data) {
        this.db.insert('users', data);
    }

}

module.exports = {
    DatabaseManager: DatabaseManager
}