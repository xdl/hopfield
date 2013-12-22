//Matrix = sylvester.Matrix;
//Vector = sylvester.Vector;

//(from the nodejs implementation)
Matrix.prototype.unroll = function() {
	var v = [];

	for(var i = 1; i <= this.cols(); i++) {
		for(var j = 1; j <= this.rows(); j++) {
		v.push(this.e(j, i));
		}
	}

	return $V(v);
}

//Modification of the unroll function to use in present()
Matrix.prototype.unrollToJSArray = function() {
	var v = [];

	for(var i = 1; i <= this.cols(); i++) {
		for(var j = 1; j <= this.rows(); j++) {
		v.push(this.e(j, i));
		}
	}

	return v;
}

//convention: use an underscore to denote a sylvester matrix variable.

function HopfieldNetwork(size) {
	this.size = size;
	this._weight = Matrix.Zero(size, size);
	console.log('hp network of size', size,'created!');
}

// debugging purposes:
HopfieldNetwork.prototype.getMatrix = function() {
	return this._weight;
}

HopfieldNetwork.prototype.getSize = function() {
	return this.size;
}

HopfieldNetwork.prototype.train = function(pattern) {
	var _contrib = constructContributionMatrix(pattern);
	this._weight = this._weight.add(_contrib);

	function constructContributionMatrix(pattern) {
		var _pattern = Matrix.create(pattern);
		var _contrib = _pattern.x(_pattern.transpose());
		_contrib = _contrib.subtract(Matrix.I(4));
		return _contrib;
	}
}

HopfieldNetwork.prototype.present = function(input) {
	var _input = Matrix.create(input);
	var result = this._weight.x(_input);

	// ultimately, we want to return an array:
	//var pattern = JSON.parse(result.unroll().inspect());
	
	//actually scrap that - this is more efficient
	var pattern = result.unrollToJSArray();

	pattern = pattern.map(function(e) {
		if (e < 0) {
			return -1;
		} else {
			return 1;
		}
	});

	return pattern;
}

var hp = new HopfieldNetwork(4);

hp.train([-1,1,-1,1])
c = hp.present([-1,1,-1,1])
d = hp.present([0,0,0,1]) // good! returning fine.

console.log('c:', c);
console.log('d:', d);
