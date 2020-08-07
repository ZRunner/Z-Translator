const { DatabaseManager } = require('./db-manager');
const DBmanager = new DatabaseManager();
var expressWs;

/*
EVENTS CODES:
  600 Nothing special
  601 user-join (server -> client)
  602 load-language (server -> client)
  603 load-language (client -> server)
  604 new-translation (server -> client)
  605 new-translation (client -> server)
  606 user-left (server -> client)
  607 connected (server -> client)
*/

function msg(message, code, data) {
    if (data === undefined || data === null) {
        data = undefined;
        code = 204;
    };
    if (code === undefined || code === null) code = 600;
    return JSON.stringify({ message: message, code: code, data: data });
}

function send_all(message, check) {
    let clients = Array.from(expressWs.getWss().clients);
    if (clients.length == 0) return;
    try {
        if (check) clients = clients.filter(check);
    } catch (err) {
        console.error(err);
        return;
    }
    clients.forEach(client => {
        client.send(message);
    });
}

function init_ws(ws, req) {
    if (!req.session.account) {
        ws.close(4000, "Unauthenticated");
        return;
    };
    if (!DBmanager.project_exists(req.params.id)) {
        ws.close(4004, "Invalid project");
        return;
    };
    ws.projectid = req.params.id;
    ws.sessionid = req.session.id;
    ws.language = null;
    console.log(`WS: New connection to project ${ws.projectid} with session ${ws.sessionid}`);

    ws.on('error', function (err) {
        console.warn(`WS: Error for session ${ws.sessionid}:\n ${err}`);
    });

    ws.on('close', function (code, reason) {
        console.log(`WS: closed because of ${reason} (${code})`);
        send_all(msg("user-left", 606, {
            username: req.session.account.nickname,
            lang: ws.language
        }))
    });

    ws.on('message', function (message) {
        if (message == "heartbeat") {
            ws.send("heartbeat back");
            return
        }
        let body;
        try {
            body = JSON.parse(message);
        } catch {
            console.warn("WS: not json message:", message);
            return;
        }
        console.log("WS: new message", body);

        // load a language for a user
        if (body.code == 603) {
            // tell to everyone that a new user went online
            send_all(msg("user-join", 601, {
                username: req.session.account.nickname,
                lang: body.data.language
            }));
            ws.language = body.data.language;
            try {
                const lang_data = DBmanager.compare_translations(body.data.language, undefined, ws.projectid);
                ws.send(msg("load-language", 602, { translations: lang_data, language: body.data.language }));
            } catch (err) {
                console.error(err);
                ws.close(1011, "Unable to get current translations");
                return;
            }
        } else if (body.code == 605) {
            try {
                DBmanager.add_historic(ws.projectid, ws.language, req.session.account.id, body.data.key, body.data.value);
                DBmanager.replace_translation(ws.language, ws.projectid, body.data.key, body.data.value);
            } catch (err) {
                console.error(err);
                return;
            }
            // tell to everyone that a new translation has been added
            send_all(msg("new-translation", 604, {
                key: body.data.key,
                value: body.data.value
            }), c => c.projectid == ws.projectid && c.language == body.data.lang);
        } else {
            console.log("WS: unhandled message");
        }
    });

    ws.send(msg("connected", 607, {
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