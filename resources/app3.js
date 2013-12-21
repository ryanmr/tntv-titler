// app.js

// fades a node out and hides it completely, height/display:none style
// based on http://seanmonstar.com/post/707205823/fade-and-destroy-elements
Element.implement({

	fadeout: function(duration) {
		duration = duration || 500;
		var el = this;
		this.set('morph', {duration: duration})
			.morph({opacity: 0})
			.get('morph').chain(
				function(){
					el.morph({height: 0, padding: 0, margin: 0})
					  .get('morph').chain(function(){
					  	el.setStyle('display', 'none');
					  });
				}
			);
		return this;
	}

});
// TODO: migrate to Fx.Slide method

(function(){

function create_input_panel_template() {
	var element = new Element('div', {'class': 'form-wrapper input-panel'});
	var textarea = new Element('textarea', {'cols': 70, 'rows': 20});
	var inner = new Element('div', {'class': 'form-wrapper-inner'});
	var button = new Element('button', {'text': 'Parse'});
	
	textarea.set('placeholder', 'Enter show notes here...');
	
	inner.grab(textarea);
	inner.grab(button);
	element.grab(inner);

	return element;
}

function create_output_panel_template() {
	var element = new Element('div', {'class': 'form-wrapper output-panel hidden'});
	var textarea = new Element('textarea', {'cols': 70, 'rows': 20});
	var inner = new Element('div', {'class': 'form-wrapper-inner'});
	var button = new Element('button', {'text': 'Transcribe'});
	
	var str = 'The selected titles will be transcribed into TNTV structured list-link content...';
	textarea.set('placeholder', str);
	button.set('title', str);

	inner.grab(button);	
	inner.grab(textarea);
	element.grab(inner);

	return element;
}


function create_link_container_template() {

	var container = new Element('div', {'class': 'link-container'});
	var status = new Element('div', {'class': 'status'});
	var url = new Element('div', {'class': 'url'});
	var list = new Element('div', {'class': 'urls'});

	container.grab(url).grab(status).grab(list);

	return container;
}

function create_interactive_link() {

	var container = new Element('div', {'class': 'interactive-link'});
	var input = new Element('input', {'type': 'text', 'class': 'input-link'});

	container.grab(input);

	return container;

}

function create_tntv_string(url, title) {
	var string = '<li><a href="{url}">{title}</a></li>';
	return string.substitute({url: url, title: title});
}

function domain_helper(url) {
	return url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
}

var Download = new Class({
	Implements: [Options, Events],

	initialize: function(url, options) {
		this.setOptions(options);
		this.uri = url;
		this.request = new Request.JSON({
			method: 'post',
			url: 'process.php',
			data: {type: 'fetch', url: url},
			timeout: 6.5 * 1000, 
		});

		this.request.addEvents({
			request : this._request_start.bind(this),
			success : this._request_success.bind(this),
			error   : this._request_error.bind(this),
			complete: this._request_complete.bind(this),
			timeout : this._request_timeout.bind(this)
		});

		this.element = create_link_container_template();
		this.url = this.element.getElement('.url');
		this.status = this.element.getElement('.status');
		this.list = this.element.getElement('.urls');

		this._prepare();
	},

	_prepare: function() {
		this.url.set('html', '<a href="'+this.uri+'" target="_blank">'+this.uri+'</a>');
		this.status.set('html', 'Waiting...');
	},

	start: function() {
		this.request.post();
	},

	_request_start: function() {
		this.status.set('html', 'Searching <em>' + domain_helper(this.uri) + '</em> for titles...');
		this.element.addClass('active');
		this.fireEvent('start');
	},

	_request_complete: function(json) {
		this.element.addClass('complete').removeClass('active');
		this.fireEvent('complete');
	},
	
	_request_success: function(json) {
		this.element.removeClass('warning').addClass('success');
		this.status.fadeout.delay(750, this.status);
		this.fireEvent('success');
		this._populate(json);
	},
	
	_request_error: function() {
		this.element.addClass('error').removeClass('active');
		this.status.set('html', 'There was an error while searching <em>' + domain_helper(this.uri) + '</em>...');
		this.fireEvent('error');

		var template = create_interactive_link();
		template.getElement('input').set('value', 'No Title Available').addEvents({click: this._link_click.bind(this)}).addClass('selected');

		this.list.grab(template);

	},

	_request_timeout: function() {
		this.element.addClass('timeout').addClass('warning');
		this.status.set('html', 'Taking a while...');
		this.fireEvent('timeout');
	},

	_link_click: function(event) {
		this.list.getElements('.interactive-link input').removeClass('selected');
		event.target.addClass('selected');
	},

	_populate: function(data) {

		var self = this;

		var container = this.list;
		var list = data.title.append(data.h1);

		list.each(function(title, i){

			var template = create_interactive_link();
			var input = template.getElement('input');
			input.set('value', title).addEvents({click: this._link_click.bind(this)});

			if ( 0 == i ) input.addClass('selected');
			container.grab(template);

		}, this);
		
	},



	toElement: function() {
		return this.element;
	},

});



var Orchestrator = new Class({

	Implements: [Options, Events],

	initialize: function(input_panel, output_cards, output_panel, options) {
		this.setOptions(options);

		this.input = this.input_panel = document.id(input_panel);
		this.output = this.output_cards = document.id(output_cards);
		this.output_panel = document.id(output_panel);

		this._setup();

		this.request = new Request.JSON({
			method: 'post',
			url: 'process.php', 
		});

		this.request.addEvents({
			success: this._request_success.bind(this)
		});

		this.runs = 0;

	},

	_setup: function() {

		var input_panel = create_input_panel_template();
		input_panel.getElement('button').addEvent('click', this.start.bind(this));
		this.form = input_panel.getElement('textarea');
		this.input_panel.grab(input_panel);

		var output_panel = create_output_panel_template();
		output_panel.getElement('button').addEvent('click', this._process_links.bind(this));
		this.output_panel.grab(output_panel);

		this.scroll = new Fx.Scroll(window);
	},

	start: function() {

		var delay = 1;

		if ( this.progress ) {
			this.progress.element.dispose();
			delete this.progress;
			var items = this.output.getElements('.link-container');
			items.nix({duration: 1000}, true);
			delay = 1100;
		}

		this.request.post.delay(delay, this.request, {type: 'parse', data: this.form.get('value')});

	},

	end: function() {

		console.log("Orchestrator::end");

		var output_panel = this.output_panel;
		var textarea = output_panel.getElement('textarea');
		
		output_panel.getElement('.form-wrapper').removeClass('hidden');

	},

	_process_links: function() {

		var output_cards = this.output_cards;
		var output_panel = this.output_panel;
		var textarea = output_panel.getElement('textarea'); 

		var elements = output_cards.getElements('.link-container');

		textarea.set('value', '');

		elements.each(function(element, i){

			console.log(element);

			var url = element.getElement('.url a');
			var title = element.getElement('.input-link.selected');

			var string;

			if ( title && element.hasClass('error') || element.hasClass('warning') ) {
				string = "\t<!-- " + create_tntv_string(url.get('href'), title.get('value')) + " -->";
			} else if ( title ) {
				string =  create_tntv_string(url.get('href'), title.get('value'));
			} else {
				string = "<!-- serious error -->";
			}

			textarea.set('value', textarea.get('value') + string + "\n");
			
		});

		textarea.set('value', textarea.get('value') + "<!-- " + (new Date()).toString() + " -->\n");

	},

	_request_success: function(json) {

		this.form.set.delay(1000, this.form, ['value', '']);

		var offset = 500, additional = 500;

		var pb = new ProgessBar(json.urls.length);
		this.progress = pb;

		json.urls.each(function(url){
			var download = new Download(url);

			download.addEvents({
				success: function(json) {
					pb.update();
				},
				error: function(json) {
					pb.errorAdjustSize();
					pb.update();
				}
			});

			this.output.grab(download);
			download.start.delay(offset, download);
			offset = offset + additional;
		}, this);

		$(pb).inject(this.output.getParent(), 'before');

		pb.addEvent('complete', this.end.bind(this));

		this.scroll.toElement(pb);

	},

});

var ProgessBar = new Class({

	Implements: [Options, Events],

	initialize: function(size, options) {
		this.setOptions(options);
		this.size = this._size = size;
		this.complete = 0;
		this.finished = false;
		this.percent = 0;

		this.element = new Element('div', {'class': 'progress-bar'});
		this.bar = new Element('div', {'class': 'bar'}).setStyle('width', '0%');
		this.bar.set('tween', {unit: '%'});
		this.element.grab(this.bar);
	},

	errorAdjustSize: function() {
		this.size = this.size - 1;
	},

	update: function() {
		if (this.size > this.complete) this.complete++;
		if (this.size <= this.complete && this.finished == false) {

			this.finished = true;
			this.fireEvent('complete');

		}

		this.percent = Math.ceil( (this.complete / this.size) * 100 );
		this.bar.tween('width', this.percent + "%");
		this.fireEvent('update');
	},

	toElement: function() {
		return this.element;
	},

	getElement: function() {
		return this.element;
	}


});

window.Download = Download;
window.Orchestrator = Orchestrator;
window.ProgessBar = ProgessBar;

	
})();
