
function closeSession(id) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", `/closeSession/${id}`, true);
    xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        }
    }
    xhr.send();
}

function isIdle(id) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", `/isIdle/${id}`, false);
    xmlHttp.send();
    return xmlHttp.responseText == "true";
}

function updateLastUpdated(id) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", `/update/${id}`, false);
    xmlHttp.send();
    return xmlHttp.responseText;
}

function createTimeOutPage() {
    const frame = document.getElementById('office_frame');
    const frameHolder = document.getElementById('frameholder');
    frame.parentNode.removeChild(frame);
    const div = document.getElementById('finishPage');
    div.style.display = "block";
    frameHolder.appendChild(div);
    document.body.style.backgroundColor = "#4fbe9f";
}

let stop = false, idle = false;
let waitMessage, messageTimer;

const checkIdle = setInterval(() => {
    stop = false;
    idle = false;
    if (isIdle(fileId)) {
        idle = true;
        let countTimer = timer;
        $('#warningModel').modal();
        document.getElementById("second").innerText = countTimer;
        const messageTimer = setInterval(() => {
            if (stop) {
                clearInterval(messageTimer);
            }
            countTimer--;
            document.getElementById("second").innerText = countTimer;
        }, second);
        waitMessgae = setTimeout(() => {
            if (!stop) {
                closeSession(fileId);
                clearInterval(checkIdle);
                $('#warningModel').modal('hide');
                idle = false;
                stop = true;
                createTimeOutPage();
            } else {
                stop = false;
                updateLastUpdated(fileId);
            }
        }, timer * second);
    }
}, intervalTime * second);

window.onmousemove = () => {
    if (idle) {
        stop = true;
        $('#warningModel').modal('hide');
    }
}
