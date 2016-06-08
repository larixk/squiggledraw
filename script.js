var walkers = [];

var survivors;

var canvas;
var ctx;
var imageData;
var srcData;

var width, height;
var numWalkers;
var liveWalkerCount;

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

function getPixelBrightness(srcData, location, color) {
  if (!srcData) {
    return 0;
  }
  var index = (location.x + location.y * width) << 2;
  var r = srcData[index];
  var g = srcData[index + 1];
  var b = srcData[index + 2];

  if (color === 1) {
    return (r) / 256;
  } else if( color === 2) {
    return (g) / 256;
  } else if( color === 3) {
    return (b) / 256;
  }

  return (r + g + b) / (768);
}

function addPixel(data, walker) {
  var alpha = walker.alpha;
  var colors = [
    'rgba(255,255,255,' + alpha * 0.5 + ')',
    'rgba(255,0,0,' + alpha + ')',
    'rgba(0,255,0,' + alpha + ')',
    'rgba(0,0,255,' + alpha + ')',
    'rgba(0,0,0,' + alpha + ')',
  ];
  ctx.globalCompositeOperation = walker.color > 3 ? "normal" : "screen";
  ctx.strokeStyle = colors[walker.color];
  ctx.lineWidth = walker.size * walker.hp;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(walker.previousX, walker.previousY);
  ctx.lineTo(walker.x, walker.y);
  ctx.stroke();
}

function updateWalker(walker) {
  var localSpeed;

  if (walker.color > 3) {
    localSpeed = 1 - getPixelBrightness(srcData, walker, walker.color);
  } else {
    localSpeed = getPixelBrightness(srcData, walker, walker.color);
  }
  if (walker.localSpeed > localSpeed) {
    walker.ddirection += (Math.random() -0.5) * 2;
  } else {
    walker.ddirection *= 0.5;
  }
  walker.localSpeed = localSpeed;

  walker.direction += walker.ddirection;

  var speed = walker.size * walker.hp + Math.pow(localSpeed, 20) * 30;
  walker.alpha = Math.pow(localSpeed, 2) * 0.4;
  walker.realX += speed * Math.cos(walker.direction);
  walker.realY += speed * Math.sin(walker.direction);

  walker.previousX = walker.x;
  walker.previousY = walker.y;
  walker.x = Math.round(walker.realX);
  walker.y = Math.round(walker.realY);

  walker.hp += 0.1 * (Math.random() - 0.6);
  walker.hp = Math.min(1, walker.hp);

  addPixel(imageData.data, walker);
  if (walker.x < 0 || walker.y < 0 || walker.x >= width || walker.y >= height) {
    walker.hp = 0;
  }

  if (walker.hp > 0) {
    survivors.push(walker);
  }else {
    liveWalkerCount--;
  }

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
  liveWalkerCount++;
  walkers.push({
    direction: Math.random() * Math.PI * 2,
    ddirection: 0,
    size: 2 + Math.pow(Math.random(), 10) * 300,
    realX: Math.random() * width,
    realY: Math.random() * height,
    color: 1 + Math.floor(Math.random() * 4),
    hp: Math.random()
  });
}

function init() {

  canvas = document.querySelectorAll("canvas")[0];
  ctx = canvas.getContext("2d");

  canvas.width = canvas.parentNode.offsetWidth;
  canvas.height = canvas.parentNode.offsetHeight;

  width = canvas.width;
  height = canvas.height;

  numWalkers = width * height / 2000

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, width, height);

  imageData = ctx.getImageData(0, 0, width, height);

  window.onDrop(canvas, loadImage);
  loadImage("test.jpg");

  walkers = [];
  liveWalkerCount = 0;
  for (var i = 0; i < numWalkers; i += 1) {
    addWalker(walkers);
  }
}

window.tick(function () {
  if (!canvas) {
    return;
  }
  survivors = [];
  walkers.forEach(updateWalker);
  while (survivors.length < walkers.length) {
    if (Math.random() > 0.9) {
      addWalker(survivors);
    } else {
      var parentWalkerIndex = Math.floor(survivors.length * Math.random());
      var parentWalker = survivors[parentWalkerIndex];
      survivors.push({
        direction: Math.random() * Math.PI * 2,
        ddirection: 0,
        size: 2 + Math.pow(Math.random(), 3) * 50,
        realX: parentWalker.realX,
        realY: parentWalker.realY,
        color: parentWalker.color,
        hp: Math.random()
      })
    }
  }
  walkers = survivors;
});

init();

var v;

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
}, 1000);
