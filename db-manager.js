const DB = require('better-sqlite3-helper');
const simpleGit = require('simple-git');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.db = DB({
            migrate: { force: 'last' }
        })
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
        let account = this.db.queryFirstRow('SELECT * FROM users WHERE email=?', email);
        if (!account) return null;
        console.debug(account);
        return account.password === password ? account : null;
    }

    get_user_by_id(id) {
        return this.db.queryFirstRow('SELECT * FROM users WHERE id=?', id)
    }

    get_owned_projects(userid) {
        return this.db.query('SELECT * FROM projects WHERE owner=?', userid)
    }

    get_local_projects(id) {
        if (id != null) {
            const project = this.db.queryFirstRow('SELECT * FROM projects WHERE id=?', id);
            if (!project) return;
            let rawdata = fs.readFileSync(project['git-path']+'/'+project['settings-path']);
            let jsondata = JSON.parse(rawdata);
            return new Map([...project, ...jsondata]);
        }
        const projects = this.db.query('SELECT * FROM projects');
        let results = new Array();
        for (const proj of projects) {
            let rawdata = fs.readFileSync(proj['git-path']+'/'+proj['settings-path']);
            let jsondata = JSON.parse(rawdata);
            results.push(new Map([...project, ...jsondata]));
        }
        return results;
    }

}

module.exports = {
    DatabaseManager: DatabaseManager
}