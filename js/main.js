WIDTH = 5;
HEIGHT = 5;

$(function() {
	var hp = new HopfieldView();
	hp.render();
	var stored = new StoredView();
	stored.render();
	//var examples = new ExamplesView();
	//examples.render();
});


//some global objects
Global = {};
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
});

var HopfieldView = BaseView.extend({
	el: $('#network'),
	template: _.template($('#hopfield_tmpl').html()),
	initialize: function() {
		this.grid = new Grid(WIDTH, HEIGHT);
		this.hopfield = new HopfieldNetwork(WIDTH*HEIGHT);

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
		'click #train': 'train',
		'click #recall': 'recall',
		'click #invert': 'invert',
		'mouseup .grid': 'handleUp',
		'mouseleave .grid': 'handleLeave'
	},
	//currently, these two are doing pretty much the same thing. Will decided whether to squash them into one later.
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

		this.updateHPEnergy();
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
		this.grids = [];
	},
	render: function() {
		this.$el.html(this.template);
		//hide by default
		//this.$el.find('#memories').hide();

		//caches the container:
		this.container = this.$el.find('.xscroller');
	},
	store: function(sequence) {
		// stores and updates it.
		this.grids.push(new GridView({
			'pattern':sequence, 
			'container': this.container
		}));

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

		this.grid = new Grid(WIDTH, HEIGHT);
		this.render();
	},
	events: {
		'click button.forget': 'forget'
	},
	updateHPEnergy: function() {
		var e = Global.hopfield.getEnergy(this.pattern);
		this.$el.find('.energy').html(Global.formatNumber(e));
	},
	forget: function() { //removes from the list.
		this.$el.remove();
		//removes it from hopfield
		Backbone.trigger('forget', this.pattern);
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

var ExamplesView = BaseView.extend({
	el: $('#examples'),
	template: _.template($('#examples_tmpl').html()),
	initialize: function() {
	},
	render:function() {
		this.$el.html(this.template);
	}
});
