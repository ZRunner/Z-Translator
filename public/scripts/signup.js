function open_minecraft() {
    $('#loginModal').modal('show');
    $("#loginModalLabel").text("Login with Minecraft");
    $("#loginModal label[for='username']").text("Username/Email");
    $("#loginModal small#loginHelp").text("Old Minecraft accounts have to use email.");
}

function asubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    data = {
        username: document.getElementById("modal-username").value,
        password: document.getElementById("modal-password").value,
    }
    fetch('minecraft-signup', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res => {
        if (res.status == 200) return res.json();
        alert("Wrong username or password!");
        return null;
    }).then(data => {
        if (!data) return;
        $('#loginModal').modal('hide');
        ask_info(data);
    })
    return false;
}

function ask_info(data) {
    $('#completeModal').modal('show');
    $('#complete-name').val(data.username);
    if (data.email) {
        $('#complete-email').val(data.email);
    }
    if (data.avatar_url) {
        $('#complete-avatar').val(data.avatar_url);
    }
    if (data.minecraft_name) {
        $('#complete-mcname').val(data.minecraft_name);
        $('#complete-mcuuid').val(data.minecraft_uuid);
        $('#complete-mcform').removeAttr('hidden');
    }
    if (data.git_name) {
        $('#complete-github').val(data.git_name);
    }
}