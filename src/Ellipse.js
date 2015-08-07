/**
 *
 * Ellipse.js
 *
 * code: Pete Baron 2015
 * 
 */


Ellipse.shape = null;
Ellipse.num_angles = 0;


function Ellipse()
{
	this.parent = null;
	this.x = 0;
	this.y = 0;
	this.angle = 0;
	this.ax = 0;
	this.by = 0;
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
	this.vx = Math.cos(this.angle) * speed;
	this.vy = Math.sin(this.angle) * speed;
	this.trail = [];
	this.trail.unshift( {x: this.x, y: this.y} );

	// if we haven't already drawn one, draw an ellipse into the Ellipse.shape canvas
	if (!Ellipse.shape)
		Ellipse.shape = this.drawEllipse();

	// TODO: add overlapping checks at creation?
	this.parent.grid.add(this);
	return true;
};


Ellipse.prototype.update = function()
{
	var velocityAngle;

	// if a something has reset the ellipse sprite, draw it again
	if (!Ellipse.shape)
		Ellipse.shape = this.drawEllipse();

	// move and update grid and trail
	this.move();

	// deal with turning
	velocityAngle = Math.atan2(this.vy, this.vx);
	while(this.angle < -Math.PI) this.angle += Math.PI * 2.0;
	while(this.angle >= Math.PI) this.angle -= Math.PI * 2.0;
	this.angle = this.turnTowards(this.angle, velocityAngle, this.parent.turn_percent / 100.0);

	var actualSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
	// there's no damping if we aren't at the damping_start speed
 	if (actualSpeed > this.parent.damping_start)	
 	{
		var newSpeed;
		if (this.parent.damping_maximum === 0)
		{
			// apply full damping
			newSpeed = actualSpeed * (this.parent.speed_damping * 0.001);
		}
		else
		{
			// scale up the amount of damping as speed approaches the damping_maximum
			var s = actualSpeed - this.parent.damping_start;
			var m = this.parent.damping_maximum - this.parent.damping_start;
			var d = 1.0 - Math.min(1.0, s / m);
			var f = this.parent.speed_damping * 0.001;
			f += (1.0 - f) * d;
			newSpeed = actualSpeed * f;
		}

		this.vx = Math.cos(velocityAngle) * newSpeed;
		this.vy = Math.sin(velocityAngle) * newSpeed;
	}

	var i, l;

	// if we're colliding with other particles
	var collList = this.parent.collide(this, false);
	if (collList && collList.length > 0)
	{
		// push the particles apart to prevent overlapping forces
		// sort collisions to deal with the closest point first ('d' = distance between them)
		collList.sort(function(a, b) { return ((a.coll.d < b.coll.d) ? -1 : 1); });
		for(i = 0, l = collList.length; i < l; i++)
			this.collisionResponse(collList[i]);
	}

	// if we're interacting with other particle forces
	collList = this.parent.interact(this, false);
	if (collList && collList.length > 0)
	{
		// apply all forces
		for(i = 0, l = collList.length; i < l; i++)
			this.applyForces(collList[i]);
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


Ellipse.prototype.move = function()
{
	this.x += this.vx;
	this.y += this.vy;

	// wrap around at world edges
	this.wrap(this);

	// update grid location
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
			this.vx = Math.abs(this.vx);
			_object.x = 0;
		}
	}
	if (_object.x >= this.parent.areaWide)
	{
		if (this.parent.periodicBoundary & 2)
			_object.x -= this.parent.areaWide;
		else
		{
			this.vx = -Math.abs(this.vx);
			_object.x = this.parent.areaWide - 1;
		}
	}
	if (_object.y < 0)
	{
		if (this.parent.periodicBoundary & 1)
			_object.y += this.parent.areaHigh;
		else
		{
			this.vy = Math.abs(this.vy);
			_object.y = 0;
		}
	}
	if (_object.y >= this.parent.areaHigh)
	{
		if (this.parent.periodicBoundary & 1)
			_object.y -= this.parent.areaHigh;
		else
		{
			this.vy = -Math.abs(this.vy);
			_object.y = this.parent.areaHigh - 1;
		}
	}
};


Ellipse.prototype.collisionResponse = function(c)
{
	var once = true;
	do {
		var a = c.coll.a;

		// push the collision apart
		var force = this.parent.push_distance;
		var pushx = Math.cos(a) * force;
		var pushy = Math.sin(a) * force;
		this.x += pushx;
		this.y += pushy;
		this.parent.grid.move(this);

		c.x -= pushx;
		c.y -= pushy;
		this.parent.grid.move(c);

		if (once)
		{
			this.vx += pushx;
			this.vy += pushy;
			c.vx -= pushx;
			c.vy -= pushy;
		}

		// recalculate the separation distance after the separating move
		var dx = this.x - c.x;
		var dy = this.y - c.y;
		c.coll.d = Math.sqrt(dx * dx + dy * dy);
	} while (this.parent.minAxis * 2.0 - c.coll.d > 0);
};


Ellipse.prototype.applyForces = function(c)
{
	var a = c.coll.a;

	// calculate the distance between the surfaces of the two ellipses
	var separation = c.coll.d - (c.coll.rm + c.coll.rh);
	// apply half of the total force to each of the two ellipses
	var force = this.parent.forceAtRange(separation) * 0.5;
	if (force !== 0)
	{
		var pushx = Math.cos(a) * force;
		var pushy = Math.sin(a) * force;
		this.vx += pushx;
		this.vy += pushy;

		c.vx -= pushx;
		c.vy -= pushy;
	}
};

		// "40", "44", "48", "4c",
		// "50", "54", "58", "5c",
		// "60", "64", "68", "6c",
		// "70", "74", "78", "7c",

		// "00", "04", "08", "0c",
		// "10", "14", "18", "1c",
		// "20", "24", "28", "2c",
		// "30", "34", "38", "3c",

Ellipse.prototype.drawEllipse = function()
{
	var list = [];
	var shades = [
		// 0..PI angles
		"f0","e0","d0","c0","b0","a0","90","80","70","60","50","40","30","20","10","00",
		"00","10","20","30","40","50","60","70","80","90","a0","b0","c0","d0","e0","f0"
		// mirrored in list for the other side PI..2*PI
		];

	Ellipse.num_angles = shades.length;

	for(var i = 0; i < Ellipse.num_angles; i++)
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

		var j = i + Math.floor(Ellipse.num_angles / 2);
		if (j >= Ellipse.num_angles) j -= Ellipse.num_angles;
		if (this.parent.useEllipseColor)
			ctx.fillStyle = this.parent.colorEllipse;
		else
			ctx.fillStyle = "#" + shades[i] + "3f" + shades[j];
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

		list[i] = canvas;
		list[Ellipse.num_angles * 2 - i - 1] = canvas;
	}
	return list;
};


Ellipse.prototype.draw = function(ctx, showTrail)
{
	var turn = this.angle;
//	var velocityAngle = Math.atan2(this.vy, this.vx);
	var s = (turn / (Math.PI * 2.0)) * Ellipse.num_angles * 2.0;
	if (s < 0) s += Ellipse.num_angles * 2.0;

	ctx.translate(this.x, this.y);
	ctx.rotate(turn);
	ctx.drawImage(Ellipse.shape[Math.floor(s)], -this.ax - this.ax * this.parent.pivot, -this.by);
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


Ellipse.prototype.turnTowards = function(_angleNow, _angleDst, _turnPct)
{
	var da = _angleDst - _angleNow;
	var turn = Math.atan2(Math.sin(da), Math.cos(da));
	return _angleNow + turn * _turnPct;
};

