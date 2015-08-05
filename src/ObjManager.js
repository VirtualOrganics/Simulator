/**
 *
 * ellipses demo
 *
 * code: Pete Baron 2015
 *
 */

function ObjManager( docId )
{
	console.log( "ObjManager c'tor: ", docId );

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

	this.numEllipse = 150;
	this.majorAxis = 10;
	this.minorAxis = 3;
	this.maxAxis = Math.max(this.majorAxis, this.minorAxis);
	this.minAxis = Math.min(this.majorAxis, this.minorAxis);
	this.orderParameter = 0.0001;
	this.kineticEnergy = 0.0001;
	this.velocity = 1.0;
	this.pivot = 0.0;
	this.push_distance = 1.0;

	this.forceMultiplier = 0.1;
	this.damping = 35;
	this.speed_damping = 1000 - this.damping;
	this.damping_start = 2.1;
	this.damping_maximum = 4.1;
	this.repel_force = 1.1;
	this.repel_range = 0.2;
	this.attract_force = 0.9;
	this.attract_range = 2.1;

	this.showTrail = 0;
	this.areaWide = 400;
	this.areaHigh = 400;
	this.periodicBoundary = 3;
	this.boundary = 90;
	this.bgColor = "#101010";
	this.colorTrail = "#898989";
	this.colorEllipse = "#7fff7f";

	this.grapher = new Grapher();

	// dat.GUI controlled variables and callbacks
	var _this = this;
	gui.add( this, "orderParameter", 0.0, 2.0 ).listen();
	gui.add( this, "kineticEnergy" ).listen();

	var ellipseFolder = gui.addFolder( "Ellipses" );
	this.numCtrl = ellipseFolder.add( this, "numEllipse" ).min( 10 ).max( 5000 ).step( 10 ).listen();
	this.numCtrl.onFinishChange( function( value )
	{
		if ( !value ) _this.numEllipse = 1;
		_this.restartFlag = true;
	} );
	// this.velCtrl = ellipseFolder.add( this, "velocity" ).min( 0.1 ).max( 4.0 ).step( 0.01 ).listen();
	// this.velCtrl.onFinishChange( function( value )
	// {
	// 	_this.restartFlag = true;
	// } );
	this.majorCtrl = ellipseFolder.add( this, "majorAxis" ).min( 1 ).max( 30 ).step( 1 ).listen();
	this.majorCtrl.onFinishChange( function( value )
	{
		if ( !value ) _this.majorAxis = 1;
		_this.minAxis = Math.min(_this.majorAxis, _this.minorAxis);
		_this.maxAxis = Math.max(_this.majorAxis, _this.minorAxis);
		_this.restartFlag = true;
	} );
	this.minorCtrl = ellipseFolder.add( this, "minorAxis" ).min( 1 ).max( 30 ).step( 1 ).listen();
	this.minorCtrl.onFinishChange( function( value )
	{
		if ( !value ) _this.minorAxis = 1;
		_this.minAxis = Math.min(_this.majorAxis, _this.minorAxis);
		_this.maxAxis = Math.max(_this.majorAxis, _this.minorAxis);
		_this.restartFlag = true;
	} );
	var piv = ellipseFolder.add( this, "pivot" ).min( -5.0 ).max( 5.0 ).step( 0.2 );
	piv.onChange( function( value )
	{
		Ellipse.shape = null;
	} );
	ellipseFolder. add( this, "push_distance" ).min(0.0).max(5.0).step(0.1);

	var forceFolder = gui.addFolder( "Forces" );
	forceFolder.add( this, "forceMultiplier" ).min( 0.0 ).max( 2.0 ).step( 0.02 );
	var sd = forceFolder.add( this, "damping" ).min( 0 ).max( 200 ).step(1);
	sd.onFinishChange( function(value) {
		_this.speed_damping = 1000 - value;
	});
	forceFolder.add( this, "damping_start" ).min( 0.0 ).max( 10.0 ).step( 0.1 );
	forceFolder.add( this, "damping_maximum" ).min( 0.0 ).max( 10.0 ).step( 0.1 );
	var rf = forceFolder.add( this, "repel_force" ).min( 0.0 ).max( 4.0 ).step( 0.04 ).listen();
	rf.onChange( function(value) {
		_this.grapher.create(_this.forceAtRange, _this, 0, 50, 1, _this.minAxis, _this.maxAxis);
	});
	var rr = forceFolder.add( this, "repel_range" ).min( 0.0 ).max( 5.0 ).step( 0.05 ).listen();
	rr.onChange( function(value) {
		if (value > _this.attract_range ) _this.attract_range = value;
		_this.grapher.create(_this.forceAtRange, _this, 0, 50, 1, _this.minAxis, _this.maxAxis);
	});
	var af = forceFolder.add( this, "attract_force" ).min( 0.0 ).max( 5.0 ).step( 0.05 );
	af.onChange( function(value) {
		_this.grapher.create(_this.forceAtRange, _this, 0, 50, 1, _this.minAxis, _this.maxAxis);
	});
	var ar = forceFolder.add( this, "attract_range" ).min( 0.0 ).max( 5.0 ).step( 0.05 ).listen();
	ar.onChange( function(value) {
		if (value < _this.repel_range ) _this.repel_range = value;
		_this.grapher.create(_this.forceAtRange, _this, 0, 50, 1, _this.minAxis, _this.maxAxis);
	});

	var grfxFolder = gui.addFolder( "World" );
	grfxFolder.add( this, "showTrail" ).min( 0 ).max( MAX_TRAIL ).step( 5 );

	this.areaWidth = grfxFolder.add( this, "areaWide" ).min( 200 ).max( 2000 ).step( 10 ).listen();
	this.areaWidth.onFinishChange( function( value )
	{
		if ( !value ) _this.areaWide = 200;
		_this.restartFlag = true;
	} );
	this.areaHeight = grfxFolder.add( this, "areaHigh" ).min( 200 ).max( 1000 ).step( 10 ).listen();
	this.areaHeight.onFinishChange( function( value )
	{
		if ( !value ) _this.areaHigh = 200;
		_this.restartFlag = true;
	} );

	grfxFolder.add( this, "periodicBoundary",
	{
		none: 0,
		vertical: 1,
		horizontal: 2,
		both: 3
	} );

	grfxFolder.addColor( this, "bgColor" );
	grfxFolder.addColor( this, "colorTrail" );
	this.colCtrl = grfxFolder.addColor( this, "colorEllipse" ).listen();
	this.colCtrl.onChange( function( value )
	{
		Ellipse.shape = null;
	} );


	var gridFolder = gui.addFolder( "Grid" );
	gridFolder.add( this, "showGrid" );
	var gw = gridFolder.add( this, "gridWidth" ).min( 1 ).max( 50 ).step( 1 ).listen();
	gw.onFinishChange( function( value )
	{
		_this.restartFlag = true;
	} );
	var gh = gridFolder.add( this, "gridHeight" ).min( 1 ).max( 50 ).step( 1 ).listen();
	gh.onFinishChange( function( value )
	{
		_this.restartFlag = true;
	} );


	// detect mouse click for pause and drag
	document.body.onmousedown = function( e )
	{
		if ( e.clientX < _this.areaWide )
			if ( e.clientY < _this.areaHigh )
				if ( !_this.dragStart )
				{
					_this.dragStart = {
						x: e.clientX,
						y: e.clientY
					};
					_this.dragging = false;
					return;
				}
		_this.dragStart = null;
	};
	document.body.onmousemove = function( e )
	{
		if ( _this.dragStart )
		{
			var offx = e.clientX - _this.dragStart.x;
			var offy = e.clientY - _this.dragStart.y;
			if ( offx || offy )
			{
				_this.moveAll( offx, offy );
				_this.dragStart = {
					x: e.clientX,
					y: e.clientY
				};
				_this.dragging = true;
			}
		}
	};
	document.body.onmouseup = function( e )
	{
		if ( e.clientX || e.clientY ) // ignore first mouse up: clientx and y are both 0
			if ( e.clientX < _this.areaWide )
			if ( e.clientY < _this.areaHigh )
				if ( !_this.dragging )
					_this.pause = !_this.pause;
				else
				{
					_this.dragging = false;
					_this.dragStart = null;
				}
	};

	// save the context so we can undo the clipping when it changes
	console.log( "save context" );
}


ObjManager.prototype.constructor = ObjManager;


ObjManager.prototype.create = function()
{
	console.log( "ObjManager.create", this.areaWide, this.areaHigh );

	this.restartFlag = false;

	// resize the canvas
	canvas.width = this.areaWide;
	canvas.height = this.areaHigh;

	var maxRange = (this.maxAxis + this.maxAxis * this.attract_range) * 2.0;
	// grid must be bigger than the ellipse effect range
	if ( this.areaWide / this.gridWidth < maxRange * 1.2 ) this.gridWidth = Math.ceil( this.areaWide / ( maxRange * 1.2 ) );
	if ( this.areaHigh / this.gridHeight < maxRange * 1.2 ) this.gridHeight = Math.ceil( this.areaHigh / ( maxRange * 1.2 ) );
	// if grid is too large it is less effective
	if ( this.areaWide / this.gridWidth > maxRange * 4.0 ) this.gridWidth = Math.ceil( this.areaWide / ( maxRange * 4.0 ) );
	if ( this.areaHigh / this.gridHeight > maxRange * 4.0 ) this.gridHeight = Math.ceil( this.areaHigh / ( maxRange * 4.0 ) );

	this.grid = new Grid();
	// Grid.prototype.create = function(_wide, _high, _cellWide, _cellHigh, _objWide, _objHigh)
	this.grid.create( this.gridWidth, this.gridHeight, this.areaWide / this.gridWidth, this.areaHigh / this.gridHeight, this.maxAxis * this.attract_range, this.maxAxis * this.attract_range );

	this.list = [];
	for ( var i = 0; i < this.numEllipse; i++ )
	{
		var e = new Ellipse();
		var angle = Math.random() * ( Math.PI * 2.0 ) - Math.PI;
		// keep trying different locations until we find one that isn't colliding with an existing Ellipse
		var c = 0;
		while ( c < 10000 &&
			!e.create(
				this,
				Math.random() * this.areaWide, Math.random() * this.areaHigh,
				angle,
				this.majorAxis, this.minorAxis,
				this.velocity ) )
			c++;

		// if we had to give up, break the loop
		if ( c < 10000 )
			this.list[ i ] = e;
		else
			break;
	}

	console.log( "Created objects: ", this.list.length );
	this.numEllipse = this.list.length;

	// draw graph of current attract/repel forces
	this.grapher.create(this.forceAtRange, this, 0, 50, 1, this.minAxis, this.maxAxis);
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
	console.log( "ObjManager.destroy" );

	Ellipse.shape = null;
	this.list = null;
};


ObjManager.prototype.update = function()
{
	if ( this.pause )
		return;

	if ( this.restartFlag )
	{
		this.restart();
		return;
	}

	var sumV = {
		x: 0,
		y: 0
	};
	var sumC = 0;
	var totV = {
		x: 0,
		y: 0
	};

	for ( var i = 0, l = this.list.length; i < l; i++ )
	{
		var e = this.list[ i ];
		if ( e )
		{
			e.update();
			sumV.x += e.vx;
			sumV.y += e.vy;
			totV.x += Math.abs(e.vx);
			totV.y += Math.abs(e.vy);
			sumC++;
		}
	}
	this.draw();

	// calculate average normalised velocity for all objects
	this.orderParameter = Math.sqrt( sumV.x * sumV.x + sumV.y * sumV.y ) / sumC;
	// calculate average kinetic energy per object
	this.kineticEnergy = Math.sqrt( totV.x * totV.x + totV.y * totV.y ) / sumC;
};


ObjManager.prototype.moveAll = function( _dx, _dy )
{
	for ( var i = 0, l = this.list.length; i < l; i++ )
	{
		if ( this.list[ i ] )
		{
			this.list[ i ].move( _dx, _dy, true );
		}
	}
	this.draw();
};


ObjManager.prototype.circleCollide = function( e, quickExit )
{
	var who = null;

	var list = this.grid.neighbours( e, true );
	var collList = [];

	var ex = e.x - e.ax * Math.cos( e.angle ) * this.pivot;
	var ey = e.y - e.ax * Math.sin( e.angle ) * this.pivot;

	var r2 = this.maxAxis * this.maxAxis;

	for ( var i = 0, l = list.length; i < l; i++ )
	{
		var c = list[ i ];
		if ( c && c != e )
		{
			var cx = c.x - c.ax * Math.cos( c.angle ) * this.pivot;
			var cy = c.y - c.ax * Math.sin( c.angle ) * this.pivot;
			var dx = cx - ex;
			var dy = cy - ey;
			var d2 = dx * dx + dy * dy;
			if (d2 <= r2)
			{
				var d = Math.sqrt( d2 );
				var a = Math.atan2( dy, dx );

				// store collision information on the collided particles
				c.coll = {
					d: d,
					a: a,
					r: this.maxAxis
				};
				// store all collisions in the collList
				collList.push( c );

				if (quickExit)
					break;
			}
		}
	}

	return collList;
};


ObjManager.prototype.collide = function( e, quickExit )
{
	if ( this.majorAxis == this.minorAxis )
		return this.circleCollide( e );

	var list = this.grid.neighbours( e, true );
	var collList = [];

	var ex = e.x - e.ax * Math.cos( e.angle ) * this.pivot;
	var ey = e.y - e.ax * Math.sin( e.angle ) * this.pivot;

	for ( var i = 0, l = list.length; i < l; i++ )
	{
		var c = list[ i ];
		if ( c && c != e )
		{
			var cx = c.x - c.ax * Math.cos( c.angle ) * this.pivot;
			var cy = c.y - c.ax * Math.sin( c.angle ) * this.pivot;

			// more accurate system for collision detection
			if (ellipseEllipseCollide(ex, ey, e.ax * 2.0, e.by * 2.0, e.angle, cx, cy, c.ax * 2.0, c.by * 2.0, c.angle))
			{
				var dx = cx - ex;
				var dy = cy - ey;
				var d2 = dx * dx + dy * dy;
				var d = Math.sqrt( d2 );
				var a = Math.atan2( dy, dx );

				// store collision partials
				e.coll = {
					d: d,
					a: a
				};
				c.coll = {
					d: d,
					a: a - Math.PI
				};
				collList.push( c );

				if (quickExit)
					break;
			}
		}
	}

	return collList;
};


ObjManager.prototype.interact = function( e )
{
	var who = null;

	var list = this.grid.neighbours( e, true );
	var collList = [];

	var ex = e.x - e.ax * Math.cos( e.angle ) * this.pivot;
	var ey = e.y - e.ax * Math.sin( e.angle ) * this.pivot;

	// is the ellipse 'e' inside the (elliptical scaled) attract_range of any other ellipse
	for ( var i = 0, l = list.length; i < l; i++ )
	{
		var c = list[ i ];
		if ( c && c != e )
		{
			var cx = c.x - c.ax * Math.cos( c.angle ) * this.pivot;
			var cy = c.y - c.ax * Math.sin( c.angle ) * this.pivot;

			if (ellipseEllipseCollide(ex, ey, e.ax * this.attract_range, e.by * this.attract_range, e.angle, cx, cy, c.ax * this.majorAxis, c.by * this.minorAxis, c.angle))
			{
				var dx = cx - ex;
				var dy = cy - ey;
				var d2 = dx * dx + dy * dy;
				var d = Math.sqrt( d2 );
				var a = Math.atan2( dy, dx );
				var r1 = ellipseRadius( e.ax, e.by, e.angle, a );
				var r2 = ellipseRadius( c.ax, c.by, c.angle, a - Math.PI );

				// store collision partials
				// the collision point is approximated as being along the radius joining the two centres
				e.coll = {
					d: d,
					a: a,
					rm: r1, 
					rh: r2
				};
				c.coll = {
					d: d,
					a: a - Math.PI,
					rm: r2,
					rh: r1
				};
				collList.push( c );
			}
		}
	}

	return collList;
};


function ellipseRadius( ax, by, facing, angle )
{
	// find difference in angles so we can use non-rotated ellipse equations
	var t = angle - facing;
	while ( t < -Math.PI ) t += Math.PI * 2.0;
	while ( t >= Math.PI ) t -= Math.PI * 2.0;
	var s = Math.sin( t );
	var c = Math.cos( t );

	// equation from: http://math.stackexchange.com/questions/432902/how-to-get-the-radius-of-an-ellipse-at-a-specific-angle-by-knowing-its-semi-majo
	// r = (a.b) / sqrt(sqr(a).sqr(sin(theta)) + sqr(b).sqr(cos(theta)))
	var r = ax * by / Math.sqrt( ax * ax * s * s + by * by * c * c );
	return r;
}


ObjManager.prototype.forceAtRange = function(_range)
{
	var f = 0;

	if (_range < 0)
	{
		return this.repel_force;
	}

	var d;
	var rr = this.maxAxis * this.repel_range;
	if (_range < rr)
	{
		if (this.repel_range !== 0)
		{
			// d = 0 at repel_range, repel_force at range 0
			d = this.repel_force * (rr - _range) / rr;
			f += d * d * this.forceMultiplier;
		}
		else
		{
			f += this.forceMultiplier;
		}
	}
	var ar = this.maxAxis * this.attract_range;
	if (_range < ar)
	{
		// d = 0 at attract_range, attract_force at range 0
		if (this.attract_range !== 0)
		{
			d = this.attract_force * (ar - _range) / ar;
			f += -(d * d * this.forceMultiplier);
		}
		else
		{
			f += this.forceMultiplier;
		}
	}
	return f;
};


ObjManager.prototype.draw = function()
{
	ctx.fillStyle = this.bgColor;
	ctx.fillRect( 0, 0, this.areaWide, this.areaHigh );

	if ( this.showGrid )
		this.grid.draw();

	var i, l;
	if ( this.showTrail )
	{
		for ( i = 0, l = this.list.length; i < l; i++ )
		{
			if ( this.list[ i ] )
				this.list[ i ].drawTrail( ctx );
		}
	}

	for ( i = 0, l = this.list.length; i < l; i++ )
	{
		if ( this.list[ i ] )
			this.list[ i ].draw( ctx, this.showTrail );
	}
};


/**
 * Accurate Ellipse-Ellipse collision code from:
 * https://www.khanacademy.org/computer-programming/c/5567955982876672
 * by Bob Lyon
 */
var circleCircleCollide = function( x1, y1, diam1, x2, y2, diam2 )
{
	var dx = x1 - x2,
		dy = y1 - y2,
		dist2 = dx * dx + dy * dy,
		sum = ( diam1 + diam2 ) / 2;
	return dist2 <= sum * sum;
};

var rotatePoint = function( x, y, theta, sine )
{
	var cosine = theta;
	if ( sine === undefined )
	{
		cosine = Math.cos( theta );
		sine = Math.sin( theta );
	}
	return {
		x: cosine * x + sine * y,
		y: -sine * x + cosine * y
	};
};

var isInEllipse = function( x, y, ex, ey, w, h, theta, sine )
{
	x -= ex;
	y -= ey;
	if ( theta )
	{
		var rp = rotatePoint( x, y, theta, sine );
		x = rp.x;
		y = rp.y;
	}
	var termX = 2 * x / w;
	var termY = 2 * y / h;
	return termX * termX + termY * termY <= 1;
};

var ellipseEllipseCollide = function( x1, y1, w1, h1, theta1, x2, y2, w2, h2, theta2 )
{
	var realRoot = function( z4, z3, z2, z1, z0 )
	{
		if ( z0 === 0 )
		{
			return true;
		}
		if ( z4 === 0 )
		{
			if ( z3 !== 0 )
			{
				return true;
			}
			if ( z2 !== 0 )
			{
				return z1 * z1 - 4 * z2 * z0 >= 0;
			}
			return z1 !== 0;
		}
		var a = z3 / z4,
			b = z2 / z4,
			c = z1 / z4,
			d = z0 / z4;
		var p = ( 8 * b - 3 * a * a ) / 8;
		var q = ( a * a * a - 4 * a * b + 8 * c ) / 8;
		var r = ( -3 * a * a * a * a + 256 * d - 64 * c * a + 16 * a * a * b ) / 256;
		var discrim = 256 * r * r * r - 128 * p * p * r * r + 144 * p * q * q * r - 27 * q * q * q * q + 16 * p * p * p * p * r - 4 * p * p * p * q * q;
		var P = 8 * p;
		var D = 64 * r - 16 * p * p;
		return discrim < 0 || discrim > 0 && P < 0 && D < 0 || discrim === 0 && ( D !== 0 || P <= 0 );
	};
	var yIntersect = function( a, b, c, d, e, f, _a1, b1, c1, d1, e1, f1 )
	{
		var deltaB = ( b1 /= _a1 ) - ( b /= a );
		var deltaC = ( c1 /= _a1 ) - ( c /= a );
		var deltaD = ( d1 /= _a1 ) - ( d /= a );
		var deltaE = ( e1 /= _a1 ) - ( e /= a );
		var deltaF = ( f1 /= _a1 ) - ( f /= a );
		if ( deltaB === 0 && deltaD === 0 )
		{
			return realRoot( 0, 0, deltaC, deltaE, deltaF );
		}
		var a3 = b * c1 - b1 * c;
		var a2 = b * e1 + d * c1 - b1 * e - d1 * c;
		var a1 = b * f1 + d * e1 - b1 * f - d1 * e;
		var a0 = d * f1 - d1 * f;
		var A = deltaC * deltaC - a3 * deltaB;
		var B = 2 * deltaC * deltaE - deltaB * a2 - deltaD * a3;
		var C = deltaE * deltaE + 2 * deltaC * deltaF - deltaB * a1 - deltaD * a2;
		var D = 2 * deltaE * deltaF - deltaD * a1 - deltaB * a0;
		var E = deltaF * deltaF - deltaD * a0;
		return realRoot( A, B, C, D, E );
	};
	var conicsIntersect = function( el, el1 )
	{
		return yIntersect( el.a, el.b, el.c, el.d, el.e, el.f, el1.a, el1.b, el1.c, el1.d, el1.e, el1.f ) &&
			yIntersect( el.c, el.b, el.a, el.e, el.d, el.f, el1.c, el1.b, el1.a, el1.e, el1.d, el1.f );
	};
	var bivariateForm = function( x, y, width, height, A, B )
	{
		var r = rotatePoint( x, y, A, B ),
			a = r.x,
			c = r.y;
		B = -B;
		var b = width * width / 4,
			d = height * height / 4;
		return {
			a: A * A / b + B * B / d,
			b: -2 * A * B / b + 2 * A * B / d,
			c: B * B / b + A * A / d,
			d: -2 * a * A / b - 2 * c * B / d,
			e: 2 * a * B / b - 2 * c * A / d,
			f: a * a / b + c * c / d - 1
		};
	};

	if ( !circleCircleCollide( x1, y1, w1 > h1 ? w1 : h1, x2, y2, w2 > h2 ? w2 : h2 ) )
	{
		return false;
	}
	var cosine1 = Math.cos( theta1 ),
		sine1 = Math.sin( theta1 ),
		cosine2 = Math.cos( theta2 ),
		sine2 = Math.sin( theta2 );

	if ( isInEllipse( x2, y2, x1, y1, w1, h1, cosine1, sine1 ) ||
			isInEllipse( x1, y1, x2, y2, w2, h2, cosine2, sine2 ) )
	{
		return true;
	}
	var elps1 = bivariateForm( x1, y1, w1, h1, cosine1, sine1 );
	var elps2 = bivariateForm( x2, y2, w2, h2, cosine2, sine2 );
	return conicsIntersect( elps1, elps2 );
};
