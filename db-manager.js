const DB = require('better-sqlite3-helper');
const simpleGit = require('simple-git');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.repositories_path = "./repositories";
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

    get_projects({ id = null, owner = null }) {
        if (id != null) {
            let project = null;
            if (owner === null)
                project = this.db.queryFirstRow('SELECT * FROM projects WHERE id=?', id);
            else
                project = this.db.queryFirstRow('SELECT * FROM projects WHERE id=? AND owner=?', id, owner);
            if (!project) return;
            if (!project['settings-path']) return project;
            project['settings-path'] = project['settings-path'].replace(/^\.\//, '');
            let jsondata = { valid: true };
            try {
                let rawdata = fs.readFileSync(this.repositories_path + '/' + project['git-path'] + '/' + project['settings-path']);
                jsondata = { ...jsondata, ...JSON.parse(rawdata) };
            } catch (err) {
                if (err.code !== 'ENOENT') console.error(err.code, err);
                jsondata.valid = false;
            }
            return { ...project, ...jsondata }
        }
        let projects = []
        if (owner === null)
            projects = this.db.query('SELECT * FROM projects');
        else
            projects = this.db.query('SELECT * FROM projects WHERE owner=?', owner);
        let results = new Array();
        for (const proj of projects) {
            if (!proj['settings-path']) {
                results.push(proj);
                break;
            }
            let jsondata = { valid: true };;
            try {
                let rawdata = fs.readFileSync(this.repositories_path + '/' + proj['git-path'] + '/' + proj['settings-path']);
                jsondata = { ...jsondata, ...JSON.parse(rawdata) };
            } catch (err) {
                if (err.code !== 'ENOENT') console.error(err.code, err);
                jsondata.valid = false;
            }
            results.push({ ...proj, ...jsondata });
        }
        return results;
    }

    create_project(data) {
        let path = null;
        if (data["git-path"])
            path = data["git-path"];
        else
            data["git-path"] = "pending";
        try {
            var res = this.db.insert('projects', data);
        } catch (err) {
            if (err.code == 'SQLITE_CONSTRAINT_UNIQUE') return;
            console.error(err);
            return;
        }
        if (!path) {
            path = "project-" + res;
            this.db.update('projects', { 'git-path': path }, { id: res });
        }
        const git = simpleGit('./repositories');
        git.clone(data['git-url'], path);
        return res
    }

    edit_project(id, data) {
        return this.db.update('projects', data, { id: id });
    }

}

module.exports = {
    DatabaseManager: DatabaseManager
}