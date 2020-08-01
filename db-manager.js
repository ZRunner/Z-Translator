const DB = require('better-sqlite3-helper');
const simpleGit = require('simple-git');
const fs = require('fs');
const { isNullOrUndefined } = require('util');

class DatabaseManager {
    constructor() {
        this.repositories_path = "./repositories";
        this.db = DB({
            migrate: { force: 'last' }
        });
        this.languages = JSON.parse(fs.readFileSync('languages.json'));
        this.languages = new Map(Object.entries(this.languages));
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

    get_projects({ id = null, owner = null, fields = [] }) {
        if (fields.length == 0) var select = "SELECT *"
        else var select = "SELECT `" + fields.join("`, `") + "`";
        if (id != null) {
            let project = null;
            if (owner === null)
                project = this.db.queryFirstRow(select + ' FROM projects WHERE id=?', id);
            else
                project = this.db.queryFirstRow(select + ' FROM projects WHERE id=? AND owner=?', id, owner);
            if (!project) return;
            if (fields.length == 0 || fields.includes("files-path"))
                project['files-path'] = project['files-path'].replace(/^\.\//, '').replace(/\/$/, '') + '/';
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
            projects = this.db.query(select + ' FROM projects');
        else
            projects = this.db.query(select + ' FROM projects WHERE owner=?', owner);
        let results = new Array();
        for (const proj of projects) {
            if (fields.length == 0 || fields.includes("files-path"))
                proj['files-path'] = proj['files-path'].replace(/^\.\//, '').replace(/\/$/, '') + '/';
            if (!proj['settings-path']) {
                results.push(proj);
                break;
            }
            proj['settings-path'] = proj['settings-path'].replace(/^\.\//, '');
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
        const git = simpleGit(this.repositories_path);
        git.clone(data['git-url'], path);
        return res
    }

    edit_project(id, data) {
        return this.db.update('projects', data, { id: id });
    }

    get_languageFiles(projectid, language) {
        if (isNullOrUndefined(projectid)) return;
        const projectdata = this.get_projects({ id: projectid, fields: ['git-path', 'files-path'] });
        if (projectdata === undefined) return;
        const path = this.repositories_path + "/" + projectdata['git-path'] + "/" + projectdata['files-path'];
        let available_lang = language ? [language] : Array.from(this.languages.keys());
        available_lang = Array.from(available_lang, e => e.toLowerCase());
        const t = fs.readdirSync(path);
        const files = t.filter(e => available_lang.includes(e.replace(/\.lang$/, "")));
        return Array.from(files, f => path + f);
    }

    parse_langFile(path) {
        let data = Array.from(fs.readFileSync(path, 'utf-8').split("\n"), e => Array.from(e.split("=", 2), x => x.trim()));
        data = data.filter(e => (e.length == 2) && (e[0][0] !== "#") && (e[0].length > 0));
        return new Map(data);
    }

    compare_translations(translation, origin, projectid) {
        if (isNullOrUndefined(origin)) {
            if (isNullOrUndefined(projectid)) return;
            const projectdata = this.get_projects({ id: projectid, fields: ['origin-lang']});
            const originlang = projectdata['origin-lang'];
            const languages = this.get_languageFiles(projectid, originlang)
            if (!languages || languages.length == 0) return;
            origin = this.parse_langFile(languages[0]);
        }
        if (typeof(translation) == "string") {
            const languages = this.get_languageFiles(projectid, translation)
            if (!languages) return;
            translation = this.parse_langFile(languages[0]);
        }
        return Array.from(origin.keys(), key => {
            return {
                key: key,
                origin: origin.get(key),
                translation: translation.get(key)
            }
        })
    }

}

module.exports = {
    DatabaseManager: DatabaseManager
}