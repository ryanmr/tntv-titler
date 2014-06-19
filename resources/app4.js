



(function() {

	function create_input_panel_template() {
		var element = new Element('div', {'class': 'form-wrapper input-panel'});
		var textarea = new Element('textarea', {'cols': 70, 'rows': 20});
		var inner = new Element('div', {'class': 'form-wrapper-inner'});
		var button = new Element('button', {'text': 'Transcribe'});
		
		textarea.set('placeholder', 'Enter show notes here...');
		
		inner.grab(textarea);
		inner.grab(button);
		element.grab(inner);

		return element;
	}

	function create_output_panel_template() {
		var element = new Element('div', {'class': 'form-wrapper output-panel'});
		var editor = new Element('div', {'class': 'editor', 'cols': 70, 'rows': 20, 'contenteditable': true});
		var inner = new Element('div', {'class': 'form-wrapper-inner'});
		// var button = new Element('button', {'text': 'Transcribe'});
		
		// button.set('title', str);

		// inner.grab(button);
		inner.grab(editor);
		element.grab(inner);

		return element;
	}



var Parser = new Class({

	Implements: [Options, Events],

	initialize: function(options) {
		this.setOptions(options);

		this.regex = /(^#.*)|((?:http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,4}(?:\/\S*)?)/gim;

	},

	parse: function(string) {
		// console.log(string);

		var matches = string.match(this.regex);
		// console.log(matches);

		return matches;

	},

	digest: function(matches) {

		var section_template = {
			name: 'Links',
			links: []
		};
		var section_zero = Object.clone(section_template);


		var sections = [];
		var current_section = section_zero;
		sections.push(current_section);


		matches.each(function(match, i){

			match = match.trim();

			if ( this.is_header(match) ) {

				current_section = Object.clone(section_template);
				current_section.name = this.format_header(match);
				sections.push(current_section);

			} else if ( this.is_url(match) ) {
				
				current_section.links.push(match);

			}


		}, this);



		return sections;

	},

	is_url: function(string) {
		return string.contains('://');
	},

	is_header: function(string) {
		return string.contains('#');
	},

	format_header: function(string) {
	  if ( string.charAt(0) == '#' ) {
	    string = string.substring(1);
	  }
	  if ( string.charAt(string.length-1) == ':' ) {
	    string = string.substring(0, string.length - 1);
	  }
	  return string;
	},



	no: 1,

});

var NoteLink = new Class({

	Implements: [Options, Events],

	initialize: function(url, options) {
		this.setOptions(options);
		this.url = url;
		this.wrapper = new Element('li', {'class': 'note-link-wrapper'});

		this._setup();

	},

	_setup: function() {

		var html = '<span class="tag">&lt;li&gt;</span><span class="unit anchor"><span class="tag">&lt;a href="</span><a class="click">{item}</a>"<span class="tag">&gt;</span><span class="text">&nbsp;</span><span class="tag">&lt;/a&gt;</span></span><span class="tag">&lt;/li&gt;</span>';
		html = html.substitute({item: this.url});
		this.wrapper.appendHTML(html);

		this.wrapper.getElement('.click').addEvent('dblclick', this._link_dblclick.bind(this));

	},

	_link_dblclick: function(event){
		var url = event.target.get('text');
		window.open(url, '_blank');
		event.stop();
	},

	getElement: function() {
		return this.wrapper;
	}


});

var NoteSection = new Class({

	Implements: [Options, Events],

	initialize: function(section, options) {
		this.setOptions(options);	
		this.section = section;
		this.wrapper = new Element('div', {'class': 'note-section-wrapper'});

		this._setup();

	},

	_setup: function() {
		var header = '<span class="tag">&lt;h3&gt;</span><span class="unit header">{header}</span><span class="tag">&lt;/h3&gt;</span><br />';
		header = header.substitute({header: this.section.name});
		this.wrapper.appendHTML(header);

		this.wrapper.appendHTML('<span class="tag">&lt;ul&gt;</span><br />');


		var list = new Element('ul');
		this.section.links.each(function(link, i){

			var note_link = new NoteLink(link);

			list.grab(note_link.getElement());


		}, this);

		this.wrapper.grab(list);

		this.wrapper.appendHTML('<span class="tag">&lt;/ul&gt;</span><br /><br />');

	},

	getElement: function() {
		return this.wrapper;
	},

	no: 1
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

		this.parser = new Parser();
		// this.data = null;
		this.sections = [];

	},

	_setup: function() {

		var input_panel = create_input_panel_template();
		input_panel.getElement('button').addEvent('click', this.start.bind(this));
		this.form = input_panel.getElement('textarea');
		this.input_panel.grab(input_panel);

		var output_panel = create_output_panel_template();
		this.output_panel.grab(output_panel);

		this.scroll = new Fx.Scroll(window);
	},

	start: function() {

		// var delay = 1;

		// if ( this.progress ) {
		// 	this.progress.element.dispose();
		// 	delete this.progress;
		// 	var items = this.output.getElements('.link-container').nix({duration: 1000}, true);
		// 	delay = 1100;

		// 	// also clean up output panel

		// 	this.output_panel.getElement('.form-wrapper').addClass('hidden');
		// 	// this.output_panel.getElement('textarea').set('value', '');

		// }

		var content = this.input_panel.getElement('textarea').get('value');
		var matches = this.parser.parse(content);
		var sections = this.parser.digest(matches);

		this.populate(sections);
		// console.log(thsisections);

		// this.request.post.delay(delay, this.request, {type: 'parse', data: this.form.get('value')});

	},

	populate: function(sections) {
		sections.each(function(section, i){
			var note_section = new NoteSection(section);
			this.sections.push(note_section);
			this.output_panel.getElement('.editor').grab(note_section.getElement());
		}, this);
	},

	end: function() {

		var output_panel = this.output_panel;
		// var textarea = output_panel.getElement('textarea');
		
		output_panel.getElement('.form-wrapper').removeClass('hidden');

	},

	_process_links: function() {

		var output_cards = this.output_cards;
		var output_panel = this.output_panel;
		var textarea = output_panel.getElement('textarea'); 

		var elements = output_cards.getElements('.link-container');

		textarea.set('value', '');

		elements.each(function(element, i){

			var link = element.getElement('.url a');
			var input = element.getElement('.input-link.selected');

			var url = link.get('href');

			var string;

			if ( input ) {
				string = create_tntv_string(url, input.get('value'));
			} else if ( input == null ) {
				string = "\t<!-- " + create_tntv_string(url, 'Title Not Available') + " -->";
			} else {
				string = "<!-- serious error -->";
			}

			textarea.set('value', textarea.get('value') + string + "\n");
			
		});

		textarea.set('value', textarea.get('value') + "\n\n<!-- " + (new Date()).toString() + " -->\n");

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

// window.Download = Download;
window.Orchestrator = Orchestrator;
window.ProgessBar = ProgessBar;
window.NoteSection = NoteSection;


})();