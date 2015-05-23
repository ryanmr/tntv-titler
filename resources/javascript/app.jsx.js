

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

function remove_utm(url) {
	return url.replace(/&?utm_(.*?)\=[^&]+/gim, '');
}

var Parser = new Class({

	Implements: [Options, Events],

	initialize: function(options) {
		this.setOptions(options);

		/*
			TODO:
				investigate future use of more advanced regex - https://gist.github.com/dperini/729294
				allow headers and urls to be parsed independently
		*/
		this.regex = /(^#.*)|((?:http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,4}(?:\/\S*)?)/gim;

	},

	parse: function(string) {

		var matches = string.match(this.regex);

		if (matches == null) {
			return [];
		}

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

				var url = this.format_link(match);

				current_section.links.push(url);

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

	format_link: function(url) {

		url = remove_utm(url);

		return url;
	}

});

var dom = React.findDOMNode;

var InputPanel = React.createClass({
	getInitialState: function() {
		return {
			content: ''
		}
	},
	handleTranscribe: function() {
		this.props.onTranscribeClick({content: dom(this.refs.content).value.trim()});
	},
	render: function() {
		return (
			<div className="input-panel form-wrapper">
				<div className="form-wrapper-inner">
					<textarea ref="content" cols="70" rows="20" placeholder="Enter show notes here..."></textarea>
					<button onClick={this.handleTranscribe}>Transcribe</button>
				</div>
			</div>
		);
	}
});

function classes_to_string(cls) {
	var str = "";
	cls.each(function(c){
		str += " " + c;
	});
	return str;
}

var Link = React.createClass({
	componentDidMount: function() {
		console.log("componentDidMount");

		this.fetch.delay(this.props.delay, this);

	},

	fetch: function() {
		var request = new Request.JSON({
			method: 'post',
			url: 'process.php',
			data: {type: 'fetch', url: this.props.link},
			timeout: 7 * 1000
		});

		this.request = request;

		this.props.queue.addRequest('link', request);

		request.addEvents({
			request : this._request_start,
			success : this._request_success,
			error : this._request_error,
			failure : this._request_failure,
			complete: this._request_complete,
			timeout : this._request_timeout
		});

		this.request.post();

	},



	_request_start: function() {
		console.log('start');
		var text = 'Searching <em>{domain}</em>...'.substitute({domain: to_domain(this.props.link)});
		this.setState({
			state: 'active',
			text: text,
			commented: false
		});
	},

	_request_success: function(json) {
		var text = json.title[0];
		if (text.length > 100) {
			text = text.substring(0, 90) + '...';
		}
		console.log('success');
		this.setState({
			text: text,
			state: 'success'
		});
	},

	_request_timeout: function() {
		var text = '<em>Taking a while...</em>';
		this.setState({
			state: 'timeout',
			text: text
		});
	},

	_request_complete: function(json) {},

	_request_failure: function(xhr) {
			this._error();
	},

	_request_error: function(text, err) {
		this._error();
	},

	_error: function() {
		// commented indicates that the li should show html comments
		this.setState({
			state: 'error',
			text: 'Title Unavailable',
			commented: true
		});
	},

	getInitialState: function() {
		var obj = {
			text: '',
			state: 'idle',
		};
		return obj;
	},

	render: function() {

		console.log("render");

		var comment_open = this.state.commented ? "<!-- " : null;
		var comment_close = this.state.commented ? " -->" : null;

		return (
			<li className="note-link-wrapper">
				<div className={this.state.state}>
				<span className="tag">{comment_open}{"<li><a href=\""}</span>
				<span><a href={this.props.link}>{this.props.link}</a></span>
				<span className="tag">{"\">"}</span>
				<wbr><span ref="text" className="text"><span dangerouslySetInnerHTML={{__html: this.state.text}} /></span></wbr>
				<span className="tag">{"</a></li>"}{comment_close}</span>
				</div>
			</li>
		);
	}
});

var Section = React.createClass({
	render: function() {

		var queue = this.props.queue;

		var delay = 350;
		var offset = 500;

		var nodes = this.props.data.links.map(function(link) {
			var child = (<Link link={link} queue={queue} delay={delay} />);
			delay += offset;
			return child;
		}, this);

		return (
			<div className="note-section-wrapper">
			<span className="tag">{"<h3>"}</span>
			<strong className="header">{this.props.data.name}</strong>
			<span className="tag">{"</h3>"}</span>
				<ul className="note-link-container">
					{nodes}
				</ul>
			</div>
		);
	}
});

var OutputPanel = React.createClass({
	getInitialState: function() {
		var state = {
			hidden: this.props.hidden,
			pairs: []
		};
		return state;
	},
	isVisible: function() {
		return this.props.sections.length > 0;
	},
	getSectionKey(section) {
		return section.name + "-" + section.links.length;
	},
	render: function() {
		if (!this.isVisible()) {return null;}

		var queue = new Request.Queue({
			stopOnFailure: false,
			conncurrent: 3
		});

		var nodes = this.props.sections.map(function(section){
			var child = (<Section
				key={this.getSectionKey(section)}
				data={section}
				queue={queue}
				/>);
			return child;
		}, this);


		return (
			<div className="output-panel form-wrapper">
				<div className="form-wrapper-inner">
					<div className="editor" contentEditable="true">
					{nodes}
					</div>
				</div>
			</div>
		);
	}
});

var Titler = React.createClass({
	getInitialState: function() {
		return {sections: []}
	},
	handleTranscribeClick: function(obj) {

		// how is the obj enforced?
		var content = obj.content;

		var parser = new Parser();
		var matches = parser.parse(content);
		var sections = parser.digest(matches);

		this.setState({sections: sections});

		// how do I trigger the events now?
		// probably, just let them go

	},
	render: function() {
		return (
			<div>
				<InputPanel
					onTranscribeClick={this.handleTranscribeClick}
				/>
				<OutputPanel
					sections={this.state.sections}
				/>
			</div>
		);
	}
});

React.render(<Titler />, $('titler'));
