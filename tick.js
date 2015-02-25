
window.tick = function (callback) {
  var ticker = function () {
    callback();
    window.setImmediate(ticker);
  };
  ticker();
};
