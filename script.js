var walkers = [];

var canvas;
var ctx;
var imageData;
var srcData;

var width, height;

function getPixelBrightness(srcData, location) {
  if (!srcData) {
    return 0;
  }
  var index = (location.x + location.y * width) << 2;
  var r = srcData[index];
  var g = srcData[index + 1];
  var b = srcData[index + 2];

  return (r + g + b) / (755);
}

function addPixel(data, walker) {
  var index = (walker.x + walker.y * width) << 2;
  var color = walker.color * 255;
  var oldColor = data[index];
  color = oldColor + walker.alpha * (color - oldColor);

  data[index] = data[index + 1] = data[index + 2] = color;
}

function updateWalker(walker) {
  var localSpeed = getPixelBrightness(srcData, walker);

  if (walker.color === 1) {
    localSpeed = 1 - localSpeed;
  }

  localSpeed = 1 + localSpeed * localSpeed * 50;

  walker.realX += (Math.random() - 0.5) * localSpeed;
  walker.realY += (Math.random() - 0.5) * localSpeed;

  if (walker.x < 0 || walker.y < 0 || walker.x >= width || walker.y >= height) {
    walker.realX = width / 2;
    walker.realY = height / 2;
  }
  walker.x = Math.round(walker.realX);
  walker.y = Math.round(walker.realY);

  addPixel(imageData.data, walker);
}



function drawCentered(img) {
  var srcCanvas = document.createElement("canvas");
  var srcCtx = srcCanvas.getContext("2d");

  srcCanvas.width = width;
  srcCanvas.height = height;

  var imgRatio = img.width / img.height;

  var drawWidth, drawHeight, x, y;
  if (imgRatio > width / height) {
    drawHeight = height;
    drawWidth = height * imgRatio;
    x = (width - drawWidth) / 2;
    y = 0;
  } else {
    drawWidth = width;
    drawHeight = width / imgRatio;
    x = 0;
    y = (height - drawHeight) / 2;
  }

  srcCtx.save();
  srcCtx.scale(-1, 1);
  srcCtx.drawImage(img, -drawWidth, y, drawWidth, drawHeight);
  srcCtx.restore();

  return srcCtx.getImageData(0, 0, width, height).data;
}

function loadImage(src) {
  var img = new Image();
  img.crossOrigin = "Anonymous";

  img.onload = function() {
    srcData = drawCentered(this);
  };
  img.src = src;
}

function addWalker(walkers) {
  walkers.push({
    realX: Math.floor(0.5 * width),
    realY: Math.floor(0.5 * height),
    color: Math.random() > 0.5 ? 1 : 0,
    alpha: Math.pow(Math.random(), 2) * 0.25
  });
}

function init() {

  canvas = document.querySelectorAll("canvas")[0];
  ctx = canvas.getContext("2d");

  canvas.width = canvas.parentNode.offsetWidth;
  canvas.height = canvas.parentNode.offsetHeight;

  width = canvas.width;
  height = canvas.height;

  ctx.fillStyle = "rgba(128,128,128,1)";
  ctx.fillRect(0, 0, width, height);

  imageData = ctx.getImageData(0, 0, width, height);

  window.onDrop(canvas, loadImage);
  loadImage("test.jpg");

  walkers = [];
  for (var i = 0; i < width * height / 5000; i += 1) {
    addWalker(walkers);
  }
}

window.tick(function () {
  walkers.forEach(updateWalker);
});
window.setFrameSkippedInterval(function () {
  if (ctx) {
    ctx.putImageData(imageData, 0, 0);
  }
}, 3);

init();

var flickrImages = [],
flickrIndex = 0;

function rotate() {
  if (flickrImages.length < flickrIndex + 1) {
    flickrIndex = -1;
  }
  flickrIndex += 1;
  loadImage(flickrImages[flickrIndex].media.m);
}
document.body.addEventListener("click", rotate);

function loadFlickrImageURLs() {

  window.loaded = function(data) {
    flickrImages = data.items;
    rotate();
  };
  var script = document.createElement("script");
  var src = "https://api.flickr.com/services/feeds/photos_public.gne";
  src += "?tags=black%20%26%20white&format=json&jsoncallback=loaded";
  script.src = src;
  document.getElementsByTagName("head")[0].appendChild(script);
}

loadFlickrImageURLs();

var v;

setInterval(function() {
  if (!v) {
    rotate();
  }
}, 15000);

navigator.webkitGetUserMedia({
  video: true
}, function(stream) {
  v = document.createElement("video");
  document.body.appendChild(v);
  v.src = URL.createObjectURL(stream);
  v.width = 480;
  v.height = 360;
  v.play();
}, function() {
});

setInterval(function() {
  if (v) {
    srcData = drawCentered(v);
  }
}, 300);
