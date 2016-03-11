'use strict'

var data = [
{ x: '-669', y: '-198', z: '-2635' },
{ x: '-890', y: '132', z: '-3925' },
{ x: '51', y: '-844', z: '-167' },
{ x: '1457', y: '812', z: '2231' },
{ x: '1429', y: '982', z: '20' },
{ x: '-629', y: '323', z: '2335' },
{ x: '-32', y: '-990', z: '-2793' },
{ x: '714', y: '750', z: '2081' },
{ x: '867', y: '325', z: '1792' },
{ x: '-565', y: '351', z: '-1108' },
];

window.onload = () => {
	var socket = io();
  var chart = Chart('chart-container');

  chart.register(['peek', 'select', 'wheel']);

	socket.on('get data', function (msg) {
		// console.log(msg);
		chart.addPoint(msg);
	});

	document.getElementById('btn-zoom').addEventListener('click', () =>
    chart.zoom(), false);
	document.getElementById('btn-reset').addEventListener('click', () =>
    chart.reset(), false);
	document.getElementById('btn-clear').addEventListener('click', () =>
    chart.clear(), false);
  document.getElementById('btn-load-data').addEventListener('click', () => {
    chart.loadData(data);
    chart.reset();
  }, false);
};
