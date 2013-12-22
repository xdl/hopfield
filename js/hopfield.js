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
	//number of nodes
	this.size = size;
	//weight matrix
	this._weight = Matrix.Zero(size, size);
	//number of patterns stored
	this.N = 0;
}

// debugging purposes:
HopfieldNetwork.prototype.getMatrix = function() {
	return this._weight;
}

HopfieldNetwork.prototype.getSize = function() {
	return this.size;
}


HopfieldNetwork.prototype.contributionMatrix = function(pattern) {
	var _pattern = Matrix.create(pattern);
	var _contribution = _pattern.x(_pattern.transpose());
	var _identity = Matrix.I(this.size);
	_contribution = _contribution.subtract(_identity);
	return _contribution;
}

HopfieldNetwork.prototype.train = function(pattern) {
	//contribution matrix
	var _contrib = this.contributionMatrix(pattern);
	//applying contribution matrix
	this._weight = this._weight.add(_contrib);
	this.N++;
}

HopfieldNetwork.prototype.forget = function(pattern) {
	var _contrib = this.contributionMatrix(pattern);
	this._weight = this._weight.subtract(_contrib);
	this.N--;
}

HopfieldNetwork.prototype.getEnergy = function(pattern) {
	var _pattern = Matrix.create(pattern);
	var _W_p = this._weight.x(_pattern);
	var energy = _pattern.transpose().x(_W_p);
	return -(0.5*energy.elements[0])/this.N;
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
console.log('hp.getMatrix():', hp.getMatrix());
c = hp.present([-1,1,-1,1])
d = hp.present([-1,-1,-1,1]) // good! returning fine.

var e = hp.getEnergy([-1,1,-1,1]);

console.log('e:', e);


//console.log('c:', c);
//console.log('d:', d);
