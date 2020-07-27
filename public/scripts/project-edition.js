function edit(event) {
    event.preventDefault();
    const elem = event.target;
    const cancellation = elem.textContent == "Cancel";
    elem.textContent = cancellation ? "Edit settings" : "Cancel";
    document.getElementById("save-s-btn").hidden = cancellation;
    $('#local_settings input[type=text]').prop('readonly', cancellation)
}

function update(event) {
    event.preventDefault();
    document.getElementById("edit-s-btn").disabled = true;
    document.getElementById("save-s-btn").disabled = true;
    $('#local_settings input[type=text]').prop('readonly', true)
    $('#local_settings input[type=text]').addClass('loading')
    senddata(event.target);
}

function senddata(form) {
    console.debug(form);
    const data = {
        name: form[0].value,
        desc: form[1].value,
        settings: form[2].value
    }
    let id = window.location.pathname.split('/');
    id = id[id.length - 1];
    fetch(id, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res => {
        if (res.status == 200) {
            window.location.reload();
            return;
        };
        alert("Oops! Something went wrong :/");
        return null;
    })
}