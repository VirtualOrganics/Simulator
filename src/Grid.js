/**
 * Grid.js
 *
 * An axis aligned evenly spaced grid representation.  Each cell in the grid may hold a list of objects.
 * Objects are responsible for updating their grid occupancy by using add and remove.
 * The grid cells can be queried for their occupant list.
 * 
 * NOTE: add and remove will directly modify the parameters of the objects: gridX and gridY
 * NOTE: The neighbours function assumes that all objects are equally sized in order to speed up the 'overlap' check
 * 
 */


function Grid()
{
	this.grid = null;
	this.wide = 0;
	this.high = 0;
	this.cellWide = 0;
	this.cellHigh = 0;
	this.objWide = 0;
	this.objHigh = 0;
}


Grid.prototype.create = function(_wide, _high, _cellWide, _cellHigh, _objWide, _objHigh)
{
	this.wide = _wide;
	this.high = _high;
	this.cellWide = _cellWide;
	this.cellHigh = _cellHigh;
	this.objWide = _objWide * 2.0;
	this.objHigh = _objHigh * 2.0;

	this.grid = [];
	for(var x = 0; x < _wide; x++)
	{
		this.grid[x] = [];
		for(var y = 0; y < _high; y++)
			this.grid[x][y] = [];
	}
};


Grid.prototype.add = function(_obj, _gx, _gy)
{
	if (_gx === undefined)
		_gx = Math.floor(_obj.x / this.cellWide);
	if (_gy === undefined)
		_gy = Math.floor(_obj.y / this.cellHigh);

	if (_gx >= 0 && _gx < this.wide)
	{
		if (_gy >= 0 && _gy < this.high)
		{
			if (this.grid[_gx] && this.grid[_gx][_gy])
			{
				this.grid[_gx][_gy].push(_obj);
				_obj.gridX = _gx;
				_obj.gridY = _gy;
				return true;
			}
		}
	}
	return false;
};


Grid.prototype.remove = function(_obj, _gx, _gy)
{
	if (_gx === undefined)
		_gx = Math.floor(_obj.x / this.cellWide);
	if (_gy === undefined)
		_gy = Math.floor(_obj.y / this.cellHigh);

	if (_gx >= 0 && _gx < this.wide)
	{
		if (_gy >= 0 && _gy < this.high)
		{
			if (this.grid[_gx] && this.grid[_gx][_gy])
			{
				var i = this.grid[_gx][_gy].indexOf(_obj);
				if (i != -1)
				{
					this.grid[_gx][_gy].splice(i, 1);
					_obj.gridX = _obj.gridY = undefined;
					return true;
				}
			}
		}
	}
	return false;
};


Grid.prototype.move = function(_obj)
{
	var gx = Math.floor(_obj.x / this.cellWide);
	var gy = Math.floor(_obj.y / this.cellHigh);
	if (_obj.gridX != gx || _obj.gridY != gy)
	{
		this.remove(_obj, _obj.gridX, _obj.gridY);
		this.add(_obj, gx, gy);
		return true;
	}
	return false;
};


Grid.prototype.neighbours = function(_obj, _overlap)
{
	var list = [];

	var gx = Math.floor(_obj.x / this.cellWide);
	var gy = Math.floor(_obj.y / this.cellHigh);

	if (gx >= 0 && gx < this.wide)
	{
		if (gy >= 0 && gy < this.high)
		{
			list = this.grid[gx][gy];

			if (_overlap)
			{
				var left = false, right = false, top = false, bottom = false;
				// add contents of any neighbouring cells that could overlap far enough to touch the object
				if (gx > 0)
					if (_obj.x - this.objWide <= gx * this.cellWide)
						left = true;
				if (gx < this.wide - 1)
					if (_obj.x + this.objWide >= (gx + 1) * this.cellWide)
						right = true;
				if (gy > 0)
					if (_obj.y - this.objHigh <= gy * this.cellHigh)
						top = true;
				if (gy < this.high - 1)
					if (_obj.y + this.objHigh >= (gy + 1) * this.cellHigh)
						bottom = true;

				if (left)
				{
					list = list.concat(this.grid[gx - 1][gy]);
					// diagonals
					if (top)
						list = list.concat(this.grid[gx - 1][gy - 1]);
					if (bottom)
						list = list.concat(this.grid[gx - 1][gy + 1]);
				}
				if (right)
				{
					list = list.concat(this.grid[gx + 1][gy]);
					// diagonals
					if (top)
						list = list.concat(this.grid[gx + 1][gy - 1]);
					if (bottom)
						list = list.concat(this.grid[gx + 1][gy + 1]);
				}
				if (top)
					list = list.concat(this.grid[gx][gy - 1]);
				if (bottom)
					list = list.concat(this.grid[gx][gy + 1]);
			}
		}
	}

	return list;
};


var colourTemperatures =
[
	"#000000",
	"#600100",
	"#ae0100",
	"#f40000",
	"#ff1313",

	"#ff393a",
	"#ff5d5e",
	"#fe7273",
	"#fe8e8e",
	"#feabaa",

	"#ffbcbb",
	"#ffd7d8",
	"#fef4f4",
	"#ecfeff",
	"#9bf7fc",

	"#40eff9",
	"#12e9f8",
	"#0cdcfa",
	"#04cbfc",
	"#02baff",

	"#017dff",
	"#00002f",
	"#000070",
	"#0100c1",
	"#0008ff",

	"#0033ff"
];

Grid.prototype.draw = function()
{
	ctx.globalAlpha = 0.5;
	for(var x = 0; x < this.wide; x++)
	{
		for(var y = 0; y < this.high; y++)
		{
			var c = colourTemperatures.length - 1 - Math.min(this.grid[x][y].length, colourTemperatures.length - 1);
			if (c > 0)
			{
				ctx.fillStyle = colourTemperatures[c];
				ctx.fillRect(x * this.cellWide, y * this.cellHigh, this.cellWide - 1, this.cellHigh - 1);
			}
		}
	}
	ctx.globalAlpha = 1.0;
};

