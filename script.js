var walkers = [];

var survivors;

var canvas;
var ctx;
var imageData;
var srcData;

var width, height;
var numWalkers;

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

function getPixelBrightness(srcData, location) {
  if (!srcData) {
    return 0;
  }
  var index = (location.x + location.y * width) << 2;
  var r = srcData[index];
  var g = srcData[index + 1];
  var b = srcData[index + 2];

  return (r + g + b) / (768);
}

function addPixel(data, walker) {
  // var index = (walker.x + walker.y * width) << 2;
  // var color = walker.color * 255;
  // var oldColor = data[index];
  var alpha = walker.alpha;
  // color = oldColor + alpha * (color - oldColor);
  ctx.strokeStyle = walker.color ? 'rgba(255,255,255,' + alpha + ')' : 'rgba(0,0,0,' + alpha + ')';
  ctx.lineWidth = walker.size * walker.hp;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(walker.previousX, walker.previousY);
  ctx.lineTo(walker.x, walker.y);
  ctx.stroke();
  // ctx.arc(walker.x, walker.y, walker.size * walker.hp, 0, 2 * Math.PI);
  // ctx.fill();

  // data[index] = data[index + 1] = data[index + 2] = color;
}

function updateWalker(walker) {
  var localSpeed = getPixelBrightness(srcData, walker);

  if (walker.color === 0) {
    localSpeed = 1 - localSpeed;
  }



  // localSpeed = Math.pow(localSpeed, 1.2);
  // localSpeed = Math.max(0.1, localSpeed);

  // if(localSpeed < 0.5) {
  //   walker.ddirection = 8 * (Math.random() - 0.5);
  // } else {
  //   walker.ddirection = 0.1 * (Math.random() - 0.5);
  // }
  // walker.ddirection = Math.pow(1 - localSpeed, 2) * ((Math.random() - 0.5) * 10);
  if (walker.localSpeed > localSpeed) {
    walker.ddirection += (Math.random() -0.5) * 4;
  } else {
    walker.ddirection *= 0.8;
  }
  walker.localSpeed = localSpeed;

  // walker.ddirection += (Math.random() - 0.5) * Math.pow(localSpeed, 2);
  walker.ddirection = Math.min(2, Math.max(-2, walker.ddirection));
  walker.direction += walker.ddirection;

  var speed = 1 + Math.pow(localSpeed, 1.5) * 10; //1 + Math.pow(localSpeed, 20) * walker.hp * walker.size;
  speed = (1 + Math.pow(1 - localSpeed, 2)) * walker.size * walker.hp * 2;
  walker.alpha = Math.pow(localSpeed, 2) * 0.4;
  walker.realX += speed * Math.cos(walker.direction);
  walker.realY += speed * Math.sin(walker.direction);

  walker.previousX = walker.x;
  walker.previousY = walker.y;
  walker.x = Math.round(walker.realX);
  walker.y = Math.round(walker.realY);

  walker.hp -= 0.001 * (0.6 - localSpeed);
  walker.hp = Math.min(1, walker.hp);

  if (walker.x < 0 || walker.y < 0 || walker.x >= width || walker.y >= height) {
    walker.hp = 0;
  }

  if (walker.hp > 0) {
    addPixel(imageData.data, walker);
    survivors.push(walker);
  }else {
    addWalker(survivors);
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
  walkers.push({
    direction: Math.random() * Math.PI * 2,
    ddirection: 0,
    size: 2 + Math.pow(Math.random(), 5) * 50,
    realX: Math.random() * width,
    realY: Math.random() * height,
    color: Math.random() > 0.5 ? 1 : 0,
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

  ctx.fillStyle = "rgba(127,127,127,1)";
  ctx.fillRect(0, 0, width, height);

  imageData = ctx.getImageData(0, 0, width, height);

  window.onDrop(canvas, loadImage);
  loadImage("test.jpg");

  walkers = [];
  console.log(width * height / 500);
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
