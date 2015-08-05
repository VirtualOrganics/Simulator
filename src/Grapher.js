



function Grapher()
{

}

Grapher.prototype.constructor = Grapher;


Grapher.prototype.create = function(_fnc, _context, _start, _end, _step, _minRad, _maxRad)
{
	this.fnc = _fnc;
	this.fncContext = _context;

	// create a new div to put the canvases in so we can see their contents outside of the webGl window
	this.div = document.createElement('div');
	this.div.id = 'canvasDiv';
	document.body.appendChild(this.div);

	this.makeCanvas(300, 200);


	var i, v;
	var min = Number.POSITIVE_INFINITY;
	var max = Number.NEGATIVE_INFINITY;
	for(i = _start; i < _end; i += _step)
	{
		v = this.fnc.call(this.fncContext, i);
		if (v < min) min = v;
		if (v > max) max = v;
	}

	this.ctxSrc.fillStyle = "#003f00";
	this.ctxSrc.fillRect(0, 0, this.canvasSrc.width, this.canvasSrc.height);

	var scaleX = this.canvasSrc.width / (_end - _start);
	var scaleY = this.canvasSrc.height / (max - min);
	var zeroY = Math.abs(min) * scaleY;

	// draw radius lines
	this.ctxSrc.strokeStyle = "#000000";
	this.ctxSrc.beginPath();
	this.ctxSrc.moveTo(_minRad * 2.0 * scaleX, 0);
	this.ctxSrc.lineTo(_minRad * 2.0 * scaleX, this.canvasSrc.height);
	this.ctxSrc.moveTo(_maxRad * 2.0 * scaleX, 0);
	this.ctxSrc.lineTo(_maxRad * 2.0 * scaleX, this.canvasSrc.height);
	this.ctxSrc.stroke();

	// draw zero line
	this.ctxSrc.beginPath();
	this.ctxSrc.moveTo(0, zeroY);
	this.ctxSrc.lineTo(this.canvasSrc.width, zeroY);
	this.ctxSrc.stroke();

	this.ctxSrc.beginPath();
	this.ctxSrc.strokeStyle = "#ffffff";
	for(i = _start; i < _end; i += _step)
	{
		v = this.fnc.call(this.fncContext, i - _maxRad);
		this.ctxSrc.moveTo(i * scaleX, zeroY);
		this.ctxSrc.lineTo(i * scaleX, zeroY + v * scaleY);
	}
	this.ctxSrc.stroke();
};


Grapher.prototype.makeCanvas = function(_wide, _high)
{
	console.log("Grapher.makeCanvas", _wide, _high);
	// remove any old canvases
	if (this.canvasSrc)
		this.canvasSrc.parentNode.removeChild( this.canvasSrc );
	// make the source canvas
	this.canvasSrc = document.createElement('canvas');
	this.canvasSrc.width = _wide;
	this.canvasSrc.height = _high;
	this.canvasSrc.id = "canvasSrc";
	this.ctxSrc = this.canvasSrc.getContext("2d");

	// this.ctxSrc.strokeStyle = "#ffffff";
	// this.ctxSrc.font = "bold 50px Arial";
	// this.ctxSrc.fillText("test", _wide / 2, _high * 0.9, _wide);
	// this.ctxSrc.textAlign = "center";

	// append the canvas to the new div
	this.div.appendChild(this.canvasSrc);
};
