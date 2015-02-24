var walkers = [];

var canvas, indicator;
var ctx;
var imageData;
var srcData;

var FRAME_SKIP = 1;
var frame = 0;

var src = "test.jpg";

function updateWalker(w) {

  var localSpeed = getSrcPixelBrightness(w.x, w.y);

  if (w.color === 1) {
    localSpeed = 1 - localSpeed;
  }

  localSpeed = Math.max(0.1, localSpeed);
  var maxTurn = Math.pow(1 - localSpeed, 6);

  w.ddirection += (Math.random() - 0.5) * maxTurn;
  w.ddirection = Math.max(-maxTurn, Math.min(maxTurn, w.ddirection));
  w.direction += w.ddirection;

  localSpeed *= w.speedyness;
  var dx = Math.cos(w.direction) * localSpeed;
  var dy = Math.sin(w.direction) * localSpeed;

  w.x += canvas.width + dx;
  w.y += canvas.height + dy;

  w.x %= canvas.width;
  w.y %= canvas.height;

}

function addPixel(w) {
  var index = (Math.floor(w.x) + Math.floor(w.y) * imagedata.width) * 4;
  color = w.color * 255;
  color = imagedata.data[index] + w.alpha * (color - imagedata.data[index]);

  imagedata.data[index] = color;
  imagedata.data[index + 1] = color;
  imagedata.data[index + 2] = color;
  imagedata.data[index + 3] = 255;
}

function redraw() {

  frame++;
  frame %= FRAME_SKIP;
  if (frame === 0) {
    if (ctx) {
      ctx.putImageData(imagedata, 0, 0);

      // var indicatorCtx = indicator.getContext("2d");
      // indicator.width = indicator.width;
      // walkers.forEach(function(w) {
      //   var c = w.color * 255;
      //   indicatorCtx.fillStyle = 'rgba(' + c + ',' + c + ',' + c + ',1)';
      //   indicatorCtx.beginPath();
      //   indicatorCtx.arc(Math.floor(w.x), Math.floor(w.y), 10 / w.speedyness, 0, 2 * Math.PI);
      //   indicatorCtx.fill();
      //   // indicatorCtx.fillRect(Math.floor(w.x) - 4, Math.floor(w.y) - 4, 8, 8);
      // });
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
  var srcCanvas = document.createElement('canvas');
  document.body.appendChild(srcCanvas);
  var srcCtx = srcCanvas.getContext("2d");
  var img = new Image();
  img.crossOrigin = "Anonymous";

  img.onload = function() {
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
    }
    else {
      width = srcCanvas.width;
      height = srcCanvas.width / imgRatio;
      x = 0;
      y = (srcCanvas.height - height) / 2;
    }

    srcCtx.drawImage(img, x, y, width, height);
    srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  };
  img.src = src;
}

function init() {

  canvas = document.querySelectorAll('canvas')[0];
  indicator = document.querySelectorAll('canvas')[1];
  ctx = canvas.getContext("2d");

  canvas.width = canvas.parentNode.offsetWidth;
  canvas.height = canvas.parentNode.offsetHeight;

  indicator.width = canvas.width;
  indicator.height = canvas.height;

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);

  initFileDrop();
  loadImage();

  walkers = [];

  for (var i = 0; i < canvas.width * canvas.height / 2000; i++) {
    walkers.push({
      x: Math.floor(Math.random() * canvas.width),
      y: Math.floor(Math.random() * canvas.height),
      direction: Math.random() * Math.PI * 2,
      ddirection: 0,
      speed: 0,
      color: Math.random() > 0.5 ? 1 : 0,
      speedyness: 1 + Math.random() * 8,
      alpha: 0.05 + Math.pow(Math.random(), 8) * 0.1
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

function setRGBPixel(x, y, r, g, b) {
  if (x < 0 || x > imagedata.width) {
    return;
  }
  if (y < 0 || y > imagedata.height) {
    return;
  }
  var index = coordToIndex(x, y) * 4;
  imagedata.data[index] = r;
  imagedata.data[index + 1] = g;
  imagedata.data[index + 2] = b;
  imagedata.data[index + 3] = 255;
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
    'https://api.flickr.com/services/feeds/photos_public.gne?tags=amsterdam&format=json&jsoncallback=loaded';

  document.getElementsByTagName('head')[0].appendChild(script);
}

loadFlickrImageURLs();

document.body.addEventListener('click', function(e) {
  if (flickrImages.length < flickrIndex + 1) {
    return;
  }
  flickrIndex++;
  src = flickrImages[flickrIndex].media.m;
  loadImage();
});
