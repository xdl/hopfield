
$(function() {
	var hp = new HopfieldView();
	hp.render();
	var stored = new StoredView();
	stored.render();
});


//some global objects
Global = {};
Global.WIDTH = 5; //default dimensions
Global.HEIGHT = 5;
Global.mouseDown = 0;
//prevents unecessary energy calculations
Global.energyUpdateRequired = false;
//required for updating the energies of the memories
//Global.hopfield; <-- created when a HopfieldView is instantiated
Global.formatNumber = function(num) {
	//is it an int?
	if (num%1 === 0) {
		return num;
	}
	//otherwise, truncate to 2dp
	else {
		return num.toFixed(2);
	}
}

var BaseView = Backbone.View.extend({
	close: function() {
		this.stopListening();
		this.unbind();

		if (this.destroy) {
			//expliciting unbinding from the global bus.
			this.destroy();
		}
	}
});

var HopfieldView = BaseView.extend({
	el: $('#network'),
	template: _.template($('#hopfield_tmpl').html()),
	initialize: function() {
		this.grid = new Grid(Global.WIDTH, Global.HEIGHT);
		this.hopfield = new HopfieldNetwork(Global.WIDTH*Global.HEIGHT);

		//other memories (patterns) need access to this to calculate their energies.
		Global.hopfield = this.hopfield;

		//for drawing purposes
		Global.mouseDown = 0;
		document.body.onmousedown = function() { 
			  ++Global.mouseDown;
		}
		document.body.onmouseup = function() {
			  Global.mouseDown = 0;
		}

		//listen out for any pattern forgets so that the weight matrix is updated:
		Backbone.on('forget', this.forget, this);

		//on store, the energy calculation also needs to be updated.
		Backbone.on('store', this.updateHPEnergy, this);
	},
	events: {
		'mousedown .grid': 'togglefill',
		'mouseover .grid': 'toggledraw',
		'click #clear': 'clear',
		'click #random': 'random',
		'click #train': 'train',
		'click #recall': 'recall',
		'click #invert': 'invert',
		'mouseup .grid': 'handleUp',
		'mouseleave .grid': 'handleLeave',
		'change input#cellwidth': 'changeDim',
		'change input#cellheight': 'changeDim'
	},
	//currently, these two are doing pretty much the same thing. Will decided whether to squash them into one later.
	changeDim: function() {
		var w = this.$el.find('#cellwidth').val();
		var h = this.$el.find('#cellheight').val();
		//validation before resetting.
		if (w%1 === 0 && w >= 1 && h%1 === 0 && h >= 1) {
			Global.WIDTH = w;
			Global.HEIGHT = h;
			this.grid.remove();
			this.grid = new Grid(w, h);
			this.hopfield = new HopfieldNetwork(w*h);
			Global.hopfield = this.hopfield;
			this.grid.appendTo(this.$el.find('#grid_holder'));

			//need to remove all the memories as well:
			Backbone.trigger('mindwipe');
			this.$el.find('.energy').html(0);
		}
	},
	handleLeave: function() {
		if (Global.energyUpdateRequired) {
			this.updateHPEnergy();
			Global.energyUpdateRequired = false;
		}
	},
	handleUp: function() {
		if (Global.energyUpdateRequired) {
			this.updateHPEnergy();
			Global.energyUpdateRequired = false;
		}
	},
	updateHPEnergy: function() {
		var pattern = this.getPattern();
		var e = this.hopfield.getEnergy(pattern);
		//precaution if nothing has been trained yet.
		if(isNaN(e)) {
			e = 0;
		}
		this.$el.find('.energy').html(Global.formatNumber(e));
	},
	//if you're still waiting for the transition to finish :/
	updateHPEnergyWithPattern: function(recall_pattern) {
		var e = this.hopfield.getEnergy(recall_pattern);
		//precaution if nothing has been trained yet.
		if(isNaN(e)) {
			e = 0;
		}
		this.$el.find('.energy').html(Global.formatNumber(e));
	},
	getPattern: function() {
		//get the pattern currently drawn:
		var cells = this.grid._cells;
		var pattern = [];
		for (var i = 0; i < cells.length; i++) {
			if (cells[i].css('background-color') == 'rgb(255, 255, 255)') {
				pattern.push(-1);
			} else {
				pattern.push(1);
			}
		}
		return pattern;
	},
	invert: function() {
		var cells = this.grid._cells;
		for (var i = 0; i < cells.length; i++) {
			if (cells[i].css('background-color') == 'rgb(255, 255, 255)') {
				cells[i].css('background-color', 'grey');
			} else {
				cells[i].css('background-color', 'white');
			}
		}


		//actually, imma comment this out. We all know that it doesn't change the energy.
		//this.updateHPEnergy();
	},
	recall: function() {
		var pattern = this.getPattern();
		var recall_pattern = this.hopfield.present(pattern);

		//updates the cells
		var cells = this.grid._cells;
		for (var i = 0; i < cells.length; i++) {
			if(recall_pattern[i] != pattern[i]) {
				if (recall_pattern[i] == 1) {
					//cells[i].css('background-color', 'grey');
					//lololol
					cells[i].animate({
						backgroundColor: 'gray'
					}, 'fast');
				} else {
					//cells[i].css('background-color', 'white');
					cells[i].animate({
						backgroundColor: 'white'
					}, 'fast');
				}
			}
		}

		this.updateHPEnergyWithPattern(recall_pattern);
	},
	forget: function(pattern) {
		this.hopfield.forget(pattern);
		this.updateHPEnergy();
	},
	train: function() {
		var sequence = [];
		var allow_train = false;
		var cells = this.grid._cells;

		for (var i = 0; i < cells.length; i++) {
			if (cells[i].css('background-color') == 'rgb(255, 255, 255)') {
				sequence.push(-1);
			} else {
				sequence.push(1);
				allow_train = true;
			}
			//reset the grid as well:
			cells[i].css('background-color', 'white');
		}

		//don't train for empty pattern:
		if (allow_train) {
			this.hopfield.train(sequence);
			//create a new memory grid:
			Backbone.trigger('store', sequence);
		}


	},
	random: function() {
		var cells = this.grid._cells;
		var pattern = [];
		for (var i = 0; i < cells.length; i++) {
			var value = Math.random() <= 0.5 ? -1 : 1;
			pattern.push(value);
			var color = cells[i].css('background-color');
			if (color == 'rgb(255, 255, 255)' && value == 1) {
				cells[i].animate({
					backgroundColor: 'gray'
				}, 'fast');
			}
			else if (color == 'rgb(128, 128, 128)' && value == -1) {
				cells[i].animate({
					backgroundColor: 'white'
				}, 'fast');
			} else {
			}
		}
		this.updateHPEnergyWithPattern(pattern);
	},
	clear: function() {
		// reset the grid:
		var cells = this.grid._cells;
		for (var i = 0; i < cells.length; i++) {
			cells[i].css('background-color', 'white');
		}
		this.updateHPEnergy();
	},
	toggle: function(e) {
		if (e.target.tagName !='TD') {
			return;
		}
		var cell = $(e.target);
		var color = cell.css('background-color');

		if (color == 'rgb(255, 255, 255)') {
			cell.css('background-color', 'grey');
		} else {
			cell.css('background-color', 'white');
		}

		Global.energyUpdateRequired = true;
	},
	togglefill: function(e) {
		this.toggle(e);
	},
	toggledraw: function(e) {
		if (Global.mouseDown) {
			this.toggle(e);
		}
	},
	
	render: function() {
		this.$el.html(this.template);
		this.grid.appendTo(this.$el.find('#grid_holder'));

		//first grid created, so this will always work:
		//this.$el.find('#grid0').addClass('main');
	}
});

var StoredView = BaseView.extend({
	el: $('#stored'),
	template: _.template($('#stored_tmpl').html()),
	initialize:function() {
		// listen for whenever we store a pattern from hopfield
		Backbone.on('store', this.store, this);
		Backbone.on('mindwipe', this.forgetAll, this);
		this.grids = [];
	},
	events: {
		'click button.forget': 'handleForget'
	},
	render: function() {
		this.$el.html(this.template);
		//hide by default
		//this.$el.find('#memories').hide();

		//caches the container:
		this.container = this.$el.find('.xscroller');
		//caches the number:
		this.count = this.$el.find('#num');
	},
	handleForget: function(e) {
		var forgets = this.$el.find('.forget');
		var index = forgets.index(e.target);
		var gridview = this.grids[index];
		var pattern = gridview.pattern;
		gridview.remove();
		gridview.close();
		this.grids.splice(index,1);
		this.count.html(this.grids.length);
		Backbone.trigger('forget', pattern);
	},
	forgetAll: function(e) {
		while (this.grids.length > 0) {
			this.grids[0].remove();
			this.grids[0].close();
			this.grids.shift();
		}
		this.count.html(0);
	},
	store: function(sequence) {
		// stores and updates it.
		this.grids.push(new GridView({
			'pattern':sequence, 
			'container': this.container
		}));

		this.count.html(this.grids.length);

		//recalculate energies
		
		for (var i = 0; i < this.grids.length; i++) {
			this.grids[i].updateHPEnergy();
		}
	}
});

var GridView = BaseView.extend({

	template: _.template($('#mem_tmpl').html()),

	initialize: function(options) {
		this.pattern = options.pattern;
		this.container =options.container;

		this.grid = new Grid(Global.WIDTH, Global.HEIGHT);
		//for plucking later.
		this.grid_id = this.grid._id;
		this.render();
		Backbone.on('forget', this.updateHPEnergy, this);
	},
	updateHPEnergy: function() {
		var e = Global.hopfield.getEnergy(this.pattern);
		this.$el.find('.energy').html(Global.formatNumber(e));
	},
	destroy: function() {
		Backbone.off('forget', this.updateHPEnergy, this);
	},
	render: function() {
		this.container.append(this.template);

		//setting the element finally:
		this.$el = this.container.children().last();
		this.el = this.$el[0];

		this.grid.appendTo(this.$el.find('.grid_holder'));

		this.grid.blit(this.pattern);
	}
});

