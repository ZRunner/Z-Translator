let new_uri = (window.location.protocol === "https:") ? "wss:" : "ws:";
new_uri += `//${window.location.host}${window.location.pathname.replace("/project/", "/project-ws/")}`

function msg(message, data) {
    if (data === undefined || data === null) {
        data = undefined;
    };
    return JSON.stringify({ message: message, data: data });
}

function main() {
    var projectSocket = new WebSocket(new_uri);

    projectSocket.addEventListener('open', ev => {
        console.debug("WS: opened", ev);
    })

    projectSocket.addEventListener('message', ev => {
        try {
            var body = JSON.parse(ev.data);
        } catch {
            console.warn("WS: not json message:", ev.data);
            return;
        }
        console.debug("WS: new message", body);
    })
}
