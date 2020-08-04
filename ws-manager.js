const { DatabaseManager } = require('./db-manager');
const DBmanager = new DatabaseManager();
var expressWs;

function msg(message, code, data) {
    if (data === undefined || data === null) {
        data = undefined;
        code = 204;
    };
    if (code === undefined || code === null) code = 200;
    return JSON.stringify({ message: message, code: code, data: data });
}

function send_all(arg) {
    expressWs.getWss().clients.forEach(client => {
        client.send(arg);
    });
}

function init_ws(ws, req) {
    if (!req.session.account) {
        ws.send("Unauthenticated");
        ws.terminate();
        return;
    };
    if (!DBmanager.project_exists(req.params.id)) {
        ws.send("Invalid project");
        ws.terminate();
        return;
    };
    ws.projectid = req.params.id;
    ws.sessionid = req.session.id;
    console.debug(`WS: New connection to project ${ws.projectid} with session ${ws.sessionid}`);

    ws.on('error', function (err) {
        console.warn(`WS: Error for session ${ws.sessionid}:\n ${err}`);
    });

    ws.on('close', function (code, reason) {
        console.debug(`WS: closed because of ${reason} (${code})`);
    });

    ws.on('message', function (message) {
        let body;
        try {
            body = JSON.parse(message);
        } catch {
            console.warn("WS: not json message:", message);
            return;
        }
        console.log("WS: new message", body);

        // load a language for a user
        if (body.message == "load-language") {
            // tell to everyone that a new user went online
            send_all(msg("user_join", 200, {
                username: req.session.account.nickname,
                lang: body.data.language
            }));
            try {
                const lang_data = DBmanager.compare_translations(body.data.language, undefined, ws.projectid);
                ws.send(msg("load-language", 200, lang_data));
            } catch (err) {
                console.error(err);
                ws.close(1011, "Unable to get current translations");
                return;
            }
        } else {
            console.log("WS: unhandled message");
        }
    });

    ws.send(msg("connected", null, {
        "languages": Object.fromEntries(DBmanager.get_languages(ws.projectid).entries()),
        "project": DBmanager.get_projects({ id: ws.projectid })
    }));
}

function init(wsApp) {
    expressWs = wsApp;
}

module.exports = {
    init: init,
    init_ws: init_ws
}