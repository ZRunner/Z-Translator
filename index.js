const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const Knex = require('knex');
const simpleGit = require('simple-git');

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
    res.render("signup", { account: null, level: 0 });
})

app.post("/signup", function (req, res) {
    if (!req.body.nickname || !req.body.password || !req.body.email) {
        res.status(422).send();
        return;
    }
    const lastInsertID = DBmanager.new_user({
        nickname: req.body.nickname,
        password: req.body.password,
        email: req.body.email,
        'discord-id': req.body.discordid
    })
    console.log(`New user created - index ${lastInsertID}`);
    res.redirect('.');
})

app.get("/signin", function (req, res) {
    res.render("signin", { account: null, tried: false, level: 0 });
})

app.post("/signin", function (req, res) {
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



app.listen(PORT_USED, function () {
    console.log(`Z-Translator V${VERSION} listening on port ${PORT_USED}!`);
})