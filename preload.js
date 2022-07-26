// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
var Client = require('ftp');

var { Base64Encode } = require('base64-stream');

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
// form.on("submit", res => {
//   console.log({ res });
// })


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
    $("#ftp-viewer").html(viewHtml);

    if (path != "/") {
      console.log({ path })
      var prevRouteFile = {
        name: "..",
        type: "d"
      }
      $("#ftp-viewer").prepend(fileDiv(prevRouteFile, ""));
    }

    loadPreviews().then(() => {
      addEventHandlers();
    });
  })
}

function addEventHandlers() {
  //div click event
  $("#ftp-viewer div").on("click", e => {
    const div = e.currentTarget;
    const type = $(div).data("type");
    const path = $(div).data("path") + "/";
    if (type === "d")
      viewDirectory(path);

  })
}
async function loadPreviews() {
  let previewElements = $("#ftp-viewer").find("img[data-preview=true][data-loaded=false]").get();
  let result = [];
  console.log({ previewElements });
  getFile(previewElements, 0)
  // for await (const r of previewElements.map(v => )) {
  //   result.push(r);
  //   console.log({ r, time: Date.now() })
  // }
  return Promise.resolve(result);
}
function getFile(list, index) {
  const element = list[index];

  // if(!c.connected)
  //   c.connect();
  if (!element) {
    console.error('element required');
    return;
  }
  let filePath = element.getAttribute('data-file');
  c.get(filePath, (error, fileStream) => {
    if (error) throw error;
    var buffer = [];
    console.info(`preview file ${filePath}`)

    fileStream.on('data', (chunks) => { buffer.push(chunks) });
    fileStream.on('end', function () {
      var imageBuffer = Buffer.concat(buffer);
      element.setAttribute("src", `data:image/png;base64,${imageBuffer.toString('base64')}`);
      element.setAttribute('data-loaded', 'true');
      //do your stuff here with base64data wich contains string encoded in base64 format.....
      if (list.length > index + 1)
        getFile(list, index + 1);
    });
  })
}
function fileDiv(file, path) {
  let imgPath = "./assets/img/folder-icon.png";
  if (file.type != "d")
    imgPath = './assets/img/file-icon.png';

  let isImage = false;
  if (hasExtension(file.name, ["jpeg", "jpg", "png"])) {
    isImage = true;
  }
  let html = `<div data-path='${path + file.name}' data-type='${file.type}'  class='col-md-2'><img data-preview='${isImage}' data-loaded='false' data-file='${path + file.name}' src='${imgPath}'/>${file.name}</div>`;
  return html;
}

function showElement(elementId) {
  const ele = document.getElementById(elementId);
  if (ele)
    ele.style.display = '';
}

function hasExtension(fileName, exts) {
  return (new RegExp('(' + exts.join('|').replace(/\./g, '\\.') + ')$')).test(fileName);
}

function hideElement(elementId) {
  const ele = document.getElementById(elementId);
  if (ele)
    ele.style.display = 'none';
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
