/**
 *
 * Ellipse.js
 *
 * code: Pete Baron 2015
 * 
 */


Ellipse.shape = null;


function Ellipse()
{
	this.parent = null;
	this.x = 0;
	this.y = 0;
	this.angle = 0;
	this.turnAmount = 0;
	this.turnCount = 0;
	this.deflection = 0;
	this.deflectionSpeed = 0;
	this.ax = 0;
	this.by = 0;
	this.speed = 0;
	this.ignoreContact = null;
	this.vx = 0;
	this.vy = 0;
	this.trail = null;
}


/**
 * [create description]
 *
 * @return {bool} true if not colliding, false if colliding
 */
Ellipse.prototype.create = function(parent, x, y, angle, ax, by, speed)
{
	this.parent = parent;
	this.x = x;
	this.y = y;
	this.angle = angle;
	this.ax = ax;
	this.by = by;
	this.speed = speed;
	this.ignoreContact = null;
	this.vx = Math.cos(this.angle) * speed;
	this.vy = Math.sin(this.angle) * speed;
	this.trail = [];
	this.trail.unshift( {x: this.x, y: this.y} );

	// if we haven't already drawn one, draw an ellipse into the Ellipse.shape canvas
	if (!Ellipse.shape)
		Ellipse.shape = this.drawEllipse();

	var collList = this.parent.collide(this);
	if (!collList || collList.length === 0)
	{
		this.parent.grid.add(this);
		return true;
	}
	return false;
};


Ellipse.prototype.update = function()
{
	// if a something has reset the ellipse sprite, draw it again
	if (!Ellipse.shape)
		Ellipse.shape = this.drawEllipse();

	// move and update grid and trail
	this.move(this.vx, this.vy);

	// if we're interacting with other particles
	var collList = this.parent.collide(this, false);
	if (collList && collList.length > 0)
	{
		// sort collisions to deal with the biggest overlap first (smaller separating 'd' = bigger overlap)
		collList.sort(function(a, b) { return ((a.coll.d < b.coll.d) ? -1 : 1); });
		// deal with each collision
		for(var i = 0, l = collList.length; i < l; i++)
			this.collisionResponse(collList[i]);
	}

	if ((frameCount % 7) === 0 && this.parent.showTrail > 0)
	{
		// stop the trail list getting too long
		while(this.trail.length >= MAX_TRAIL)
			this.trail.pop();
		// keep track of where we've been
		this.trail.unshift( {x: this.x, y: this.y} );
	}
};


Ellipse.prototype.move = function(vx, vy, moveTrail)
{
	this.x += vx;
	this.y += vy;

	this.wrap(this);

	if (moveTrail)
	{
		for(var i = this.trail.length - 1; i >= 0; --i)
		{
			this.trail[i].x += vx;
			this.trail[i].y += vy;
			this.wrap(this.trail[i]);
		}
	}

	this.parent.grid.move(this);
};


Ellipse.prototype.wrap = function(_object)
{
	if (_object.x < 0)
	{
		if (this.parent.periodicBoundary & 2)
			_object.x += this.parent.areaWide;
		else
		{
			if (this.ignoreContact !== 2)
			{
				this.ignoreContact = 2;
				_object.turnCount = this.parent.turnSteps;
				if (this.angle < 0)
					_object.turnAmount = (this.parent.boundary * Math.PI / 180) / this.turnCount;
				else
					_object.turnAmount = -(this.parent.boundary * Math.PI / 180) / this.turnCount;
			}
			_object.x = 0;
		}
	}
	if (_object.x >= this.parent.areaWide)
	{
		if (this.parent.periodicBoundary & 2)
			_object.x -= this.parent.areaWide;
		else
		{
			if (this.ignoreContact !== 2)
			{
				this.ignoreContact = 2;
				_object.turnCount = this.parent.turnSteps;
				if (this.angle < 0)
					_object.turnAmount = -(this.parent.boundary * Math.PI / 180) / this.turnCount;
				else
					_object.turnAmount = (this.parent.boundary * Math.PI / 180) / this.turnCount;
			}
			_object.x = this.parent.areaWide - 1;
		}
	}
	if (_object.y < 0)
	{
		if (this.parent.periodicBoundary & 1)
			_object.y += this.parent.areaHigh;
		else
		{
			if (this.ignoreContact !== 1)
			{
				this.ignoreContact = 1;
				_object.turnCount = this.parent.turnSteps;
				if (this.angle < -Math.PI / 2.0)
					_object.turnAmount = -(this.parent.boundary * Math.PI / 180) / this.turnCount;
				else
					_object.turnAmount = (this.parent.boundary * Math.PI / 180) / this.turnCount;
			}
			_object.y = 0;
		}
	}
	if (_object.y >= this.parent.areaHigh)
	{
		if (this.parent.periodicBoundary & 1)
			_object.y -= this.parent.areaHigh;
		else
		{
			if (this.ignoreContact !== 1)
			{
				this.ignoreContact = 1;
				_object.turnCount = this.parent.turnSteps;
				if (this.angle >= Math.PI / 2.0)
					_object.turnAmount = (this.parent.boundary * Math.PI / 180) / this.turnCount;
				else
					_object.turnAmount = -(this.parent.boundary * Math.PI / 180) / this.turnCount;
			}
			_object.y = this.parent.areaHigh - 1;
		}
	}
};


Ellipse.prototype.collisionResponse = function(c)
{
	var a = this.coll.a;

	// apply force to both ellipses
	var force = this.parent.forceAtRange(this.coll.d);
	var pushx = Math.cos(a) * force;
	var pushy = Math.sin(a) * force;
	this.x -= pushx;
	this.y -= pushy;
	this.parent.grid.move(this);

	c.x += pushx;
	c.y += pushy;
	this.parent.grid.move(c);
};


Ellipse.prototype.turn = function()
{

};


Ellipse.prototype.drawEllipse = function()
{
	var px, py, a, r;

	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");

	ctx.canvas.width = this.ax * 2 + 2;
	ctx.canvas.height = this.by * 2 + 2;
	for(a = 0; a < Math.PI * 2; a += Math.PI * 0.01)
	{
		r = ellipseRadius(this.ax, this.by, 0, a);
		if (px === undefined)
		{
			px = Math.cos(a) * r + this.ax;
			py = Math.sin(a) * r + this.by;
			ctx.beginPath();
			ctx.moveTo(px, py);
		}
		else
		{
			px = Math.cos(a) * r + this.ax;
			py = Math.sin(a) * r + this.by;
			ctx.lineTo(px, py);
		}
	}

	ctx.closePath();
	ctx.fillStyle = this.parent.colorEllipse;
	ctx.fill();

	if (Math.min(this.ax, this.by) > 3 && this.parent.showAngles)
	{
		// draw nose and rear angles if ellipse is not tiny
		ctx.strokeStyle = "#003f3f";
		a = this.parent.nose_angle * Math.PI / 180.0;
		r = ellipseRadius(this.ax, this.by, 0, a);
		ctx.moveTo(this.ax, this.by);
		px = Math.cos(a) * r + this.ax;
		py = Math.sin(a) * r + this.by;
		ctx.lineTo(px, py);
		ctx.stroke();
		a = -this.parent.nose_angle * Math.PI / 180.0;
		r = ellipseRadius(this.ax, this.by, 0, a);
		ctx.moveTo(this.ax, this.by);
		px = Math.cos(a) * r + this.ax;
		py = Math.sin(a) * r + this.by;
		ctx.lineTo(px, py);
		ctx.stroke();
		a = Math.PI + this.parent.rear_angle * Math.PI / 180.0;
		r = ellipseRadius(this.ax, this.by, 0, a);
		ctx.moveTo(this.ax, this.by);
		px = Math.cos(a) * r + this.ax;
		py = Math.sin(a) * r + this.by;
		ctx.lineTo(px, py);
		ctx.stroke();
		a = Math.PI - this.parent.rear_angle * Math.PI / 180.0;
		r = ellipseRadius(this.ax, this.by, 0, a);
		ctx.moveTo(this.ax, this.by);
		px = Math.cos(a) * r + this.ax;
		py = Math.sin(a) * r + this.by;
		ctx.lineTo(px, py);
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(this.ax + this.ax * this.parent.pivot, this.by, 2.0, 0, Math.PI * 2.0);
		ctx.stroke();
		ctx.fillStyle = "#ffffff";
		ctx.fill();
	}

	return canvas;
};


Ellipse.prototype.draw = function(ctx, showTrail)
{
	ctx.translate(this.x, this.y);
	var turn = this.angle + this.deflection;
	ctx.rotate(turn);
	ctx.drawImage(Ellipse.shape, -this.ax - this.ax * this.parent.pivot, -this.by);
	ctx.rotate(-turn);
	ctx.translate(-this.x, -this.y);
};


Ellipse.prototype.drawTrail = function(ctx)
{
	if (this.trail.length <= 1)
		return;

	var px, py;

	for(var i = Math.min(this.trail.length, this.parent.showTrail) - 1; i >= 0; --i)
	{
		if (px === undefined)
		{
			px = this.trail[i].x;
			py = this.trail[i].y;

			ctx.strokeStyle = this.parent.colorTrail;
			ctx.lineWidth = 1.0;
			ctx.beginPath();
			ctx.moveTo(px, py);
		}
		else if (this.trail[i])
		{
			var npx = this.trail[i].x;
			var npy = this.trail[i].y;
			// don't draw lines across the screen if the ellipse wrapped around the borders
			if (Math.abs(npx - px) > this.parent.areaWide * 0.25 ||
				Math.abs(npy - py) > this.parent.areaHigh * 0.25)
				ctx.moveTo(npx, npy);
			else
				ctx.lineTo(npx, npy);
			px = npx;
			py = npy;
		}
	}
	ctx.stroke();
};

