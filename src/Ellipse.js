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
	this.turnAmount = 0;
	this.turnCount = 0;
	this.deflection = 0;
	this.deflectionSpeed = this.parent.deflectionSpeed * Math.PI / 180;
	this.ax = ax;
	this.by = by;
	this.speed = speed;
	this.ignoreContact = null;
	this.vx = Math.cos(angle) * speed;
	this.vy = Math.sin(angle) * speed;
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
	// if a color change (or something else) reset the ellipse sprite, draw it again
	if (!Ellipse.shape)
		Ellipse.shape = this.drawEllipse();

	this.move(this.vx, this.vy);

	// if we're colliding
	var collList = this.parent.collide(this, false);
	if (collList && collList.length > 0)
	{
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

	if (this.deflectionSpeed !== 0)
	{
		this.deflection += this.deflectionSpeed;
		while(this.deflection >= Math.PI) this.deflection -= Math.PI * 2.0;
		while(this.deflection < -Math.PI) this.deflection += Math.PI * 2.0;
	}

	// turn if we're still turning
	if (this.turnCount > 0 || this.parent.turnForever)
	{
		this.angle += this.turnAmount;
		while(this.angle >= Math.PI) this.angle -= Math.PI * 2.0;
		while(this.angle < -Math.PI) this.angle += Math.PI * 2.0;
		this.vx = Math.cos(this.angle) * this.speed;
		this.vy = Math.sin(this.angle) * this.speed;
		if (!this.parent.turnForever && --this.turnCount === 0)
		{
			this.ignoreContact = null;
		}
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

	if (this.parent.bounce)
	{
		this.angle = a - Math.PI;
		c.angle = a;
	}

	// push the collision apart
	var force = this.parent.forceMultiplier;
	var pushx = Math.cos(a) * force;
	var pushy = Math.sin(a) * force;
	this.x -= pushx;
	this.y -= pushy;
	c.x += pushx;
	c.y += pushy;

	this.parent.grid.move(this);
	this.parent.grid.move(c);

	if (this.ignoreContact != c && c.ignoreContact != this)
	{
		// find point of contact angle on me
		var da = a - this.angle;
		while(da >= Math.PI) da -= Math.PI * 2.0;
		while(da < -Math.PI) da += Math.PI * 2.0;

		// find point of contact on 'c'
		var ca = a + Math.PI - c.angle;
		while(ca >= Math.PI) ca -= Math.PI * 2.0;
		while(ca < -Math.PI) ca += Math.PI * 2.0;

		this.turn(da, ca);
		c.turn(ca, da);

		// ignore further contacts until the turn has ended or we touch something else
		this.ignoreContact = c;
		c.ignoreContact = this;
	}
};


Ellipse.prototype.turn = function(_angle, _otherAngle)
{
	// turn and recalculate velocity components

	var ra = _angle - Math.PI;
	while(ra < -Math.PI) ra += Math.PI * 2.0;

	var rao = _otherAngle - Math.PI;
	while(rao < -Math.PI) rao += Math.PI * 2.0;

	var myRegion = this.classifyAngle(_angle, ra);
	var otherRegion = this.classifyAngle(_otherAngle, rao);

	this.turnCount = this.parent.turnSteps;

	if (myRegion == 1)								// nose
	{
		if (otherRegion == 1)			// nose-to-nose
			this.turnAmount = (_angle > 0 ? -this.parent.nose_nose * Math.PI / 180 : this.parent.nose_nose * Math.PI / 180) / this.turnCount;
		else if (otherRegion == 2)		// nose-to-rear
			this.turnAmount = (_angle > 0 ? -this.parent.nose_rear * Math.PI / 180 : this.parent.nose_rear * Math.PI / 180) / this.turnCount;
		else 							// nose-to-side (or unclassified)
			this.turnAmount = (_angle > 0 ? -this.parent.nose_side * Math.PI / 180 : this.parent.nose_side * Math.PI / 180) / this.turnCount;
		this.deflectionSpeed = this.parent.deflectionSpeed * Math.PI / 180 * -Math.sign(_angle);
	}
	else if (myRegion == 2)							// rear
	{
		if (otherRegion == 1)			// rear-to-nose
			this.turnAmount = (ra > 0 ? -this.parent.rear_nose * Math.PI / 180 :  this.parent.rear_nose * Math.PI / 180) / this.turnCount;
		else if (otherRegion == 2)		// rear-to-rear
			this.turnAmount = (ra > 0 ? -this.parent.rear_rear * Math.PI / 180 :  this.parent.rear_rear * Math.PI / 180) / this.turnCount;
		else 							// rear-to-side (or unclassified)
			this.turnAmount = (ra > 0 ? -this.parent.rear_side * Math.PI / 180 :  this.parent.rear_side * Math.PI / 180) / this.turnCount;
		this.deflectionSpeed = this.parent.deflectionSpeed * Math.PI / 180 * -Math.sign(ra);
	}
	else if (myRegion == 3 || myRegion === 0)		// side or unclassified
	{
		if (otherRegion == 1)			// side-to-nose
			this.turnAmount = (_angle > 0 ? -this.parent.side_nose * Math.PI / 180 : this.parent.side_nose * Math.PI / 180) / this.turnCount;
		else if (otherRegion == 2)		// side-to-rear
			this.turnAmount = (_angle > 0 ? -this.parent.side_rear * Math.PI / 180 : this.parent.side_rear * Math.PI / 180) / this.turnCount;
		else 							// side-to-side (or unclassified)
			this.turnAmount = (_angle > 0 ? -this.parent.side_side * Math.PI / 180 : this.parent.side_side * Math.PI / 180) / this.turnCount;
		this.deflectionSpeed = this.parent.deflectionSpeed * Math.PI / 180 * -Math.sign(_angle);
	}
};


/**
 * [classifyAngle description]
 *
 * @param  {[type]} _angle [description]
 *
 * @return {Number} 0 = unclassified, 1 = nose, 2 = rear, 3 = side
 */
Ellipse.prototype.classifyAngle = function(_angle, _rearAngle)
{	
	var nose = this.parent.nose_angle * Math.PI / 180;
	var rear = this.parent.rear_angle * Math.PI / 180;

	if (_angle > -nose && _angle < nose)
	{
		return 1;
	}
	else
	{
		if (_rearAngle > -rear && _rearAngle < rear)
			return 2;
		else
			return 3;
	}
	return 0;
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

	if (Math.min(this.ax, this.by) > 3)
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
	}

	return canvas;
};


Ellipse.prototype.draw = function(ctx, showTrail)
{
	ctx.translate(this.x, this.y);
	var turn = this.angle + this.deflection;
	ctx.rotate(turn);
	ctx.drawImage(Ellipse.shape, -this.ax, -this.by);
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

