
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

		inner.grab(editor);
		element.grab(inner);

		return element;
	}

	// via http://stackoverflow.com/a/1054862
	function to_slug(string) {
		return string.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
	}

	function to_domain(url) {
		return url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
	}

	function remove_comments(string) {
		return string.replace(/\s*(?:\/\/)+.*/gim, '');
	}


var Parser = new Class({

	Implements: [Options, Events],

	initialize: function(options) {
		this.setOptions(options);

		this.regex = /(^#.*)|((?:http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,4}(?:\/\S*)?)/gim;

	},

	parse: function(string) {

		var matches = string.match(this.regex);

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

		sections = sections.filter(function(section, i) {

			return section.links.length > 0;

		}, this);

		return sections;

	},

	is_url: function(string) {
		return string.contains('://');
	},

	is_header: function(string) {
		return string.trim().charAt(0) == '#';
	},

	format_header: function(string) {
		
		string = remove_comments(string);

		if ( string.charAt(0) == '#' ) {
			string = string.substring(1);
		}
		if ( string.charAt(string.length-1) == ':' ) {
			string = string.substring(0, string.length - 1);
		}

		return string;
	},


});

var NoteLink = new Class({

	Implements: [Options, Events],

	initialize: function(url, options) {
		this.setOptions(options);
		this.url = url;
		this.wrapper = new Element('li', {'class': 'note-link-wrapper'});
		this.request = new Request.JSON({
			method: 'post',
			url: 'process.php',
			data: {type: 'fetch', url: url},
			timeout: 6.5 * 1000, 
		});

		this.request.addEvents({
			request : this._request_start.bind(this),
			success : this._request_success.bind(this),
			error : this._request_error.bind(this),
			failure : this._request_failure.bind(this),
			complete: this._request_complete.bind(this),
			timeout : this._request_timeout.bind(this)
		});

		this._setup();

	},

	_setup: function() {

		var html = '<span class="tag">&lt;li&gt;</span><span class="unit anchor"><span class="tag">&lt;a href="</span><a class="click">{url}</a>"<span class="tag">&gt;</span><wbr><span class="text"></span><span class="tag">&lt;/a&gt;</span></span><span class="tag">&lt;/li&gt;</span>';
		html = html.substitute({url: this.url});
		this.wrapper.appendHTML(html);

		var anchor = this.wrapper.getElement('.click');
		var fn = function(event){
			event.stop();
			return false;
		};
		anchor.addEvents({
			'dblclick': this._link_dblclick.bind(this),
			'dragstart': fn,
			'selectstart': fn
		});

		this.text = this.wrapper.getElement('.text');

	},

	_request_start: function() {
		this.text.set('html', 'Searching <em>{domain}</em>...'.substitute({domain: to_domain(this.url)}));
		this.wrapper.addClass('active');
	},

	_request_timeout: function() {
		this.wrapper.addClass('timeout');
		this.text.set('html', '<em>Taking a while...</em>');
	},

	_request_complete: function(json) {
	},

	_request_error: function(text, error) {
		this._error();
		this.fireEvent('error');
	},

	_request_failure: function(xhr) {
		this._error();
		this.fireEvent('error');
	},

	_request_success: function(json) {
		this.wrapper.addClass('success').removeClass('timeout').removeClass('error').removeClass('active');
		this.text.set('html', json.title[0]);
		this.fireEvent('success');
	},

	_text_click: function(event) {
		this.wrapper.removeClass('error').addClass('fixed');
		this.wrapper.getElements('.comment').dispose();
	},

	_link_dblclick: function(event){
		var url = event.target.get('text');
		window.open(url, '_blank');
		event.stop();
	},

	_error: function() {
		this._add_comments();
		this.wrapper.addClass('error').removeClass('active').removeClass('timeout').removeClass('success');
		this.text.set('html', 'Title Unavailable');
		this.text.addEvent('click', this._text_click.bind(this));
	},

	_add_comments: function() {
		this.wrapper.appendHTML('<span class="tag comment">&lt;&#33;-- </span>', 'top');
		this.wrapper.appendHTML('<span class="tag comment"> --&gt;</span>', 'bottom');
	},

	query: function() {

		this.request.post();

	},

	getElement: function() {
		return this.wrapper;
	},


});

var NoteSection = new Class({

	Implements: [Options, Events],

	initialize: function(section, options) {
		this.setOptions(options);	
		this.section = section;
		this.wrapper = new Element('div', {'class': 'note-section-wrapper'});
		this.note_links = [];

		this._setup();

	},

	_setup: function() {
		var header = '<span class="tag">&lt;h3 class="{classname}"&gt;</span><span class="unit header">{header}</span><span class="tag">&lt;/h3&gt;</span><br />';
		header = header.substitute({header: this.section.name, classname: to_slug(this.section.name)});
		this.wrapper.appendHTML(header);

		this.wrapper.appendHTML('<span class="tag">&lt;ul&gt;</span><br />');


		var list = new Element('ul', {'class': 'note-link-container'});
		this.section.links.each(function(link, i){

			var note_link = new NoteLink(link);
			this.note_links.push(note_link);

			list.grab(note_link.getElement());


		}, this);

		this.wrapper.grab(list);

		this.wrapper.appendHTML('<span class="tag">&lt;/ul&gt;</span><br /><br />');

	},

	getNoteLinks: function() {
		return this.note_links;
	},

	getElement: function() {
		return this.wrapper;
	},

});

var Orchestrator = new Class({

	Implements: [Options, Events],

	version: '4.0.0',

	initialize: function(input_panel, output_panel, options) {
		this.setOptions(options);

		this.input_panel = document.id(input_panel);
		this.output_panel = document.id(output_panel);

		
		this._setup();

		this.transcribe_mode = true;

		this.runs = 0;

		this._reset();

	},

	_reset: function() {
		this.sections = [];
		this.output_panel.getElement('.editor').getChildren().nix();
		this.input_panel.getElement('textarea').set('value', '');
		this.progress_bar.reset();
	},

	_setup: function() {
		this.parser = new Parser();
		this.scroll = new Fx.Scroll(window);
		this.progress_bar = new ProgessBar();

		var input_panel = create_input_panel_template();
		input_panel.getElement('button').addEvent('click', this._button_action.bind(this));
		this.form = input_panel.getElement('textarea');
		this.input_panel.grab(input_panel);

		var output_panel = create_output_panel_template();
		this.output_panel.grab(output_panel);

		document.id(this.progress_bar).inject(this.output_panel.getParent(), 'before');

	},

	_button_action: function() {

		if ( this.transcribe_mode === true ) {
			this.start_transcribe();
			this.transcribe_mode = false;
		} else {
			this.start_reset();
			this.transcribe_mode = true;
		}

	},

	start_transcribe: function() {

		this.output_panel.removeClass('hidden');
		this.input_panel.getElement('button').set('text', 'Reset');

		var content = this.input_panel.getElement('textarea').get('value');
		var matches = this.parser.parse(content);
		var sections = this.parser.digest(matches);

		this.populate(sections);

		this.query();

		this.scroll.toElement(this.progress_bar);

		this.runs++;

	},

	start_reset: function() {
		this._reset();
		this.scroll.toElement(this.input_panel);
		this.input_panel.getElement('button').set('text', 'Transcribe');

	},

	populate: function(sections) {
		var editor = this.output_panel.getElement('.editor');
		sections.each(function(section, i){
			var note_section = new NoteSection(section);
			this.sections.push(note_section);
			editor.grab(note_section.getElement());
		}, this);

		editor.appendHTML('<br /><br /><span class="tag">&lt!-- transcribed (version {version}): {timestamp} --&gt;</span><br />'.substitute({timestamp: (new Date()).toString(), version: this.version}));

	},

	query: function() {

		var progress_bar = this.progress_bar;

		var offset = 350, delay = 400, count = 0;
		this.sections.each(function(note_section, i) {
			var note_links = note_section.getNoteLinks();
			note_links.each(function(note_link, i) {

				note_link.query.delay(delay, note_link);

				note_link.addEvents({
					success: function(json) {
						progress_bar.update();
					},
					error: function(json) {
						progress_bar.compensate();
						progress_bar.update();
					}
				});

				delay = delay + offset;
				count++;

			});
		});

		this.progress_bar.setSize(count);

	},

	end: function() {
		
	},

});

var ProgessBar = new Class({

	Implements: [Options, Events],

	initialize: function(options) {
		this.setOptions(options);
		
		this.complete = 0;
		this.finished = false;
		this.percent = 0;

		this.element = new Element('div', {'class': 'progress-bar'});
		this.bar = new Element('div', {'class': 'bar'});
		this.bar.set('tween', {unit: '%'});
		this.element.grab(this.bar);
	},

	reset: function() {
		this.complete = 0;
		this.finished = false;
		this.percent = 0;
		this.bar.setStyle('width', '0%');
	},

	setSize: function(size) {
		this.size = this._size = size;
	},

	compensate: function() {
		this.size = this.size - 1;
	},

	update: function() {
		if (this.size > this.complete) this.complete++;
		if (this.size <= this.complete && this.finished === false) {
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

window.Orchestrator = Orchestrator;
window.ProgessBar = ProgessBar;
window.NoteSection = NoteSection;


})();