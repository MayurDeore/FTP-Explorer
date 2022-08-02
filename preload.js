// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
// import { FILE_TYPE_EXTENSION, FILE_TYPE } from './enum/FileType';

var Client = require('ftp');
var mammoth = require("mammoth");
var { FILE_TYPE, FILE_TYPE_EXTENSION } = require('./enum/FileType');

var c = new Client();
c.on('ready', () => {
  showConnected();
})

c.on("close", () => {
  console.log("connection closed")
})

c.on("end", () => {
  console.log("connection ended")
})
c.on("error", err => {
  console.log("connection err");
  console.error(err);
})


function connectFtp(host, port, user, password) {
  let config = {
    host: host,// "192.168.0.101",
    port: port,// 2221,
    user: user,// "android",
    password: password//"1234"
  }

  c.connect(config);
}

function getStatusOfFtp() {
  debugger
  if (!c.connected) {
    showDisconnected();
    return;
  }
  c.status((err, status) => {
    console.log({ err, status })
  })
}

function disconnectFtp() {
  if (!c.connected) {
    showDisconnected();
    return;
  }
  c.end();
}
function showDisconnected() {
  console.log("Connection already disconnected");
}

function showConnected() {
  console.log('connected');
  viewDirectory()
}

function viewDirectory(path) {
  if (!path || path === "../")
    path = "/";
  c.list(path, false, (err, list) => {
    if (err) throw err;
    console.dir(list);
    let viewHtml = list.reduce((prevVal, curVal) => {
      return prevVal + fileDiv(curVal, path);
    }, "");
    $("#ftp-viewer ul").html(viewHtml);

    if (path != "/") {
      var prevRouteFile = {
        name: "..",
        type: "d"
      }
      $("#ftp-viewer ul").prepend(fileDiv(prevRouteFile, ""));
    }
    addEventHandlers();
  })
}

function addEventHandlers() {
  $("#ftp-viewer li").on("click", e => {
    const div = e.currentTarget;
    const type = $(div).data("type");
    const path = $(div).data("path") + "/";
    if (type === "d")
      viewDirectory(path);
    else
      getFile(div);
  })
}

function getFile(element) {

  if (!element) {
    console.error('element required');
    return;
  }
  let filePath = element.getAttribute('data-path');
  let fileType = element.getAttribute('data-file-type');
  $("#imagePreview").html("<center><img src='./assets/img/loader.gif'></img></center>")
  c.get(filePath, (error, fileStream) => {
    if (error) throw error;
    var buffer = [];
    fileStream.on('data', (chunks) => { buffer.push(chunks) });
    fileStream.on('end', function () {
      $("#imagePreview").html('');
      var imageBuffer = Buffer.concat(buffer);
      if (fileType == FILE_TYPE.IMAGE) {
        let imageSrc = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        $("#imagePreview").html(`<img src='${imageSrc}' />`);
        return;
      }
      if (fileType == FILE_TYPE.PDF) {
        const blob = base64ToBlob(imageBuffer.toString('base64'), 'application/pdf');
        const url = URL.createObjectURL(blob);
        $("#imagePreview").append('<iframe width="95%" height="95%"></iframe>')
        $("#imagePreview iframe").attr("src", url);
        return;
      }
      if (fileType == FILE_TYPE.DOC) {
        mammoth.convertToHtml({ buffer: imageBuffer })
          .then(res => {
            var html = res.value;
            $("#imagePreview").html(html);
          })

        return;
      }
      $("#imagePreview").html("No preview");

    });
  })
}

function base64ToBlob(base64, type = "application/octet-stream") {
  const binStr = atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new Blob([arr], { type: type });
}

function fileDiv(file, path) {
  let isDirectory = file.type != "d";
  let fileType = getFileType(file.name);
  let icon = "folder";
  if (isDirectory)
    icon = file.name.substr(file.name.lastIndexOf('.') + 1);
  let html = `<li class='dir-list' data-path='${path + file.name}' 
  data-type='${file.type}' data-file-type='${fileType}'>
  <img onerror="this.onerror=null;this.src='./assets/img/default.svg';" 
  src='./assets/img/${icon}.svg'></img>&nbsp;${file.name} ${isDirectory ? `<i>${formatBytes(file.size)}</i>` : ""}</li>`;
  return html;
}

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  );
}

function getFileType(fileName) {
  if (hasExtension(fileName, FILE_TYPE_EXTENSION.IMAGE)) {
    return FILE_TYPE.IMAGE;
  }
  if (hasExtension(fileName, FILE_TYPE_EXTENSION.VIDEO)) {
    return FILE_TYPE.VIDEO;
  }
  if (hasExtension(fileName, FILE_TYPE_EXTENSION.PDF)) {
    return FILE_TYPE.PDF;
  }
  if (hasExtension(fileName, FILE_TYPE_EXTENSION.DOC)) {
    return FILE_TYPE.DOC;
  }
  return FILE_TYPE.OTHER;
}
function hasExtension(fileName, exts) {
  return (new RegExp('(' + exts.join('|').replace(/\./g, '\\.') + ')$')).test(fileName.toLowerCase());
}

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("frm_ftpconnect");
  const btnStatus = document.getElementById("btn_status");
  const btnDisconnect = document.getElementById("btn_disconnect");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    connectFtp(data.host, data.port, data.user, data.pass);

  })

  btnStatus.addEventListener("click", e => {
    getStatusOfFtp();
  })

  btnDisconnect.addEventListener("click", e => {
    disconnectFtp();
  })
})

document.oncontextmenu = (e) => {
  var ele = e.target;
  if (ele.className == "dir-list") {
    e.preventDefault();
    $(ele).toggleClass('active').siblings().removeClass('active');
    $("#ctxmenu").remove();
    let menu = document.createElement("div")
    let scrollTop = $(window).scrollTop();
    menu.id = "ctxmenu";
    menu.setAttribute("data-path", ele.getAttribute("data-path"));
    menu.setAttribute("data-file-type", ele.getAttribute("data-file-type"));
    menu.style = `top:${(Math.abs(scrollTop - e.pageY)) - 10}px;left:${e.pageX - 40}px`
    // menu.onmouseleave = () => menu.outerHTML = ''
    let options = "<a class='action-download'>Download</a>";
    if (ele.getAttribute("data-type") == "d") {
      options = "<a class='action-open'>Open</a>";
    }
    menu.innerHTML = options;
    document.body.appendChild(menu)
  }
}

document.onclick = (e) => {
  let ele = e.target;
  if (ele.className.startsWith("action")) {
    e.preventDefault();
    let path = ele.parentElement.getAttribute("data-path");
    switch (ele.className) {
      case "action-open":
        viewDirectory(path);
        return;
      case "action-download":
    }
  }

}