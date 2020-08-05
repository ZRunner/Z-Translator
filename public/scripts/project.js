let new_uri = (window.location.protocol === "https:") ? "wss:" : "ws:";
new_uri += `//${window.location.host}${window.location.pathname.replace("/project/", "/project-ws/")}`
var Data = {};

function msg(message, data) {
    if (data === undefined || data === null) {
        data = undefined;
    };
    return JSON.stringify({ message: message, data: data });
}

function isNullOrUndefined(arg) {
    return (arg === null || arg === undefined);
}

function display_section(id) {
    $(".section").addClass('d-none');
    $('#' + id).removeClass('d-none');
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

window.addEventListener('popstate', function (event) {
    // The URL changed...
    display_hash(window.location.hash)
});

function display_hash(hash) {
    // find translation object
    let obj = Data.translations.filter(e => e.key == hash.substring(1));
    if (obj.length === 0) return;
    obj = obj[0];
    if ($(`a.tr-string[href$="${hash}"]`).length == 0) return;
    // edit "selected" case
    $(`a.tr-string.selected`).removeClass("selected");
    $(`a.tr-string[href$="${hash}"]`).addClass("selected");
    // scroll to selected
    $('#tr-left').animate({
        scrollTop: $("a.tr-string.selected").position().top + $("#tr-left").scrollTop() - 20
    }, 800);
    // display translations
    $("#tr-origin-txt").text(obj.origin);
    $("#tr-translated-txt").text(obj.translation);
}


function main() {
    // display_section('tr-panel');
    // return;
    display_section('loading');
    Data.ws = new WebSocket(new_uri);

    function heartbeat() {
        if (!Data.ws) return;
        if (Data.ws.readyState !== 1) return;
        Data.ws.ping();
        setTimeout(heartbeat, 500);
    };
    heartbeat();

    Data.ws.addEventListener('open', ev => {
        console.log("WS: opened", ev);
    })

    Data.ws.addEventListener('close', ev => {
        console.warn("WS: closed by server:", ev);
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
            $("#tr-origin>h5>span").text(Data.languages[Data.project['origin-lang']]);
        } // starting translation for a language
        else if (body.message == "load-language") {
            let done = 0;
            // sort by done/not done
            body.data.translations.sort((a, b) => {
                un_a = isNullOrUndefined(a.translation);
                un_b = isNullOrUndefined(b.translation);
                if (un_a) {
                    if (un_b)
                        return 0;
                    return -1
                } if (un_b)
                    return 1;
            });
            Data.translations = body.data.translations;
            // delete precedent children
            $('#tr-left').find('*').not('#tr-left-sum').remove();
            // add new children
            body.data.translations.forEach(tr => {
                const v = !isNullOrUndefined(tr.translation);
                $('#tr-left').append(`<a class="tr-string ${v ? "valid" : ""}" href="#${tr.key}">${tr.origin}</a>`)
                if (v) done += 1;
            });
            // display % done
            const percent = Math.floor(done / body.data.translations.length * 100);
            $("#tr-left-sum").html(`<span>${Data.languages[body.data.language]}</span> <span>${percent}%</span>`)
            display_section('tr-panel');
            // display current language
            $("#tr-area>h5>span").text(Data.languages[body.data.language]);
            if (window.location.hash) display_hash(window.location.hash);
        }
        else {
            console.log("WS: unhandled message")
        }
    })
}
