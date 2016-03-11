// for ((i=0;i<1000;++i));do curl "http://localhost:3000/pebble?x=$((RANDOM%3000-1500))&y=$((RANDOM%2000-1000))&z=$((RANDOM%8000-4000))";done
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Chart = function Chart(targetDivId, initData) {
	var Point = function () {
		function Point(jsonP) {
			_classCallCheck(this, Point);

			var _p = typeof jsonP === 'string' ? JSON.parse(jsonP) : jsonP;
			this.x = +_p.x;
			this.y = +_p.y;
			this.z = +_p.z;
			return this;
		}

		_createClass(Point, null, [{
			key: 'setViewRange',
			value: function setViewRange(viewRange) {
				Point.viewRange = viewRange;
				Point.dataRange = 4000;
				Number.prototype.toPixel = function () {
					return this * Point.viewRange / Point.dataRange;
				};
			}
		}]);

		return Point;
	}();

	var BufferC = function () {
		function BufferC(size) {
			_classCallCheck(this, BufferC);

			this.from = 0;
			this.to = 0;
			this.length = 0; // number now
			this.size = size; // max number
			this.data = [];
			this.dims = ['x', 'y', 'z'];
			this.color = {
				'x': 'rgb(0, 156, 255)',
				'y': 'rgb(255, 199, 0)',
				'z': 'rgb(3, 191, 30)'
			};
		}

		_createClass(BufferC, [{
			key: 'push',
			value: function push(p) {
				if (!p instanceof Point) {
					console.log('not a Point object:', p);
					return;
				}
				this.data.push(p);
				++this.length;
				++this.to;
				if (this.length > this.size) this.shift();
			}
		}, {
			key: 'pop',
			value: function pop() {
				if (0 == this.length) return;
				--this.length;
				--this.to;
				this.data.pop();
			}
		}, {
			key: 'unshift',
			value: function unshift(p) {
				if (!p instanceof Point) {
					console.log('not a Point object:', p);
					return;
				}
				this.data.unshift(p);
				++this.length;
				--this.from;
				if (this.length > this.size) this.pop();
			}
		}, {
			key: 'shift',
			value: function shift() {
				if (0 == this.length) return;
				--this.length;
				++this.from;
				this.data.shift();
			}
		}, {
			key: 'loadBuffer',
			value: function loadBuffer(from, to) {
				this.size = to - from + 1;
				for (var j = from; j < to + 1 && j < s.length; ++j) {
					this.push(new Point(s.getItem(j)));
				}
			}
		}]);

		return BufferC;
	}();

	var s = window.sessionStorage;
	var Buffer;

	var Draw = new (function () {
		function _class() {
			_classCallCheck(this, _class);

			this.ctx;
			this.dataCard;
			this.from;
			this.to;
			this._interSpace;
			this._selectedRange;
			this._stage = new Set();
			this._timestamp; // wheel zoom time stamp
		}

		_createClass(_class, [{
			key: 'handleEvent',
			value: function handleEvent(event) {
				switch (event.type) {
					case 'mousemove':
						break;
					case 'mousedown':
						// console.log(event);
						// console.log(event.type, event.offsetX, event.offsetY);
						this._selectedRange = [];
						this._selectedRange[0] = event.offsetX;
						break;
					case 'mouseout':
					case 'mouseup':
						// console.log(event.type, event.offsetX, event.offsetY);
						// set range[1] after range[0] set
						// so that set only once
						1 == this._selectedRange.length && (this._selectedRange[1] = event.offsetX);
						break;
					case 'wheel':
						break;
					default:
						console.log('unknow handle:', event.type);
						return;
				}
				this.drawAction(event);
			}
		}, {
			key: 'setDataCard',
			value: function setDataCard(dataCardDiv) {
				//this.dataCard = document.getElementById(dataCardDiv);
				this.dataCard = dataCardDiv;
			}
		}, {
			key: 'setContext',
			value: function setContext(ctx) {
				this.ctx = ctx;
				// reset to normal coordinate system
				ctx.setTransform(1, 0, 0, -1, 0, this.ctx.canvas.height / 2);
				ctx.lineJoin = ctx.lineCap = 'round';
				ctx.lineWidth = 0.5;
			}
		}, {
			key: 'setScope',
			value: function setScope(from, to) {
				0 == from && to < 100 && (to = 100);
				console.log('scope', from, to);
				this.from = from;
				this.to = to;
				this._selectedRange = [];
				var interval = to - from;
				this._interSpace = this.ctx.canvas.width / interval;

				Point.setViewRange(this.ctx.canvas.height / 2);
				Buffer = new BufferC(interval + 1);
				Buffer.loadBuffer(from, to);
			}
		}, {
			key: 'drawGrid',
			value: function drawGrid(Interv) {
				Interv = Interv || 1000;
				var ctx = this.ctx;
				ctx.save();
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
				ctx.lineWidth = 0.25;
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(ctx.canvas.width, 0);
				ctx.stroke();

				ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
				ctx.beginPath();
				for (var i = Interv; i < Point.dataRange; i += Interv) {
					var y = i.toPixel();
					ctx.moveTo(0, y);
					ctx.lineTo(ctx.canvas.width, y);
					ctx.moveTo(0, -y);
					ctx.lineTo(ctx.canvas.width, -y);
				}
				ctx.stroke();
				ctx.restore();
			}
		}, {
			key: 'drawLine',
			value: function drawLine() {
				var _this = this;

				var ctx = this.ctx;

				var _loop = function _loop(dimIndex) {
					var dim = Buffer.dims[dimIndex];
					ctx.strokeStyle = Buffer.color[dim];
					ctx.beginPath();
					var i = 0;
					Buffer.data.forEach(function (point) {
						var thisAxisX = i++ * _this._interSpace;
						ctx.lineTo(thisAxisX, point[dim].toPixel());
					});
					ctx.stroke();
				};

				for (var dimIndex in Buffer.dims) {
					_loop(dimIndex);
				}
			}
		}, {
			key: 'drawData',
			value: function drawData() {
				this.dataCard.style.top = '-100px';
				var ctx = this.ctx;
				ctx.fillStyle = '#292929';
				ctx.fillRect(0, -ctx.canvas.height / 2, ctx.canvas.width, ctx.canvas.height);
				this.drawGrid();
				this.drawLine();
			}
		}, {
			key: 'drawAction',
			value: function drawAction(event) {
				var _this2 = this;

				this.drawData();
				[].concat(_toConsumableArray(this._stage)).map(function (dr) {
					return dr.call(_this2, event);
				});
			}
		}, {
			key: 'remarkPoint',
			value: function remarkPoint(index) {
				var ctx = this.ctx;
				var axisX = index * this._interSpace - 1;
				ctx.save();
				ctx.lineWidth = 1;
				ctx.beginPath();
				for (var dimIndex in Buffer.dims) {
					var _dim = Buffer.dims[dimIndex];
					ctx.strokeStyle = Buffer.color[_dim];
					ctx.strokeRect(axisX, Buffer.data[index][_dim].toPixel() - 1, 2, 2);
				}
				ctx.stroke();
				ctx.restore();
			}
		}, {
			key: 'showCard',
			value: function showCard(event) {
				var dataCard = this.dataCard;
				var index = Math.round(event.offsetX / this._interSpace);
				dataCard.innerHTML = '';
				for (var dimIndex in Buffer.dims) {
					var _dim2 = Buffer.dims[dimIndex];
					dataCard.innerHTML += '<span style="color: ' + Buffer.color[_dim2] + '">•&nbsp;</span>\n        ' + _dim2 + ': ' + Buffer.data[index][_dim2] + '<br>';
				}

				var canvasWidth = this.ctx.canvas.width;
				var cardHeight = dataCard.offsetHeight;
				var cardWidth = dataCard.offsetWidth;
				var posX = event.offsetX;
				var posY = event.offsetY - 10 - cardHeight;
				posY < 0 && (posY = 0);
				posX > canvasWidth - cardWidth - 10 ? posX = posX - cardWidth - 10 : posX += 10;
				dataCard.style.left = posX + 'px';
				dataCard.style.top = posY + 'px';
			}
		}, {
			key: 'peek',
			value: function peek(event) {
				var ctx = this.ctx;
				var canvasX = event.offsetX;
				var canvasY = -event.offsetY + ctx.canvas.height / 2;
				var index = Math.round(canvasX / this._interSpace);
				ctx.save();
				ctx.strokeStyle = '#FFF';
				ctx.lineWidth = 0.2;
				ctx.beginPath();
				// // horizontal axis
				// ctx.moveTo(0, canvasY);
				// ctx.lineTo(ctx.canvas.width, canvasY);
				// // vertical axis
				ctx.moveTo(index * this._interSpace, ctx.canvas.height / 2);
				ctx.lineTo(index * this._interSpace, -ctx.canvas.height / 2);
				ctx.stroke();
				ctx.restore();

				if (!!!Buffer.data[index]) {
					return;
				}
				this.remarkPoint(index);
				this.showCard(event);
			}
		}, {
			key: 'select',
			value: function select(event) {
				var _this3 = this;

				var range = this._selectedRange;
				if (range.length < 1 || range[0] == range[1]) return;
				var toCanvasX = function toCanvasX(x) {
					return Math.round(x / _this3._interSpace) * _this3._interSpace;
				};
				var canvasXfrom = toCanvasX(range[0]);
				var canvasXto = undefined;
				if (range.length < 2) {
					canvasXto = toCanvasX(event.offsetX);
				} else {
					canvasXto = toCanvasX(range[1]);
				}
				var ctx = this.ctx;
				ctx.save();
				ctx.lineWidth = 0.5;
				ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
				ctx.strokeStyle = '#FFF';
				ctx.beginPath();
				[ctx.fillRect, ctx.strokeRect].map(function (fn) {
					return fn.call(ctx, canvasXfrom, -ctx.canvas.height / 2, canvasXto - canvasXfrom, ctx.canvas.height);
				});
				ctx.stroke();
				ctx.restore();
			}
		}, {
			key: 'zoom',
			value: function zoom() {
				var _this4 = this;

				if (this._selectedRange.length < 2) return;
				var index = function index(x) {
					return Math.round(x / _this4._interSpace);
				};
				var indexMin = index(Math.min.apply(null, this._selectedRange));
				var indexMax = index(Math.max.apply(null, this._selectedRange));
				var from = this.from + indexMin;
				var to = this.from + indexMax;
				console.log('zoom', from, to);
				this.setScope(from, to);
				this.drawData();
			}
		}, {
			key: 'wheel',
			value: function wheel(event) {
				var _this5 = this;

				if (!event.wheelDelta) return;

				var timeThreshold = 100;
				// special: mouse wheel' wheelDelta in chrome is 120n
				// if (!(event.wheelDelta % 120)) timeThreshold = 100;

				// zoom out (ratio times), zoom in (1/ratio)
				var ratio = 1.2;
				// let index = Math.round(event.offsetX/this._interSpace) + this.from
				var canvasWidth = this.ctx.canvas.width;

				window.requestAnimationFrame(function (now) {
					if (now - _this5._timestamp < timeThreshold) return;
					_this5._timestamp = now;
					if (event.wheelDelta < 0) {
						ratio = 1 / ratio;
					} else {
						if (0 == _this5.from && s.length - 1 == _this5.to) return;
					}
					var tmp = (1 - ratio) * (_this5.to - _this5.from) / canvasWidth;
					var left = _this5.from + tmp * event.offsetX;
					var right = _this5.to - tmp * (canvasWidth - event.offsetX);
					left = left < 0 ? 0 : Math.round(left);
					right = right > s.length - 1 ? s.length - 1 : Math.round(right);

					_this5.setScope(left, right);
					_this5.drawData();
				});
			}
		}, {
			key: 'register',
			value: function register(e) {
				var _this6 = this;

				console.log('register:', e);
				var eventType = ['mousemove'];
				switch (e) {
					case 'peek':
						// eventType.push('mousemove');
						this._stage.add(this.peek);
						break;
					case 'select':
						eventType.push('mousedown');
						eventType.push('mouseup');
						eventType.push('mouseout');
						this._stage.add(this.select);
						this._selectedRange = [];
						break;
					case 'wheel':
						eventType.push('wheel');
						this._stage.add(this.wheel);
						break;
					default:
						return;
				}
				eventType.map(function (item) {
					return _this6.ctx.canvas.addEventListener(item, _this6, false);
				});
			}
		}, {
			key: 'deregister',
			value: function deregister(e) {
				var _this7 = this;

				console.log('deregister:', e);
				var eventType = [];
				switch (e) {
					case 'peek':
						// eventType.push('mousemove');
						this._stage.delete(this.peek);
						break;
					case 'select':
						eventType.push('mousedown');
						eventType.push('mouseup');
						eventType.push('mouseout');
						this._stage.delete(this.select);
						break;
					case 'wheel':
						eventType.push('wheel');
						this._stage.delete(this.wheel);
						break;
					default:
						return;
				}
				eventType.map(function (item) {
					return _this7.ctx.canvas.removeEventListener(item, _this7, false);
				});
			}
		}]);

		return _class;
	}())();

	// just a draft
	// try to build a module
	// should be replaced to an ES2015 version
	var chartClass = {
		init: function init(targetDivId, initData) {
			if (!targetDivId) return;
			var data = data || [];
			this._setTarget(targetDivId);
			this.loadData(data);
			this.setScope();
			this.draw();
		},
		// add and set html element
		_setTarget: function _setTarget(targetDivId) {
			var targetDiv = document.getElementById(targetDivId);
			var canvas = document.createElement('canvas');
			var dataCard = document.createElement('div');
			// need a random id
			// canvas.id = '';
			// dataCard.id = '';
			dataCard.setAttribute('class', 'data-card');
			var width = targetDiv.offsetWidth;
			var height = targetDiv.offsetHeight;
			canvas.width = width;
			canvas.height = height;

			targetDiv.appendChild(canvas);
			targetDiv.appendChild(dataCard);

			var ctx = canvas.getContext('2d');
			Draw.setContext(ctx);
			Draw.setDataCard(dataCard);
		},

		loadData: function loadData(data) {
			var array = data;
			// check
			array.map(function (item) {
				s.setItem(s.length, JSON.stringify(item));
			});
		},

		setScope: function setScope() {
			var from = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
			var to = arguments.length <= 1 || arguments[1] === undefined ? s.length - 1 : arguments[1];

			Draw.setScope(from, to);
		},

		register: function register(event) {
			if (typeof event === 'string') {
				event = new Array(event);
			}
			event.map(function (item) {
				Draw.register(item);
			});
		},

		deregister: function deregister(event) {
			if (typeof event === 'string') {
				event = new Array(event);
			}
			event.map(function (item) {
				Draw.deregister(item);
			});
		},

		draw: function draw() {
			Draw.drawData();
		},

		addPoint: function addPoint(point) {
			if (Draw.to >= s.length - 1) {
				Buffer.push(new Point(point));
				Draw.from = Buffer.from;
				Draw.to = Buffer.to;
				console.log('from,to', Buffer.from, Buffer.to);
				Draw.drawData();
			}
			s.setItem(s.length, JSON.stringify(point));
		},

		zoom: function zoom() {
			Draw.zoom();
		},

		reset: function reset() {
			Draw.setScope(0, s.length - 1);
			Draw.drawData();
		},

		clear: function clear() {
			s.clear();
			Draw.setScope(0, 0);
			Draw.drawData();
		}

	};

	chartClass.init(targetDivId, initData);

	return chartClass;
};