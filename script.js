var walkers = [];

var canvas;
var ctx;
var imageData;
var srcData;

var FRAME_SKIP = 1;
var frame = 0;

var src = "test.jpg";

var cmykPixels = [];

function updateWalker(w) {

  var dIndex = w.color === 4 ? 3 : w.color;

  var localSpeed = 1 - getCMYKSrcPixel(w.x, w.y, dIndex);

  if (w.color === 4) {
    localSpeed = 1 - localSpeed;
  }

  localSpeed = Math.min(0.99, Math.max(0.05, localSpeed));
  localSpeed *= 2;

  var alpha = 0.5;
  w.speed = (1 - alpha) * w.speed + alpha * localSpeed;

  var dx = Math.cos(w.direction) * w.speed;
  var dy = Math.sin(w.direction) * w.speed;

  // if (w.color !== 3) {
  w.ddirection += (Math.random() - 0.5) * 0.05;
  w.ddirection = Math.max(-0.05, Math.min(0.05, w.ddirection));
  w.direction += w.ddirection;

  w.x += canvas.width + dx;
  w.y += canvas.height + dy;

  w.x %= canvas.width;
  w.y %= canvas.height;

}

function colorToFillStyle(color) {
  if (color === 0) {
    return 'rgba(0, 255, 255, .1)';
  }
  if (color === 1) {
    return 'rgba(255, 0, 255, .1)';
  }
  if (color === 2) {
    return 'rgba(255, 255, 0, .1)';
  }
  if (color === 3) {
    return 'rgba(0, 0, 0, .1)';
  }
}

function colorToCMYK(color) {
  if (color === 0) {
    return [0.3, 0, 0, 0];
  }
  if (color === 1) {
    return [0, 0.3, 0, 0];
  }
  if (color === 2) {
    return [0, 0, 0.3, 0];
  }
  if (color === 3) {
    return [0, 0, 0, 0.3];
  }
  return [0, 0, 0, 0];
}

function draw() {

  walkers.forEach(function(w) {
    var cmyk = colorToCMYK(w.color);
    var spread = Math.round(w.size);

    for (var dx = -spread; dx <= spread; dx++) {
      for (var dy = -spread; dy <= spread; dy++) {
        addCMYKPixel(w.x + dx, w.y + dy, cmyk[0], cmyk[1], cmyk[2], cmyk[3]);
      }
    }

  });

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

  draw();

  window.setImmediate(tick);
}

function getCMYKSrcPixel(x, y, dIndex) {
  if (!srcData) {
    return 0;
  }
  var index = Math.floor(x) * 4 + Math.floor(y) * srcData.width * 4;
  var r = srcData.data[index];
  var g = srcData.data[index + 1];
  var b = srcData.data[index + 2];

  return rgb2cmyk(r, g, b)[dIndex];

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
    srcCtx.drawImage(img, 0, 0, width, height);
    srcData = srcCtx.getImageData(0, 0, width, height);
  };
  img.src = src;
}

function init() {

  canvas = document.querySelectorAll('canvas')[0];
  ctx = canvas.getContext("2d");

  canvas.width = canvas.parentNode.offsetWidth;
  canvas.height = canvas.parentNode.offsetHeight;

  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);

  cmykPixels = [];
  for (var i = 0; i < canvas.width * canvas.height; i++) {
    cmykPixels.push([0, 0, 0, 0]);
  }

  initFileDrop();
  loadImage();

  walkers = [];

  for (var i = 0; i < 320; i++) {
    walkers.push({
      x: Math.floor(Math.random() * canvas.width),
      y: Math.floor(Math.random() * canvas.height),
      direction: Math.random() * Math.PI * 2,
      ddirection: 0,
      speed: 20,
      color: i % 5,
      size: Math.random() * 2
    });
  }
}
tick();
redraw();
init();

// Prepare to allow droppings
function initFileDrop() {
  canvas.addEventListener('dragover', dragOver, false);
  canvas.addEventListener('dragenter', dragOver, false);
  canvas.addEventListener('drop', fileDropped, false);
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

function rgb2cmyk(r, g, b) {
  var c = 0;
  var m = 0;
  var y = 0;
  var k = 0;

  // BLACK
  if (r === 0 && g === 0 && b === 0) {
    k = 1;
    return [0, 0, 0, 1];
  }

  c = 1 - (r / 255);
  m = 1 - (g / 255);
  y = 1 - (b / 255);

  var minCMY = Math.min(c, Math.min(m, y));
  c = (c - minCMY) / (1 - minCMY);
  m = (m - minCMY) / (1 - minCMY);
  y = (y - minCMY) / (1 - minCMY);
  k = minCMY;

  return [c, m, y, k];
}

function cmyk2rgb(c, m, y, k) {

  r = 1 - Math.min(1, c * (1 - k) + k);
  g = 1 - Math.min(1, m * (1 - k) + k);
  b = 1 - Math.min(1, y * (1 - k) + k);

  r = Math.round(r * 255);
  g = Math.round(g * 255);
  b = Math.round(b * 255);

  return [r, g, b];
}

function addCMYKPixel(x, y, c, m, yel, k) {

  var index = coordToIndex(x, y);

  if (index === false) {
    return;
  }

  var currentCmyk = cmykPixels[index];
  var alpha = 0.025;
  currentCmyk[0] = Math.min(1, currentCmyk[0] + alpha * c);
  currentCmyk[1] = Math.min(1, currentCmyk[1] + alpha * m);
  currentCmyk[2] = Math.min(1, currentCmyk[2] + alpha * yel);
  currentCmyk[3] = Math.min(1, currentCmyk[3] + alpha * k);

  if (c + m + yel + k === 0) {
    currentCmyk[0] *= 1 - alpha;
    currentCmyk[1] *= 1 - alpha;
    currentCmyk[2] *= 1 - alpha;
    currentCmyk[3] *= 1 - alpha;
  }

  setCMYKPixel(x, y, currentCmyk[0], currentCmyk[1], currentCmyk[2], currentCmyk[3]);
}

function setCMYKPixel(x, y, c, m, yel, k) {
  var rgb = cmyk2rgb(c, m, yel, k);
  setRGBPixel(x, y, rgb[0], rgb[1], rgb[2]);
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
  script.src = 'https://api.flickr.com/services/feeds/photos_public.gne?format=json&jsoncallback=loaded'

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
