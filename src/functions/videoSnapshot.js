// #### VIDEO SNAPSHOT #####
// 1. init video & Canvas
// 2. draw frame from video on the canvas
// 3. Convert the frame to an img(Base64) and store it
// 4. Style the img
// 5. Add it to the DOM
// 6. Clear the canvas

export default function videoSnapshot() {
  function initVideoSnapshot() {
    video = document.querySelector('video');
    canvas = document.getElementById('snapshot-canvas');
    context = canvas.getContext('2d');
    video.addEventListener('loadedmetadata', setCanvasDimensions, false);
  }

  function setCanvasDimensions() {
    const ratio = video.videoWidth / video.videoHeight;
    w = video.videoWidth - 100;
    h = parseInt(w / ratio, 10);
    canvas.width = w;
    canvas.height = h;
  }

  function takeSnapShot() {
    drawVideoFrame();
    const snapshot = getVideoFrameFromCanvas();
    styleSnapshot(snapshot);
    addSnapshotToDOM(snapshot);
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawVideoFrame() {
    context.fillRect(0, 0, w, h);
    context.drawImage(video, 0, 0, w, h);
  }

  function getVideoFrameFromCanvas() {
    const image = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    const snapshot = new Image();
    snapshot.src = image;
    return snapshot;
  }

  function styleSnapshot(snapshot) {
    snapshot.style.border = '2px solid #c7c6c3';
    snapshot.width = 136;
    snapshot.height = 91;
    snapshot.style.position = 'absolute';
    let random = Math.floor(Math.random() * 30) + 1;
    random *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;

    snapshot.style.transform = `rotate(${random}deg)`;
  }

  function addSnapshotToDOM(snapshot) {
    document.querySelector('#snapshots-taken h4').style.opacity = 1;
    document.querySelector('#snapshots-taken').appendChild(snapshot);
  }
}
