WIDTH = 4;
HEIGHT = 4;

$(function() {
	var hp = new HopfieldView();
	hp.render();
	var stored = new StoredView();
	stored.render();
	var patterns = new PatternsView();
	patterns.render();
});

var BaseView = Backbone.View.extend({
});


var HopfieldView = BaseView.extend({
	el: $('#network'),
	template: _.template($('#hopfield_tmpl').html()),
	initialize: function() {
		this.grid = new Grid(WIDTH, HEIGHT);
		this.hopfield = new HopfieldNetwork(WIDTH*HEIGHT);

		//for drawing purposes
		mouseDown = 0;
		document.body.onmousedown = function() { 
			  ++mouseDown;
		}
		document.body.onmouseup = function() {
			  mouseDown = 0;
		}

		//listen out for any pattern forgets:
		Backbone.on('forget', this.forget, this);
	},
	events: {
		'mousedown .grid': 'togglefill',
		'mouseover .grid': 'toggledraw',
		'click #clear': 'clear',
		'click #train': 'train',
		'click #recall': 'recall',
		'click #invert': 'invert'
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
	},
	recall: function() {
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
		var recall_pattern = this.hopfield.present(pattern);

		//updates the cells
		for (var i = 0; i < cells.length; i++) {
			if(recall_pattern[i] != pattern[i]) {
				if (recall_pattern[i] == 1) {
					cells[i].css('background-color', 'grey');
				} else {
					cells[i].css('background-color', 'white');
				}
			}
		}
	},
	forget: function(pattern) {
		this.hopfield.forget(pattern);
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
			//this.hopfield.train.call(this.hopfield, sequence);
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
	},
	togglefill: function(e) {
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

		//console.log(cell.css('background-color'));

	},
	toggledraw: function(e) {
		if (e.target.tagName !='TD') {
			return;
		}
		var cell = $(e.target);
		var color = cell.css('background-color');
		
		if (mouseDown) {
			if (color == 'rgb(255, 255, 255)') {
				cell.css('background-color', 'grey');
			} else {
				cell.css('background-color', 'white');
			}
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
	events: {
		'click #showhide': 'toggleMemories'
	},
	toggleMemories: function() {
		if ($('#memories').is(":hidden")) {
			$('#memories').slideDown('fast');
		} else {
			$('#memories').slideUp('fast');
		}
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
	forget: function() { //removes from the list.
		console.log('forgetting');
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

var PatternsView = BaseView.extend({
	el: $('#patterns'),
	template: _.template($('#patterns_tmpl').html()),
	initialize: function() {
	},
	render:function() {
		this.$el.html(this.template);
	}
});
