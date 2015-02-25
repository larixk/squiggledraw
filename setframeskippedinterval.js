window.setFrameSkippedInterval = function (callback, frameSkip) {
  var frame = 0;
  function check () {
    frame += 1;
    frame %= frameSkip;
    if (frame === 0) {
      callback();
    }
    requestAnimationFrame(check);
  }
  check();
};
