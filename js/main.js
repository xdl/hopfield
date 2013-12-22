WIDTH = 9;
HEIGHT = 9;

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

var GridView = BaseView.extend({
});

var HopfieldView = BaseView.extend({
	el: $('#network'),
	template: _.template($('#hopfield_tmpl').html()),
	initialize: function() {
		this.grid = new Grid(WIDTH, HEIGHT);
		this.hopfield = new HopfieldNetwork(WIDTH, HEIGHT);

		mouseDown = 0;
		document.body.onmousedown = function() { 
			  ++mouseDown;
		}
		document.body.onmouseup = function() {
			  mouseDown = 0;
		}
	},
	events: {
		'mousedown .grid': 'togglefill',
		'mouseover .grid': 'toggledraw'
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
	},
	render: function() {
		this.$el.html(this.template);
		this.$el.find('#memories').hide();
	}
});

var PatternsView = BaseView.extend({
	el: $('#patterns'),
	template: _.template($('#patterns_tmpl').html()),
	initialize: function() {
		console.log('patternsview created!');
	},
	render:function() {
		this.$el.html(this.template);
	}
});

