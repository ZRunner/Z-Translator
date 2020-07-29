function selected(event) {
    event.preventDefault();
    const repoid = document.getElementById("repoFormSelect").value;
    event.target.disabled = true;
    $("#repoFormSelect").prop("disabled", true);
    // get more info about git repo
    fetch("gitrepo/" + repoid).then(response => {
        var contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json().then(function (json) {
                $('#name').val(json.name);
                $('#desc').val(json.description);
                $('#url').val(json.url);
                $('#selectModal').modal('hide');
            });
        } else {
            console.error("Oops, nous n'avons pas du JSON!");
        }
    });
}

function sendform(event) {
    event.preventDefault();
    document.getElementById("loading-mask").hidden = false;
    data = {
        name: event.target[0].value,
        desc: event.target[1].value,
        public: event.target[2].checked,
        settings: event.target[3].value,
        languages: event.target[4].value,
        icon: event.target[5].value,
        url: event.target[6].value
    }
    fetch('project-creation', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res => {
        if (res.status == 200) return res.json();
        alert("Oops! Something went wrong :/");
        return null;
    }).then(data => {
        if (!data) return;
        // document.getElementById("loading-mask").hidden = true;
        window.location.href = "project/"+data['project-id'];
    })
}

function main() {
    $('#selectModal').modal({ backdrop: 'static', keyboard: false });
    $('#name').val('');
    $('#desc').val('');
    $('#url').val('');
    $('#git-id').val(0);
}