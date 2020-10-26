console.log("indexjs")

function htmlDecode(input) {
    const e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

function closeSession(id) {
    console.log("hi");
    var xhr = new XMLHttpRequest();
    xhr.open("POST", `/closeSession/${id}`, true);
    xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log("close session success");
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

function createTimeOutPage () {
    const frame = document.getElementById('office_frame');
    const frameHolder = document.getElementById('frameholder');
    frame.parentNode.removeChild(frame);

    const div = document.getElementById('finishPage');
    div.style.display = "block";
    frameHolder.appendChild(div);
}

let stop = false;
let waitMessage;
const checkIdle = setInterval(() => {
    stop = false;
    idle = false;
    console.log("interval");
    if (isIdle(fileId)) {
        idle = true;
        console.log("enter isIdle");
        console.log("stop " +stop +" idle "+idle);
        let count =  5;
        document.getElementById("timer").innerText = `העמוד הולך להסגר בעוד ${count} שניות`      
        $('#warningModel').modal();
        const messageTimer = setInterval(() => {
            count --;
            document.getElementById("timer").innerText = `העמוד הולך להסגר בעוד ${count} שניות`      
        }, 1000);
        waitMessgae = setTimeout(() => {
            clearInterval(messageTimer);
            console.log("stop " +stop +" idle "+idle);
            if(!stop) {
                console.log("not stop");
                closeSession(fileId);
                clearInterval(checkIdle);
                $('#warningModel').modal('hide');
                // document.getElementById('office_frame').src = "data:text/html;charset=utf-8," + escape("timeout");
                createTimeOutPage();
                // document.getElementById('office_frame').innerHTML = document.getElementById("finishPage").innerHTML;
            } else { 
                console.log("stop");
                stop = false;
                console.log(updateLastUpdated(fileId));
            }
        }, 5000); 
    }
}, 10001);

window.onmousemove = () => {
    if (idle) {
        stop = true;
        $('#warningModel').modal('hide');
        // clearTimeout(waitMessgae);
    }
}
