/**
 *
 * ellipses demo
 *
 * code: Pete Baron 2015
 * 
 */

function ObjManager( docId )
{
	console.log("ObjManager c'tor: ", docId);

	demoContext = this;
	createFnc = this.create;
	drawFnc = this.update;

	this.pause = false;
	this.dragStart = null;
	this.dragging = false;
	this.restartFlag = false;
	this.list = null;
	this.grid = null;
	this.showGrid = false;
	this.gridWidth = 15;
	this.gridHeight = 15;

	this.numEllipse = 1300;
	this.orderParameter = 0.0001;
	this.velocity = 0.7;
	this.forceMultiplier = 4.0;
	this.nose_angle = 30.0;
	this.rear_angle = 30.0;
	this.nose_nose = 45;
	this.nose_side = 30;
	this.nose_rear = 0;
	this.side_nose = 30;
	this.side_side = 30;
	this.side_rear = 30;
	this.rear_nose = 30;
	this.rear_side = 30;
	this.rear_rear = 30;
	this.turnSteps = 15;
	this.turnForever = true;
	this.bounce = false;
	this.majorAxis = 6;
	this.minorAxis = 3;
	this.showTrail = 5;
	this.areaWide = 640;
	this.areaHigh = 500;
	this.periodicBoundary = 3;
	this.boundary = 90;
	this.bgColor = "#101010";
	this.colorTrail = "#898989";
	this.colorEllipse = "#00af9a";

	// dat.GUI controlled variables and callbacks
	var _this = this;
	gui.add(this, "orderParameter", 0.0, 2.0).listen();

	var ellipseFolder = gui.addFolder("Ellipses");
	this.numCtrl = ellipseFolder.add(this, "numEllipse").min(10).max(5000).step(10).listen();
	this.numCtrl.onFinishChange(function(value) { if (!value) _this.numEllipse = 1; _this.restartFlag = true; });
	this.velCtrl = ellipseFolder.add(this, "velocity").min(0.1).max(2.0).step(0.01).listen();
	this.velCtrl.onFinishChange(function(value) { _this.restartFlag = true; });
	ellipseFolder.add(this, "forceMultiplier").min(0).max(10).step(0.1);
	this.majorCtrl = ellipseFolder.add(this, "majorAxis").min(1).max(30).step(1).listen();
	this.majorCtrl.onFinishChange(function(value) { if (!value) _this.majorAxis = 1; _this.restartFlag = true; });
	this.minorCtrl = ellipseFolder.add(this, "minorAxis").min(1).max(30).step(1).listen();
	this.minorCtrl.onFinishChange(function(value) { if (!value) _this.minorAxis = 1; _this.restartFlag = true; });

	var collideFolder = gui.addFolder("Angles and Turns");
	this.noseAngleCtrl = collideFolder.add(this, "nose_angle").min(0).max(180).step(1).listen();
	this.noseAngleCtrl.onChange(function(value) { Ellipse.shape = null; });
	this.rearAngleCtrl = collideFolder.add(this, "rear_angle").min(0).max(180).step(1).listen();
	this.rearAngleCtrl.onChange(function(value) { Ellipse.shape = null; });

	collideFolder.add(this, "boundary").min(-180).max(180).step(1);
	collideFolder.add(this, "nose_nose").min(-180).max(180).step(1);
	collideFolder.add(this, "nose_side").min(-180).max(180).step(1);
	collideFolder.add(this, "nose_rear").min(-180).max(180).step(1);
	collideFolder.add(this, "side_nose").min(-180).max(180).step(1);
	collideFolder.add(this, "side_side").min(-180).max(180).step(1);
	collideFolder.add(this, "side_rear").min(-180).max(180).step(1);
	collideFolder.add(this, "rear_nose").min(-180).max(180).step(1);
	collideFolder.add(this, "rear_side").min(-180).max(180).step(1);
	collideFolder.add(this, "rear_rear").min(-180).max(180).step(1);
	collideFolder.add(this, "turnSteps").min(1).max(60).step(1);
	collideFolder.add(this, "turnForever");
	collideFolder.add(this, "bounce");

	var grfxFolder = gui.addFolder("World");
	grfxFolder.add(this, "showTrail").min(0).max(MAX_TRAIL).step(5);

	this.areaWidth = grfxFolder.add(this, "areaWide").min(200).max(2000).step(10).listen();
	this.areaWidth.onFinishChange(function(value) { if (!value) _this.areaWide = 200; _this.restartFlag = true; });
	this.areaHeight = grfxFolder.add(this, "areaHigh").min(200).max(1000).step(10).listen();
	this.areaHeight.onFinishChange(function(value) { if (!value) _this.areaHigh = 200; _this.restartFlag = true; });

	grfxFolder.add(this, "periodicBoundary", { none:0, vertical:1, horizontal:2, both:3 });

	grfxFolder.addColor(this, "bgColor");
	grfxFolder.addColor(this, "colorTrail");
	this.colCtrl = grfxFolder.addColor(this, "colorEllipse").listen();
	this.colCtrl.onChange(function(value) { Ellipse.shape = null; });

	var gridFolder = gui.addFolder("Grid");
	gridFolder.add(this, "showGrid");
	var gw = gridFolder.add(this, "gridWidth").min(1).max(50).step(1);
	gw.onFinishChange(function(value) { _this.restartFlag = true; });
	var gh = gridFolder.add(this, "gridHeight").min(1).max(50).step(1);
	gh.onFinishChange(function(value) { _this.restartFlag = true; });

    // detect mouse click for pause and drag
	document.body.onmousedown = function(e) {
		if (e.clientX < _this.areaWide)
			if (e.clientY < _this.areaHigh)
				if (!_this.dragStart)
				{
					_this.dragStart = { x: e.clientX, y: e.clientY };
					_this.dragging = false;
					return;
				}
		_this.dragStart = null;
	};
	document.body.onmousemove = function(e) {
		if (_this.dragStart)
		{
			var offx = e.clientX - _this.dragStart.x;
			var offy = e.clientY - _this.dragStart.y;
			if (offx || offy)
			{
				_this.moveAll(offx, offy);
				_this.dragStart = { x: e.clientX, y: e.clientY };
				_this.dragging = true;
			}
		}
	};
	document.body.onmouseup = function(e) {
		if (e.clientX || e.clientY)	// ignore first mouse up: clientx and y are both 0
			if (e.clientX < _this.areaWide)
				if (e.clientY < _this.areaHigh)
					if (!_this.dragging)
						_this.pause = !_this.pause;
					else
					{
						_this.dragging = false;
						_this.dragStart = null;
					}
	};

	// save the context so we can undo the clipping when it changes
	console.log("save context");
}


ObjManager.prototype.constructor = ObjManager;


ObjManager.prototype.create = function()
{
	console.log("ObjManager.create", this.areaWide, this.areaHigh);

	this.restartFlag = false;

	// resize the canvas
	canvas.width = this.areaWide;
	canvas.height = this.areaHigh;

	var max = Math.max(this.minorAxis, this.majorAxis);
	this.grid = new Grid();
	this.grid.create(this.gridWidth, this.gridHeight, this.areaWide / this.gridWidth, this.areaHigh / this.gridHeight, max, max);

	this.list = [];
	for(var i = 0; i < this.numEllipse; i++)
	{
		var e = new Ellipse();
		var angle = Math.random() * (Math.PI * 2.0);
		// keep trying different locations until we find one that isn't colliding with an existing Ellipse
		var c = 0;
		while( c < 10000 &&
				!e.create(
					this,
					Math.random() * this.areaWide, Math.random() * this.areaHigh,
					angle,
					this.majorAxis, this.minorAxis,
					this.velocity) )
			c++;

		// if we had to give up, break the loop
		if (c < 10000)
			this.list[i] = e;
		else
			break;
	}

	console.log("Created objects: ", this.list.length);
	this.numEllipse = this.list.length;
};


ObjManager.prototype.destroy = function()
{
	this.list = null;
};


ObjManager.prototype.restart = function()
{
	this.destroy();
	this.create();
};


ObjManager.prototype.destroy = function()
{
	console.log("ObjManager.destroy");

	Ellipse.shape = null;
	this.list = null;
};


ObjManager.prototype.update = function()
{
	if (this.pause)
		return;

	if (this.restartFlag)
	{
		this.restart();
		return;
	}

	var sumV = { x: 0, y:0 };
	var sumC = 0;

	for(var i = 0, l = this.list.length; i < l; i++)
	{
		var e = this.list[i];
		if (e)
		{
			e.update();
			sumV.x += e.vx;
			sumV.y += e.vy;
			sumC++;
		}
	}
	this.draw();

	// calculate average normalised velocity for all objects
	this.orderParameter = Math.sqrt(sumV.x * sumV.x + sumV.y * sumV.y) / sumC;
};


ObjManager.prototype.moveAll = function(_dx, _dy)
{
	for(var i = 0, l = this.list.length; i < l; i++)
	{
		if (this.list[i])
		{
			this.list[i].move(_dx, _dy, true);
		}
	}
	this.draw();
};


ObjManager.prototype.collide = function(e)
{
	var who = null;

	var list = this.grid.neighbours(e, true);
	var collList = [];

	for(var i = 0, l = list.length; i < l; i++)
	{
		var c = list[i];
		if (c && c != e)
		{
			// circular range check first (quick reject)
			var dx = c.x - e.x;
			var dy = c.y - e.y;
			var d2 = dx * dx + dy * dy;
			var s2 = (e.ax + c.ax) * (e.ax + c.ax);
			if (d2 <= s2)
			{
				// the circles touch
				var d = Math.sqrt(d2);
				var a = Math.atan2(dy, dx);
				var r1 = ellipseRadius(e.ax, e.by, e.angle, a - Math.PI);
				var r2 = ellipseRadius(c.ax, c.by, c.angle, a);

				// do the ellipses actually touch?
				// (approximation uses distance < radius1 + radius2)
				// this can give incorrect results because the radius may not pass through the point of contact for ellipse collisions
				if (d <= r1 + r2)
				{
					// store collision partials
					e.coll = { d: d, a: a, r1: r1, r2: r2 };
					collList.push(c);
				}
			}
		}
	}
	
	return collList;
};


function ellipseRadius(ax, by, facing, angle)
{
	// find difference in angles so we can use non-rotated ellipse equations
	var t = angle - facing;
	while (t < -Math.PI) t += Math.PI * 2.0;
	while (t >= Math.PI) t -= Math.PI * 2.0;
	var s = Math.sin(t);
	var c = Math.cos(t);

	// equation from: http://math.stackexchange.com/questions/432902/how-to-get-the-radius-of-an-ellipse-at-a-specific-angle-by-knowing-its-semi-majo
	// r = (a.b) / sqrt(sqr(a).sqr(sin(theta)) + sqr(b).sqr(cos(theta)))
	var r = ax * by / Math.sqrt(ax * ax * s * s + by * by * c * c);
	return r;
}


ObjManager.prototype.draw = function()
{
	ctx.fillStyle = this.bgColor;
	ctx.fillRect(0, 0, this.areaWide, this.areaHigh);

	if (this.showGrid)
		this.grid.draw();

	var i, l;
	if (this.showTrail)
	{
		for(i = 0, l = this.list.length; i < l; i++)
		{
			if (this.list[i])
				this.list[i].drawTrail(ctx);
		}
	}

	for(i = 0, l = this.list.length; i < l; i++)
	{
		if (this.list[i])
			this.list[i].draw(ctx, this.showTrail);
	}
};
