const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const Knex = require('knex');
const simpleGit = require('simple-git');
const got = require('got');

const VERSION = require('./package.json').version;
const credentials = require('./credentials.json');
const DatabaseManager = require('./db-manager').DatabaseManager;

const PORT_USED = 3200;

const app = express();

// add timestamps in front of log messages 
require('console-stamp')(console, {
    format: ':date(dd.mm HH:MM:ss.l) :label',
    level: "log",
    colors: {
        stamp: 'yellow',
        label: 'white'
    }
});


// databases

// const DBaccounts = new Database('database/accounts.db', { verbose: console.log });
const DBmanager = new DatabaseManager();
process.on('exit', () => DBmanager.close());

const knex = Knex({
    client: 'mysql',
    connection: credentials["database-connection"],
});
const store = new KnexSessionStore({
    knex,
    tablename: 'ztranslator', // optional. Defaults to 'sessions'
});

// express settings

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'cdLYtgEAPk5BjKGyjuog',
    resave: false,
    saveUninitialized: false,
    store: store
}))
app.set('view engine', 'ejs')



app.get("/", function (req, res) {
    res.render("index", { account: req.session.account, level: 0 })
})

app.get("/signup", function (req, res) {
    res.render("signup", { account: null, github_client: credentials["github-client-id"], callback_github: null, callback_discord: null, level: 0 });
})

app.post("/signup", function (req, res) {
    if (!req.body.nickname || !req.body.password || !req.body.email) {
        res.status(422).send();
        return;
    }
    Object.keys(req.body).forEach(function (key) {
        if (!req.body[key]) {
            req.body[key] = null;
        }
    })
    const lastInsertID = DBmanager.new_user({
        nickname: req.body.nickname,
        password: req.body.password,
        email: req.body.email,
        'avatar-url': req.body.avatar,
        'minecraft-name': req.body["mc-username"],
        'minecraft-uuid': req.body["mc-uuid"],
        'discord-id': req.body["discord-id"],
        'github-name': req.body["github-name"]
    })
    console.log(`New user created - index ${lastInsertID}`);
    req.session.account = DBmanager.get_user_by_id(lastInsertID);
    res.redirect('.');
})

app.get("/signin", function (req, res) {
    if (req.session.account) {
        res.redirect("user/" + req.session.account.id);
        return;
    }
    res.render("signin", { account: null, tried: false, level: 0 });
})

app.post("/signin", function (req, res) {
    if (req.session.account) {
        res.status(403).send();
        return;
    }
    if (!req.body.email || !req.body.password) {
        res.status(422).send();
        return;
    }
    let acc = DBmanager.connect_user(req.body.email, req.body.password);
    if (acc) {
        console.log(`New connection - user ${acc.id}`);
        req.session.account = acc;
        res.redirect('.');
    } else {
        res.render("signin", { account: null, tried: true, level: 0 });
    }
})

app.get("/logout", function (req, res) {
    if (req.session.account) console.log(`Logout - user ${req.session.account.id}`);
    req.session.account = null;
    res.redirect(".")
})

app.get("/dashboard", function (req, res) {
    if (!req.session.account) {
        res.redirect("signin");
        return;
    }
    const projects = DBmanager.get_projects({ owner: req.session.account.id });
    res.render("dashboard", { account: req.session.account, owned: projects, joined: [], level: 0 })
})

app.get("/project-creation", function (req, res) {
    if (!req.session.account) {
        res.redirect("signin");
        return;
    }
    if (req.session.account['github-name']) {
        got(`https://api.github.com/users/${req.session.account['github-name']}/repos`, { responseType: 'json' })
            .then(answer => {
                let repos = new Array;
                for (const elem of answer.body) {
                    repos.push({
                        name: elem.name,
                        id: elem.id
                    })
                }
                res.render("project-creation", { account: req.session.account, repos: repos, level: 0 })
            })
    } else {
        res.render("project-creation", { account: req.session.account, repos: [], level: 0 })
    }
})

app.get("/edit-project/:id", function (req, res) {
    if (!req.session.account) {
        res.redirect("/signin");
        return;
    }
    const project = DBmanager.get_projects({ owner: req.session.account.id, id: req.params.id });
    res.render("project-edition", { account: req.session.account, project: project, level: 1 })
})




// ----- API PART ----- //

app.post("/minecraft-signup", function (req, res) {
    if (!req.body.username || !req.body.password) {
        res.status(422).send();
        return;
    }
    const mc_url = "https://authserver.mojang.com/authenticate";
    got.post(mc_url, {
        json: {
            agent: { name: "Minecraft", version: 1 },
            username: req.body.username,
            password: req.body.password,
            requestUser: true
        },
        responseType: 'json'
    }).then(answer => {
        const profile = answer.body.selectedProfile;
        console.log(`Minecraft Authentification success - user ${profile.name}`);
        const possible_email = answer.body.user.username;
        res.status(200).json({
            username: profile.name,
            email: possible_email.indexOf("@") > 0 ? possible_email : null,
            minecraft_uuid: profile.id,
            minecraft_name: profile.name
        })
    }).catch(err => {
        console.warn(`Minecraft Authentification failure - ${err}`);
        res.status(500).send(`${err}`)
    })
})

app.post("/github-callback", function (req, res) {
    if (!req.query.code) {
        res.status(422).send();
        return;
    }
    got.post("https://github.com/login/oauth/access_token", {
        json: {
            "client_id": credentials["github-client-id"],
            "client_secret": credentials["github-client-secret"],
            "code": req.query.code,
            "accept": "json"
        },
        responseType: 'json'
    }).then(answer => {
        const auth = answer.body.access_token;
        console.debug(answer);
        const scopes = answer.body.scopes.split(',');
        if (!scopes.includes('read:user')) {
            res.status(202).send();
            return;
        }
        got("https://api.github.com/user", {
            headers: { token: auth }
        }).then(answer => {
            console.debug(answer);
            console.log(`GitHub Authentification success - user ${null}`);
            res.status(202).send();
        })
    }).catch(err => {
        console.warn(`GitHub Authentification failure - ${err}`);
    })
})

app.get('/gitrepo/:id', function (req, res) {
    if (!req.session.account) {
        res.status(401).send();
        return;
    }
    if (!req.session.account['github-name']) {
        res.status(403).send("No GitHub account linked to the current account");
        return;
    }
    console.log(`GitHub repo info asked - ${req.session.account['github-name']}/${req.params.id}`);
    got(`https://api.github.com/repos/${req.session.account['github-name']}/${req.params.id}`, { responseType: 'json' })
        .then(answer => {
            answer = answer.body;
            res.json({
                name: answer.name,
                description: answer.description,
                url: answer.html_url,
                owner_name: answer.owner.login,
                owner_id: answer.owner.id
            })
        }).catch(err => {
            console.error(err);
            res.status(500).send();
        });
})

app.post("/project-creation", function (req, res) {
    if (!req.session.account) {
        res.redirect("signin");
        return;
    };
    if (!req.body.name || !req.body.desc || !req.body.settings || !req.body.url) {
        res.status(422).send("Missing parameter(s)");
        return;
    };
    console.log(`New project created - user ${req.session.account.id} - ${req.body.url}`);
    req.body.settings = req.body.settings;
    const projectid = DBmanager.create_project({
        'name': req.body.name,
        'description': req.body.desc,
        'owner': req.session.account.id,
        'git-url': req.body.url,
        'settings-path': req.body.settings
    })
    res.json({ 'project-id': projectid })
})

app.post("/edit-project/:id", function (req, res) {
    if (!req.session.account) {
        res.status(401).send();
        return;
    };
    if (isNaN(req.params.id)) {
        res.status(404).send("Project not found");
        return;
    }
    if (!req.body.name || !req.body.desc || !req.body.settings) {
        res.status(422).send("Missing parameter(s)");
        return;
    };
    console.log(`Project edition - project ${req.params.id}`);
    const data = {
        name: req.body.name,
        description: req.body.desc,
        'settings-path': req.body.settings
    };

    DBmanager.edit_project(req.params.id, data);
    res.status(200).send();
})


app.listen(PORT_USED, function () {
    console.log(`Z-Translator V${VERSION} listening on port ${PORT_USED}!`);
})