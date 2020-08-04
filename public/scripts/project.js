let new_uri = (window.location.protocol === "https:") ? "wss:" : "ws:";
new_uri += `//${window.location.host}${window.location.pathname.replace("/project/", "/project-ws/")}`
var Data = {};
var projectSocket;

function msg(message, data) {
    if (data === undefined || data === null) {
        data = undefined;
    };
    return JSON.stringify({ message: message, data: data });
}

function select_lang(lang) {
    projectSocket.current_lang = lang;
    $(".section").addClass('d-none');
    $("#loading").removeClass('d-none');
}

function main() {
    projectSocket = new WebSocket(new_uri);

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

        // First connection
        if (body.message = "connected") {
            Data.languages = body.data.languages;
            Data.project = body.data.project;
            $("#langs-btn").empty();
            for (let lang in Data.languages) {
                if (lang !== Data.project['origin-lang']) {
                    $("#langs-btn").append(`<button type="button" class="btn btn-secondary" onclick="select_lang('${lang}')">${Data.languages[lang]}</button>`)
                }
            }
            $(".section").addClass('d-none');
            $("#select-lang").removeClass('d-none');
        }
    })
}
