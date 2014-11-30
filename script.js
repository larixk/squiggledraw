var walkers = [];

var canvas;
var ctx;
var srcData;

var FRAME_SKIP = 1;
var frame = 0;

var src = "test.jpg";

function updateWalker(w, dt) {

  var localSpeed = 1 - getCMYKat(w.x, w.y, w.color);

  localSpeed = Math.min(0.99, Math.max(0.05, localSpeed));

  localSpeed *= 0.25;

  w.speed = localSpeed;
  var alpha = 0.0001;
  w.speed = (1 - alpha) * w.speed + alpha * localSpeed;
  // w.size = Math.pow(1 - w.speed, 4);

  var dx = Math.cos(w.direction) * w.speed;
  var dy = Math.sin(w.direction) * w.speed;

  // if (w.color !== 3) {
  w.direction += (Math.random() - 0.5) * 1.25;
  // }

  w.x += canvas.width + dx * dt;
  w.y += canvas.height + dy * dt;

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
// function colorToFillStyle(color) {
//   if (color === 0) {
//     return 'rgba(255, 0, 0, .025)';
//   }
//   if (color === 1) {
//     return 'rgba(0, 255, 0, .025)';
//   }
//   if (color === 2) {
//     return 'rgba(0, 0, 255, .025)';
//   }
// }

function draw() {
  // ctx.fillStyle = "rgba(255,255,255,0.005)";
  // ctx.fillRect(0, 0, canvas.width, canvas.height);
  // ctx.save();
  // ctx.globalCompositeOperation = "lighter";
  // ctx.globalCompositeOperation = "darken";
  walkers.forEach(function(w) {

    ctx.fillStyle = colorToFillStyle(w.color);
    ctx.beginPath();
    ctx.arc(w.x, w.y, 1.5 * w.size, 0, 2 * Math.PI);
    //ctx.rect(w.x, w.y, 5 * w.size, 5 * w.size);
    ctx.fill();
  });
  // ctx.restore();
}

function redraw() {

  frame++;
  frame %= FRAME_SKIP;
  if (frame === 0) {
    if (ctx) {
      draw();
    }
  }

  requestAnimationFrame(redraw);
}

function tick() {
  walkers.forEach(function(w) {
    updateWalker(w, 20);
  });

  draw();

  window.setImmediate(tick);
}

function getLightnessAt(x, y) {
  if (!srcData) {
    return 0;
  }
  var index = Math.floor(x) * 4 + Math.floor(y) * srcData.width * 4;
  var r, g, b;
  r = srcData.data[index];
  g = srcData.data[index + 1];
  b = srcData.data[index + 2];

  return (r + g + b) / (256 * 3);

}

function getRGBAt(x, y, dIndex) {
  if (!srcData) {
    return 0;
  }
  var index = Math.floor(x) * 4 + Math.floor(y) * srcData.width * 4;
  var v = srcData.data[index + dIndex];

  return v / 256;

}

function getCMYKat(x, y, dIndex) {
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

  initFileDrop();
  loadImage();

  var centerX = Math.floor(canvas.width / 2);
  var centerY = Math.floor(canvas.height / 2);

  walkers = [];

  for (var i = 0; i < 5000; i++) {
    walkers.push({
      x: Math.floor(Math.random() * canvas.width),
      y: Math.floor(Math.random() * canvas.height),
      direction: Math.random() * Math.PI * 2,
      speed: 0,
      color: i % 4,
      size: Math.random()
      // x: centerX,
      // y: centerY
    });
  }
}

tick();
// redraw();
init();

// Prepare to allow droppings
function initFileDrop() {
  canvas.addEventListener('dragover', dragOver, false);
  canvas.addEventListener('dragenter', dragOver, false);
  canvas.addEventListener('drop', fileDropped, false);
}

function dragOver(e) {
  console.log("dragover");
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

  var reader = new FileReader();
  reader.onload = function(e) {
    src = e.target.result;
    init();
  };
  reader.readAsDataURL(files[0]);
}

function rgb2cmyk(r, g, b) {
  var computedC = 0;
  var computedM = 0;
  var computedY = 0;
  var computedK = 0;

  // BLACK
  if (r === 0 && g === 0 && b === 0) {
    computedK = 1;
    return [0, 0, 0, 1];
  }

  computedC = 1 - (r / 255);
  computedM = 1 - (g / 255);
  computedY = 1 - (b / 255);

  var minCMY = Math.min(computedC,
    Math.min(computedM, computedY));
  computedC = (computedC - minCMY) / (1 - minCMY);
  computedM = (computedM - minCMY) / (1 - minCMY);
  computedY = (computedY - minCMY) / (1 - minCMY);
  computedK = minCMY;

  return [computedC, computedM, computedY, computedK];
}
