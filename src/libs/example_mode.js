var ace = require('brace');

ace.define('ace/mode/example', function(require, exports, module) {

var oop = require("ace/lib/oop");
var TextMode = require("ace/mode/text").Mode;
var ExampleHighlightRules = require("ace/mode/example_highlight_rules").ExampleHighlightRules;

var Mode = function() {
    this.HighlightRules = ExampleHighlightRules;
};
oop.inherits(Mode, TextMode);

(function() {
    // Extra logic goes here. (see below)
}).call(Mode.prototype);

exports.Mode = Mode;
});

ace.define('ace/mode/example_highlight_rules', function(require, exports, module) {

var oop = require("ace/lib/oop");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var ExampleHighlightRules = function() {

    //this.$rules = new TextHighlightRules().getRules();

    this.$rules = {
        "start" : [
            {
                token : "comment",
                regex : "^\\/\\/.*$"
            },
            {
                token : "comment", // multi line comment
                regex : "\\/\\*",
                next : "comment"
            }, 
            {
                token : "constant.numeric",
                regex : "^\\/.*$"
            },
            {
                token : "keyword",
                regex : "^\\:.*$"
            },
        ],
        "comment" : [
            {
                token : "comment", // closing comment
                regex : "\\*\\/",
                next : "start"
            }, {
                defaultToken : "comment"
            }
        ]
    }
    
}

oop.inherits(ExampleHighlightRules, TextHighlightRules);

exports.ExampleHighlightRules = ExampleHighlightRules;
});
