Grid.uid = 0;

function Grid(width, height) {
	//assign uid:
	this._id = Grid.uid++;
	this._width = width;
	this._height = height;
	this._cells = [];

	// internal storage of the arrays.
	this._internal_store = new Array(width*height);
	var is = this._internal_store;

	for (var i = 0; i < is.length; i++) {
		is[i] = -1;
	}

	var _this = this;

	this._html = getGridHTML(width, height);

	console.log('new grid created!');
 
	function getGridHTML(width, height) {

		var table_injection = '<div class="grid" id="grid' + _this._id + '">';
		table_injection += "<table>";
		for (var i = 0; i < height; i++) {
			table_injection += '<tr>'
			for (var j = 0; j < width; j++) {
				table_injection += '<td></td>'
			}
			table_injection += '</tr>'
		}
		table_injection += '</table></div>';
		return table_injection;
	}
}

Grid.prototype.appendTo = function(container) {
	var _this = this;

	container.append(this._html);
	// caches the dislay element:
	this._el = $('#grid' + this._id);

	//caches the cells:
	this._el.find('td').each(function() {
		_this._cells.push($(this));
	});
}

// puts a pattern on the grid
Grid.prototype.blit = function(pattern) {

	//needs to be the right size:
	if (pattern.length != this._internal_store.length) {
		return;
	}

	var w = this._width;
	var h = this._height;
	this._pattern = pattern;

	var len = pattern.length;

	for (var i = 0; i < len; i++) {
		this._internal_store[i] = Number(pattern[i]);
		if (Number(pattern[i])) {
			this._cells[i].css('background-color', 'grey');
		}
	}
}

// removes all the patterns
Grid.prototype.erase = function() {
	var len = this._pattern.length;
	for (var i = 0; i < len; i++) {
		this._internal_store[i] = 0;
		this._cells[i].css('background-color', 'white');
	}

}

// deletes whole grid
Grid.prototype.remove = function() {
	this._el.remove();
}

Grid.prototype.getPattern = function() {
	return this._pattern;
}

function handleOver(cell) {
	//cautionary check
	if (cell.tagName != 'TD') {
		return;
	}
	$(cell).css('background-color', 'grey');
}

