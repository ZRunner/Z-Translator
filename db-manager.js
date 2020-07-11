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
        return this.db.insert('users', data);
    }

    connect_user(email, password) {
        let account = DB().queryFirstRow('SELECT * FROM users WHERE email=?', email);
        if (!account) return null;
        console.debug(account);
        return account.password === password ? account : null;
    }

    get_user() {
        return null
    }

}

module.exports = {
    DatabaseManager: DatabaseManager
}