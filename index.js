const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const Knex = require('knex');
const simpleGit = require('simple-git');

const VERSION = require('./package.json').version;
const credentials = require('./credentials.json');

// add timestamps in front of log messages 
require('console-stamp')(console, {
    format: ':date(dd.mm HH:MM:ss.l) :label',
    level: "log",
    colors: {
        stamp: 'yellow',
        label: 'white'
    }
});

const app = express();

const PORT_USED = 3200;

const knex = Knex({
    client: 'mysql',
    connection: credentials["database-connection"],
});
const store = new KnexSessionStore({
    knex,
    tablename: 'z-translator', // optional. Defaults to 'sessions'
});

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
    req.session.test = "123"
    res.send(req.session.test);
})


app.listen(PORT_USED, function () {
    console.log(`Z-Translator V${VERSION} listening on port ${PORT_USED}!`);
})