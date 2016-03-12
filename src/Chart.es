// for ((i=0;i<1000;++i));do curl "http://localhost:3000/pebble?x=$((RANDOM%3000-1500))&y=$((RANDOM%2000-1000))&z=$((RANDOM%8000-4000))";done
'use strict';
var Chart = function (targetDivId, initData) {

class Point {
	constructor(jsonP) {
		let _p = (typeof (jsonP) === 'string') ? JSON.parse(jsonP) : jsonP;
		this.x = +_p.x;
		this.y = +_p.y;
		this.z = +_p.z;
		return this;
	}
	static setViewRange(viewRange) {
		Point.viewRange = viewRange;
		Point.dataRange = 4000;
		Number.prototype.toPixel = function () {
			return (this * Point.viewRange / Point.dataRange);
		};
	}
}

class BufferC {
	constructor(size) {
		this.from = 0;
		this.to = 0;
		this.length = 0; // number now
		this.size = size;// max number
		this.data = [];
		this.dims = ['x', 'y', 'z'];
		this.color = {
			'x': 'rgb(0, 156, 255)',
			'y': 'rgb(255, 199, 0)',
			'z': 'rgb(3, 191, 30)'
		};
	}
	push(p) {
		if (! p instanceof Point) {
			console.log('not a Point object:', p);
			return;
		}
		this.data.push(p);
		++this.length;
		++this.to;
		if (this.length > this.size)
			this.shift();
	}
	pop() {
		if (0 == this.length)
			return;
		--this.length;
		--this.to;
		this.data.pop();
	}
	unshift(p) {
		if (! p instanceof Point) {
			console.log('not a Point object:', p);
			return;
		}
		this.data.unshift(p);
		++this.length;
		--this.from;
		if (this.length > this.size)
			this.pop();
	}
	shift() {
		if (0 == this.length)
			return;
		--this.length;
		++this.from;
		this.data.shift();
	}
	loadBuffer(from, to) {
		this.size = to - from + 1;
		for (let j = from;
			j < to + 1 && j < s.length;
			++j) {
			this.push(new Point(s.getItem(j)));
		}
	}
}

var s = window.sessionStorage;
var Buffer;


var Draw = new class {
	constructor() {
		this.ctx;
		this.dataCard;
		this.btn = {
			zoom: null,
			reset: null
		};
		this.from;
		this.to;
		this._interSpace;
		this._selectedRange;
		this._stage = new Set();
		this._timestamp; // wheel zoom time stamp
	}

	handleEvent(event) {
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
				(1 == this._selectedRange.length) &&
				(this._selectedRange[1] = event.offsetX);
				break;
			case 'wheel':
				break;
			default:
				console.log('unknow handle:', event.type);
				return;
		}
		this.drawAction(event);
	}

	setBtn(btn) {
		this.btn = btn;
	}

	setDataCard(dataCardDiv) {
		//this.dataCard = document.getElementById(dataCardDiv);
		this.dataCard = dataCardDiv;
	}

	setContext(ctx) {
		this.ctx = ctx;
    // reset to normal coordinate system
		ctx.setTransform(1, 0, 0, -1, 0, this.ctx.canvas.height / 2);
		ctx.lineJoin = ctx.lineCap = 'round';
		ctx.lineWidth = 0.5;
	}

	setScope(from, to) {
		(0 == from) && (to < 100) && (to = 100);
		console.log('scope', from, to);
		this.from = from;
		this.to = to;
		this._selectedRange = [];
		let interval = to - from;
		this._interSpace = this.ctx.canvas.width / interval;

		Point.setViewRange(this.ctx.canvas.height / 2);
		Buffer = new BufferC(interval + 1);
		Buffer.loadBuffer(from, to);
	}

	drawGrid(Interv) {
		Interv = Interv || 1000;
		let ctx = this.ctx;
		ctx.save();
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
		ctx.lineWidth = 0.25;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(ctx.canvas.width, 0);
		ctx.stroke();

		ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
		ctx.beginPath();
		for (let i = Interv; i < Point.dataRange; i += Interv) {
			let y = i.toPixel();
			ctx.moveTo(0, y);
			ctx.lineTo(ctx.canvas.width, y);
			ctx.moveTo(0, -y);
			ctx.lineTo(ctx.canvas.width, -y);
		}
		ctx.stroke();
		ctx.restore();
	}

	drawLine() {
		let ctx = this.ctx;
		for (let dimIndex in Buffer.dims) {
			let dim = Buffer.dims[dimIndex];
			ctx.strokeStyle = Buffer.color[dim];
			ctx.beginPath();
			let i = 0;
			Buffer.data.forEach(point => {
				let thisAxisX = (i++) * this._interSpace;
				ctx.lineTo(thisAxisX, point[dim].toPixel());
			});
			ctx.stroke();
		}
	}

	drawBtn() {
		if (this.from > 0 || this.to < s.length - 1) {
			this.btn.reset.style.display = 'inline-block';
		} else {
			this.btn.reset.style.display = 'none';
		}

		let range = this._selectedRange;
		if (range.length < 2 || range[0] == range[1]) {
			this.btn.zoom.style.display = 'none';
		} else {
			this.btn.zoom.style.bottom = '1em';
			this.btn.zoom.style.left = (range[0] + range[1]) / 2 - 25 + 'px';
			this.btn.zoom.style.display = 'inline-block';
		}
	}

	drawData() {
		this.dataCard.style.top = '-10000px';
		let ctx = this.ctx;
		ctx.fillStyle = '#292929';
		ctx.fillRect(0, -ctx.canvas.height / 2, ctx.canvas.width, ctx.canvas.height);
		this.drawGrid();
		this.drawLine();
		this.drawBtn();
	}

	drawAction(event) {
		this.drawData();
		[...this._stage].map(dr => dr.call(this, event));
	}

	remarkPoint(index) {
		let ctx = this.ctx;
		let axisX = index * this._interSpace - 1;
		ctx.save();
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let dimIndex in Buffer.dims) {
			let dim = Buffer.dims[dimIndex];
			ctx.strokeStyle = Buffer.color[dim];
			ctx.strokeRect(axisX, Buffer.data[index][dim].toPixel() - 1, 2, 2);
		}
		ctx.stroke();
		ctx.restore();
	}

	showCard(event) {
		let dataCard = this.dataCard;
		let index = Math.round(event.offsetX / this._interSpace);
		dataCard.innerHTML = '';
		for (let dimIndex in Buffer.dims) {
			let dim = Buffer.dims[dimIndex];
			dataCard.innerHTML +=
				`<span style="color: ${Buffer.color[dim]}">•&nbsp;</span>
        ${dim}: ${Buffer.data[index][dim]}<br>`;
		}

		let canvasWidth = this.ctx.canvas.width;
		let cardHeight = dataCard.offsetHeight;
		let cardWidth = dataCard.offsetWidth;
		let posX = event.offsetX;
		let posY = event.offsetY - 10 - cardHeight;
		(posY < 0) && (posY = 0);
		(posX > canvasWidth - cardWidth - 10) ? (posX = posX - cardWidth - 10) : (posX += 10);
		dataCard.style.left = posX + 'px';
		dataCard.style.top = posY + 'px';
	}

	peek(event) {
		let ctx = this.ctx;
		let canvasX = event.offsetX;
		let canvasY = - event.offsetY + ctx.canvas.height / 2;
		let index = Math.round(canvasX / this._interSpace);
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

	select(event) {
		let range = this._selectedRange;
		if (range.length < 1 || range[0] == range[1])
			return;
		let toCanvasX = x => Math.round(x / this._interSpace) * this._interSpace;
		let canvasXfrom = toCanvasX(range[0]);
		let canvasXto;
		if (range.length < 2) {
			canvasXto = toCanvasX(event.offsetX);
		} else {
			canvasXto = toCanvasX(range[1]);
		}
		let ctx = this.ctx;
		ctx.save();
		ctx.lineWidth = 0.5;
		ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
		ctx.strokeStyle = '#FFF';
		ctx.beginPath();
		[ctx.fillRect, ctx.strokeRect].map(fn => fn.call(ctx,
			canvasXfrom,
			-ctx.canvas.height / 2,
			canvasXto - canvasXfrom,
			ctx.canvas.height
		));
		ctx.stroke();
		ctx.restore();
	}

	zoom() {
		if (this._selectedRange.length < 2)
			return;
		let index = x => Math.round(x / this._interSpace);
		let indexMin = index(Math.min.apply(null, this._selectedRange));
		let indexMax = index(Math.max.apply(null, this._selectedRange));
		let from = this.from + indexMin;
		let to = this.from + indexMax;
		console.log('zoom', from, to);
		this.setScope(from, to);
		this.drawData();
	}

	wheel(event) {
		if (!event.wheelDelta) return;

		let timeThreshold = 100;
		// special: mouse wheel' wheelDelta in chrome is 120n
		// if (!(event.wheelDelta % 120)) timeThreshold = 100;

		// zoom out (ratio times), zoom in (1/ratio)
		let ratio = 1.2;
		// let index = Math.round(event.offsetX/this._interSpace) + this.from
		let canvasWidth = this.ctx.canvas.width;

		window.requestAnimationFrame((now) => {
			if (now - this._timestamp < timeThreshold) return;
			this._timestamp = now;
			if (event.wheelDelta < 0) {
				ratio = 1 / ratio;
			} else {
				if (0 == this.from && s.length - 1 == this.to) return;
			}
			let tmp = (1 - ratio) * (this.to - this.from) / canvasWidth;
			let left = this.from + tmp * (event.offsetX);
			let right = this.to - tmp * (canvasWidth - event.offsetX);
			left = (left < 0) ? 0 : Math.round(left);
			right = (right > s.length - 1) ? s.length - 1 : Math.round(right);

			this.setScope(left, right);
			this.drawData();
		});
	}

	register(e) {
		console.log('register:', e);
		let eventType = ['mousemove'];
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
		eventType.map(item =>
      this.ctx.canvas.addEventListener(item, this, false));
	}

	deregister(e) {
		console.log('deregister:', e);
		let eventType = [];
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
		eventType.map(item =>
      this.ctx.canvas.removeEventListener(item, this, false));
	}

}();

// just a draft
// try to build a module
// should be replaced to an ES2015 version
var chartClass = {
	init: function (targetDivId, initData) {
		if ( !targetDivId ) return;
		let data = data || [];
		this._setTarget(targetDivId);
		this.loadData(data);
		this.setScope();
		this.draw();
	},
	// add and set html element
	_setTarget: function (targetDivId) {
		var targetDiv = document.getElementById(targetDivId);
		var canvas = document.createElement('canvas');
		var dataCard = document.createElement('div');
		var btnZoom = document.createElement('div');
		var btnReset= document.createElement('div');
		// need a random id
		// canvas.id = '';
		// dataCard.id = '';
		dataCard.setAttribute('class', 'data-card');
		btnZoom.setAttribute('class', 'btn');
		btnReset.setAttribute('class', 'btn');
		btnZoom.innerHTML = 'zoom';
		btnReset.innerHTML = 'view all';
		btnReset.style.top = '0.5em';
		btnReset.style.left = '0.5em';

		let width = targetDiv.clientWidth;
		let height = targetDiv.clientHeight;
		canvas.width = width;
		canvas.height = height;

		targetDiv.appendChild(canvas);
		targetDiv.appendChild(dataCard);
		targetDiv.appendChild(btnZoom);
		targetDiv.appendChild(btnReset);

		var ctx = canvas.getContext('2d');
		Draw.setContext(ctx);
		Draw.setDataCard(dataCard);
		Draw.setBtn({
			zoom: btnZoom,
			reset: btnReset
		});

		btnZoom.addEventListener('click', () =>
	    this.zoom(), false);
		btnReset.addEventListener('click', () =>
		  this.reset(),false);
	},

	loadData: function (data) {
		let array = data;
		// check
		array.map(item => {
			s.setItem(s.length, JSON.stringify(item));
		});
	},

	setScope: function (from = 0, to = s.length - 1) {
		Draw.setScope(from, to);
	},

	register: function (event) {
		if (typeof (event) === 'string') {
			event = new Array(event);
		}
		event.map(item => {
			Draw.register(item);
		});
	},

	deregister: function (event) {
		if (typeof (event) === 'string') {
			event = new Array(event);
		}
		event.map(item => {
			Draw.deregister(item);
		});
	},

	draw: function () {
		Draw.drawData();
	},

	addPoint: function (point) {
		if (Draw.to >= s.length - 1) {
			Buffer.push(new Point(point));
			Draw.from = Buffer.from;
			Draw.to = Buffer.to;
			console.log('from,to', Buffer.from, Buffer.to);
			Draw.drawData();
		}
		s.setItem(s.length, JSON.stringify(point));
	},

	zoom: function () {
		Draw.zoom();
	},

	reset: function () {
		Draw.setScope(0, s.length - 1);
		Draw.drawData();
	},

	clear: function () {
		s.clear();
		this.reset();
	},

};

chartClass.init(targetDivId, initData);

return chartClass;
};
