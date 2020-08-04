let new_uri = (window.location.protocol === "https:") ? "wss:" : "ws:";
new_uri += `//${window.location.host}${window.location.pathname.replace("/project/", "/project-ws/")}`
var Data = {};

function msg(message, data) {
    if (data === undefined || data === null) {
        data = undefined;
    };
    return JSON.stringify({ message: message, data: data });
}

function display_section(id) {
    $(".section").addClass('d-none');
    $('#'+id).removeClass('d-none');
    if (id == "tr-panel")
        $('#mainzone').addClass('full');
    else
        $('#mainzone').removeClass('full');
}

function select_lang(lang) {
    Data.current_lang = lang;
    display_section('loading');
    Data.ws.send(msg("load-language", { "language": lang }))
}

function main() {
    display_section('loading');
    Data.ws = new WebSocket(new_uri);

    Data.ws.addEventListener('open', ev => {
        console.log("WS: opened", ev);
    })

    Data.ws.addEventListener('close', ev => {
        console.warn("WS: closed by server:",ev);
        display_section('closed');
    })

    Data.ws.addEventListener('message', ev => {
        try {
            var body = JSON.parse(ev.data);
        } catch {
            console.warn("WS: not json message:", ev.data);
            return;
        }
        console.log("WS: new message", body);

        // First connection
        if (body.message == "connected") {
            Data.languages = body.data.languages;
            Data.project = body.data.project;
            $("#langs-btn").empty();
            for (let lang in Data.languages) {
                if (lang !== Data.project['origin-lang']) {
                    $("#langs-btn").append(`<button type="button" class="btn btn-secondary" onclick="select_lang('${lang}')">${Data.languages[lang]}</button>`)
                }
            }
            display_section('select-lang');
        } else if (body.message == "load-language") {
            display_section('tr-panel');
        }
        else {
            console.log("WS: unhandled message")
        }
    })
}
