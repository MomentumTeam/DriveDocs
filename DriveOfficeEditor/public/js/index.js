console.log("indexjs")

function closeSession(id) {
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

let stop = false, idle = false;
let waitMessage, messageTimer;
console.log("timer " + timer + " "+ typeof timer);
console.log("second " + second + " "+ typeof second);
console.log("intervalTime " +intervalTime + " "+ typeof intervalTime);


const checkIdle = setInterval(() => {
    stop = false;
    idle = false;
    console.log("interval");
    if (isIdle(fileId)) {
        idle = true;
        console.log("enter isIdle");
        console.log("stop " +stop +" idle "+idle);
        let countTimer = timer;
        $('#warningModel').modal();
        document.getElementById("second").innerText = countTimer;
        console.log(countTimer);
        const messageTimer = setInterval(() => {
            console.log(countTimer);
            console.log("timer");
            if (stop) {
                clearInterval(messageTimer);
            }
            countTimer --;
            document.getElementById("second").innerText = countTimer;     
        }, second);
        waitMessgae = setTimeout(() => {
            console.log("stop " +stop +" idle "+idle);
            if(!stop) {
                console.log("not stop");
                closeSession(fileId);
                clearInterval(checkIdle);
                $('#warningModel').modal('hide');
                idle = false;
                stop = true;
                createTimeOutPage();
            } else { 
                console.log("stop")
                stop = false;
                updateLastUpdated(fileId);
            }
        }, timer*second); 
    }
}, intervalTime * second);

window.onmousemove = () => {
    if (idle) {
        stop = true;
        $('#warningModel').modal('hide');
    }
}
