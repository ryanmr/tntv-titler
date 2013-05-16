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
		this.url.set('html', this.uri);
		this.status.set('html', 'Waiting...');
	},

	start: function() {
		this.request.post();
	},

	_request_start: function() {
		this.status.set('html', 'Searching <em>' + domain_helper(this.uri) + '</em>...');
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
		this.status.set('html', 'There was an error while searching ' + domain_helper(this.uri) + '</em>');
		this.fireEvent('error');
	},

	_request_timeout: function() {
		this.element.addClass('timeout').addClass('warning');
		this.status.set('html', 'Taking a while...');
		this.fireEvent('timeout');
	},

	_populate: function(data) {

		var self = this;
		var container = this.list;
		var list = data.title.append(data.h1);
		var parent = this.element;
		var url = this.uri;
		list.each(function(title){
			var template = create_interactive_link();
			var input = template.getElement('input');
			var html = '<li><a href="'+url+'">'+title+'</a></li>' + "\n";
			input.set('value', title)
					.addEvents({
						focus: function() {
							this.set('value', html);
							this.select.delay(10, this);
							
						},
						blur: function() {
							this.set('value', title).addClass('picked');
							parent.addClass('interacted');
							self.fireEvent('interacted');
						}
					});
			container.grab(template);
		});
		
	},

	toElement: function() {
		return this.element;
	},

});



var Orchestrator = new Class({

	Implements: [Options, Events],

	initialize: function(form, output, options) {
		this.setOptions(options);
		this.form = document.id(form);
		this.output = document.id(output);
		this._setup();

		this.request = new Request.JSON({
			method: 'post',
			url: 'process.php', 
		});

		this.request.addEvents({
			success: this._request_success.bind(this)
		});

	},

	_setup: function() {
		this.form.set('placeholder', 'Enter show notes here...');
		this.element = new Element('div', {'class': 'form-wrapper'});
		var inner = new Element('div', {'class': 'form-wrapper-inner'}).wraps(this.form);
		var submit = new Element('button', {'text': 'Parse'}).addEvent('click', this.start.bind(this));
		inner.grab(submit);
		
		this.element.wraps(inner);

		this.scroll = new Fx.Scroll(window);
	},

	start: function() {

		var inner = this.element.getElement('.form-wrapper-inner');
		this.request.post({type: 'parse', data: this.form.get('value')});

	},

	_request_success: function(json) {

		var offset = 1000, additional = 300;

		var pb = new ProgessBar(json.urls.length);
		this.progress = pb;

		json.urls.each(function(url){
			var download = new Download(url);

			download.addEvents({
				success: function(json) {
					pb.update();
				},
				error: function(json) {
					pb.size = pb.size - 1;
					pb.update();
				}
			});

			this.output.grab(download);
			download.start.delay(offset, download);
			offset = offset + additional;
		}, this);

		$(pb).inject(this.output.getParent(), 'before');

		this.scroll.toElement(pb);

	},

});

var ProgessBar = new Class({

	Implements: [Options, Events],

	initialize: function(size, options) {
		this.setOptions(options);
		this.size = size;
		this.complete = 0;
		this.percent = 0;

		this.element = new Element('div', {'class': 'progress-bar'});
		this.bar = new Element('div', {'class': 'bar'}).setStyle('width', '0%');
		this.bar.set('tween', {unit: '%'});
		this.element.grab(this.bar);


	},

	update: function() {
		if (this.size > this.complete) this.complete++;

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


})

window.Download = Download;
window.Orchestrator = Orchestrator;
window.ProgessBar = ProgessBar;
	
})();
