var walkers = [];

var canvas, indicator;
var ctx;
var imageData;
var srcData;

var FRAME_SKIP = 2;
var frame = 0;

var src = "test.jpg";

function updateWalker(w) {

  var localSpeed = getSrcPixelBrightness(w.x, w.y);

  if (w.color === 1) {
    localSpeed = 1 - localSpeed;
  }

  localSpeed = 1 + Math.pow(localSpeed, 2) * 50;

  var dx = Math.round((Math.random() - 0.5) * localSpeed);
  var dy = Math.round((Math.random() - 0.5) * localSpeed);

  // dx = w.dx * localSpeed;
  // dy = w.dy * localSpeed;

  w.x += dx;
  w.y += dy;

  if (w.x < 0 || w.y < 0 || w.x >= canvas.width || w.y >= canvas.height) {
    w.x = canvas.width / 2;
    w.y = canvas.height / 2;
    // w.dx = (Math.random() - 0.5) * 20;
    // w.dy = (Math.random() - 0.5) * 20;
  }

}

function addPixel(w) {
  var index = (Math.floor(w.x) + Math.floor(w.y) * imagedata.width) * 4;
  var oldColor = imagedata.data[index];
  color = w.color * 255;
  color = oldColor + w.alpha * (color - oldColor);

  imagedata.data[index] = color;
  imagedata.data[index + 1] = color;
  imagedata.data[index + 2] = color;
}

function redraw() {

  frame++;
  frame %= FRAME_SKIP;
  if (frame === 0) {
    if (ctx) {
      ctx.putImageData(imagedata, 0, 0);
    }
  }

  requestAnimationFrame(redraw);
}

function tick() {
  walkers.forEach(updateWalker);
  walkers.forEach(addPixel);

  window.setImmediate(tick);
}

function getSrcPixelBrightness(x, y) {
  if (!srcData) {
    return 0;
  }
  var index = (Math.floor(x) + Math.floor(y) * srcData.width) * 4;
  var r = srcData.data[index];
  var g = srcData.data[index + 1];
  var b = srcData.data[index + 2];

  return (r + g + b) / (255 * 3);
}

function loadImage() {
  var img = new Image();
  img.crossOrigin = "Anonymous";

  img.onload = function() {
    drawCentered(img);
  };
  img.src = src;
}

function drawCentered(img) {
  var srcCanvas = document.createElement('canvas');
  document.body.appendChild(srcCanvas);
  var srcCtx = srcCanvas.getContext("2d");

  var width = canvas.width;
  var height = canvas.height;

  srcCanvas.width = width;
  srcCanvas.height = height;

  var imgRatio = img.width / img.height;
  var cvsRatio = srcCanvas.width / srcCanvas.height;

  if (imgRatio > cvsRatio) {
    height = srcCanvas.height;
    width = srcCanvas.height * imgRatio;
    x = (srcCanvas.width - width) / 2;
    y = 0;
  } else {
    width = srcCanvas.width;
    height = srcCanvas.width / imgRatio;
    x = 0;
    y = (srcCanvas.height - height) / 2;
  }

  srcCtx.save();
  srcCtx.scale(-1, 1);
  srcCtx.drawImage(img, -width, y, width, height);
  srcCtx.restore();

  srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

}

function init() {

  canvas = document.querySelectorAll('canvas')[0];
  indicator = document.querySelectorAll('canvas')[1];
  ctx = canvas.getContext("2d");

  canvas.width = canvas.parentNode.offsetWidth;
  canvas.height = canvas.parentNode.offsetHeight;

  indicator.width = canvas.width;
  indicator.height = canvas.height;

  ctx.fillStyle = "rgba(128,128,128,1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);

  initFileDrop();
  loadImage();

  walkers = [];

  for (var i = 0; i < canvas.width * canvas.height / 2000; i++) {
    walkers.push({
      // x: Math.floor(Math.random() * canvas.width),
      // y: Math.floor(Math.random() * canvas.height),
      x: Math.floor(0.5 * canvas.width),
      y: Math.floor(0.5 * canvas.height),
      // dx: (Math.random() - 0.5) * 20,
      // dy: (Math.random() - 0.5) * 20,
      color: i % 2,
      alpha: Math.pow(Math.random(), 2) * 0.25
    });
  }
}
tick();
redraw();
init();

// Prepare to allow droppings
function initFileDrop() {
  indicator.addEventListener('dragover', dragOver, false);
  indicator.addEventListener('dragenter', dragOver, false);
  indicator.addEventListener('drop', fileDropped, false);
}

function dragOver(e) {
  e.preventDefault();
  return false;
}

// Dropping occured
function fileDropped(e) {
  e.stopPropagation();
  e.preventDefault();

  var files = e.dataTransfer.files, // FileList object
    reader;
  if (!(files && files.length)) {
    return;
  }

  reader = new FileReader();
  reader.onload = function(e) {
    src = e.target.result;
    loadImage();
  };
  reader.readAsDataURL(files[0]);
}

function coordToIndex(x, y) {
  if (!imagedata) {
    return false;
  }

  x = Math.floor(x);
  y = Math.floor(y);

  if (x < 0 || x >= imagedata.width) {
    return false;
  }
  if (y < 0 || y >= imagedata.height) {
    return false;
  }
  return x + y * imagedata.width;
}

var flickrImages = [];
flickrIndex = 0;

function loadFlickrImageURLs() {

  window.loaded = function(data) {
    flickrImages = data.items;
    src = flickrImages[0].media.m;
    loadImage();
  };
  var script = document.createElement('script');
  script.src =
    'https://api.flickr.com/services/feeds/photos_public.gne?tags=black%20%26%20white&format=json&jsoncallback=loaded';

  document.getElementsByTagName('head')[0].appendChild(script);
}

loadFlickrImageURLs();

function rotate() {
  if (flickrImages.length < flickrIndex + 1) {
    flickrIndex = -1;
  }
  flickrIndex++;
  src = flickrImages[flickrIndex].media.m;
  loadImage();
}
document.body.addEventListener('click', rotate);

setInterval(function() {
  if (!v) {
    rotate();
  }
}, 10000);

var v;
navigator.webkitGetUserMedia({
  video: true
}, function(stream) {
  v = document.createElement('video');
  document.body.appendChild(v);
  v.src = URL.createObjectURL(stream);
  v.width = 480;
  v.height = 360;
  v.play();
}, function(e) {
  console.log(e);
});

setInterval(function() {
  if (v) {
    drawCentered(v);
  }
}, 100);
