'use strict';

var pointGenerator = function pointGenerator() {
  var dot = function dot(upper) {
    return Math.round(upper * 2 * Math.random() - upper);
  };
  return { x: dot(4000), y: dot(200), z: dot(500) - 1000 };
};

var dataGenerator = function dataGenerator(chTarget, amount, interval) {
  var i = 0;
  var id = setInterval(function () {
    if (++i > amount) clearInterval(id);
    chTarget.addPoint(pointGenerator());
  }, interval);
};

window.onload = function () {
  // var socket = io();
  var chart = Chart('chart-container');

  chart.register(['peek', 'select', 'wheel']);

  // // socket
  // socket.on('get data', function (msg) {
  // 	// console.log(msg);
  // 	chart.addPoint(msg);
  // });

  // UI
  if (sessionStorage.length === 0) {
    chart.reset();
    dataGenerator(chart, 150, 20);
  }

  document.getElementById('btn-clear').addEventListener('click', function () {
    return chart.clear();
  }, false);
  document.getElementById('btn-load-data').addEventListener('click', function () {
    chart.reset();
    dataGenerator(chart, 120, 20);
  }, false);
};