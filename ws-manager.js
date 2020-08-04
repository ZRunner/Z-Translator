const { DatabaseManager } = require('./db-manager');
const DBmanager = new DatabaseManager();

function msg(message, code, data) {
    if (data === undefined || data === null) {
        data = undefined;
        code = 204;
    };
    if (code === undefined || code === null) code = 200;
    return JSON.stringify({ message: message, code: code, data: data });
}

function init(ws, req) {
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

    ws.on('message', function (msg) {
        let body;
        try {
            body = JSON.parse(msg);
        } catch {
            console.warn("WS: not json message:", msg);
            return;
        }
        console.debug(body);
        // const a = expressWs.getWss().clients
        // a.forEach(instance => { instance.send(msg) })
    });

    ws.send(msg("connected", null, {
        "languages": Object.fromEntries(DBmanager.get_languages(ws.projectid).entries()),
        "project": DBmanager.get_projects({ id: ws.projectid })
    }));
}

module.exports = {
    init: init
}