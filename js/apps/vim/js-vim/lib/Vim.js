/* !
 * js-vim
 * Copyright(c) 2013 Joe Sullivan <itsjoesullivan@gmail.com>
 * MIT Licensed
 */


/*
 * Dependencies
 */

let Set = require('get-set'),
  _ = require('underscore');
const mark = require('./mark');

/*
 * Components
 */

let Doc = require('./Doc'),
  View = require('./View'),
  CommandParser = require('js-vim-command');


/** Initialize a Vim instance
 */
Vim = function (obj) {
  // Instanciate view
  this.view = new View({ vim: this });

  // Place for multiple docs
  this.docs = [];

  // Clipboard stuff. TODO: refactor out into separate module
  this._numRegistry = [];
  this._registry = {};
  // Hm.
  this.currentRegister = 0;

  // Remember everything types in that particular insertion
  this.insertSession = '';


  // Giving this method a shot.
  this.histories = { ':': [] };
  this.histories[':'].position = 0;


  this.marks = {};

  this.rc = {
    tabstop: 4,
    smartindent: true,
    shiftwidth: 4,
    abbreviations: {},

  };

  this.curChar = '';
  this.curWord = '';


  // Instanciate parser
  this.parser = new CommandParser();

  // Diff util for undo, etc.
  // API: https://code.google.com/p/google-diff-match-patch/wiki/API
  const dmpmod = require('diff_match_patch');

  this.dmp = new dmpmod.diff_match_patch();

  // Current depth of command execution.
  // 0 is idle;
  // 1 is a user-executed command;
  // below 1 is sub-commands resulting from the input
  this.execDepth = 0;

  // Place to hold all commands
  this.modes = {};

  // Keys typed. When typing :q, before you press q, keyBuffer reads ":"
  this.keyBuffer = '';

  // A history of keys typed which is cleared at different intervals.
  this.keyHistory = '';

  // Create initial document
  const doc = new Doc();

  doc.vim = this;
  this.add(doc);

  this.on('change:status', () => {
    this.trigger('change');
  });


  // Add modes
  this.addMode('insert', require('./modes/insert'));
  this.addMode('command', require('./modes/command'));
  this.addMode('search', require('./modes/search'));
  this.addMode('visual', require('./modes/visual'));

  require('./modes/ex')(this);

  // Default to command mode
  this.mode('command');
};

// Inherit Set, giving set, get, on, trigger
Vim.prototype = new Set();

// Create a new doc. Not very semantic.
// TODO: kill this
Vim.prototype.new = function () {
  const doc = new Doc();

  doc.cursor.line(0);
  doc.cursor.char(0);
  this.docs.push(doc);
  this.curDoc = doc;
  this.exec('esc');
};

/** Create a new mode
 *
 * @param {String} name
 * @param {Object} mode
 */
Vim.prototype.addMode = function (name, mode) {
  const modeArr = [];

  for (const i in mode) {
    // TODO make it _().each
    if (mode.hasOwnProperty(i)) {
      // TODO let strings fall through for (command in mode) matching
      const reg = new RegExp(i.substring(1, i.length - 1));

      this.addCommand({
        mode: name,
        match: reg,
        fn: mode[i],
      });
    }
  }
};

/** add a command to an existing mode
 *
 * @param {Object} obj

	obj ~ {
		mode: string,
		match: regexp | string,	<-- /:o (.*)\n/ vs. "o"
		fn: function
	}

*/
Vim.prototype.addCommand = function (obj) {
  if (!obj || typeof obj !== 'object' || !obj.mode || !obj.match || !obj.fn) throw 'Invalid argument';

  // Create mode if it doesn't yet exist
  if (!(obj.mode in this.modes)) this.modes[obj.mode] = [];

  return this.modes[obj.mode].push({
    command: obj.match,
    fn: obj.fn,
  });
};

/** Get/set mode
 * TODO: use Vim.set
 *
 */
Vim.prototype.mode = function (name) {
  if (name) {
    if (!(name in this.modes)) throw `Mode ${name} does not exist`;
    this._mode = this.modes[name];
    this.modeName = name;
    this.trigger('change:mode', this._mode);
    this.trigger('change', { type: 'mode' });
  }

  return this._mode;
};


/** set/get registers
 * TODO: do this as a set/get thing.

*/
Vim.prototype.register = function (k, v) {
  if (k === '_') return;
  const num = typeof k === 'number';

  if (v) {
    // Clone if array
    if (_(v).isArray()) v = v.slice(0);

    if (num) {
      this._numRegistry.splice(k, 0, v); // put where
      this._numRegistry.splice(10); // only ten.
    } else {
      this._registry[k] = v; // just set if not num TODO: check for '1' case
      this.register(0, v); // AND record into current register
    }
  } else {
    let val;

    if (num) {
      val = this._numRegistry[k];
    } else if (k === '%') {
      if ('path' in this.curDoc && typeof this.curDoc.path === 'string') {
        return (/(?:\/|^)([^\/]*)$/).exec(this.curDoc.path)[1];
      }
    } else {
      val = this._registry[k];
    }
    if (_(val).isArray()) val = val.slice(0);
    // Send an empty string if it's an empty buffer.
    return val || '';
  }
};


// TODO kill
/** Get a register, following logic that usage sets the default to 0

*/
Vim.prototype.useRegister = function () {
  const index = this.currentRegister || 0;

  this.currentRegister = 0; // Using sets to the default.
  //	var val = this.register(index);
  const val = 'asdf';

  return val;
};

const _text = '';

const abbreviationKeyMap = {
  ' ': 1,
  '\n': 1,
  esc: 1,
};

/** Execute a given command by passing it through
 */
Vim.prototype.exec = function (newCommand) {
  if (newCommand === undefined) return;

  // Grab what's left in the buffer
  if (this.keyBuffer.length) {
    this.keyBuffer += newCommand;
  } else {
    this.keyBuffer = newCommand;
  }

  // Keep track of top-level keys
  if (this.execDepth === 1) {
    this.keyHistory += newCommand;
  }


  command = this.keyBuffer;
  // TODO change triggers in order
  if (this.execDepth < 2) {
    this.trigger('change:keyBuffer', this.keyBuffer);
    this.trigger('change');
  }
  this.curChar = this.curDoc.getRange(this.curDoc.selection()).substring(0, 1);

  // accept an array as the first argument.
  if (typeof command !== 'string' && !('marks' in command)) {
    for (const i in command) {
      // For strings, execute them one at a time. Use the substring method here because a character may also hold a mark.
      if (command.hasOwnProperty(i)) {
        this.exec(command[i]);
      }
    }

    return;
  }


  // Increment the depth so we can identify top-level commands
  this.execDepth++;

  // Handle abbreviations
  if (this.modeName === 'insert' && this.execDepth === 1 && command in abbreviationKeyMap && abbreviationKeyMap[command] && this.currentInsertedText.length >= this.curWord.length) {
    if (this.curWord in this.rc.abbreviations) {
      const key = command;
      const curWord = this.curWord;
      const newWord = this.rc.abbreviations[this.curWord];
      const pos = this.curDoc.cursor.position();

      this.curDoc.remove([
        {
          line: pos.line,
          char: pos.char - curWord.length,
        }, {
          line: pos.line,
          char: pos.char,
        },
      ]);
      this.curDoc.cursor.char(pos.char - curWord.length);
      this.curDoc.insert(newWord);
    }
  }


  // If this is top-level command, store the value of text for diffing to store the undo
  // TODO: kill this
  //    if (this.execDepth === 1) {
  //        _text = this.text();
  //    }

  // Keep a hold of what the position is
  const startPos = this.curDoc.cursor.position();


  // Hold mode
  var mode = this.mode();

  let arg,
    regResult;

  // EX command helper

  if (this.keyBuffer.indexOf(':') === 0 && this.keyBuffer.lastIndexOf('\n') === this.keyBuffer.length - 1) {
    this.histories[':'].push(this.keyBuffer.substring(1, this.keyBuffer.length - 1));
    this.histories[':'].position = this.histories[':'].length;
  }


  // TODO break this into "should parse?" "parse useful?"

  // See if it is a complete, parsed command
  let parsedCommand = this.parser.parse(command);

  // Don't catch single commands because they aren't very useful.
  if (parsedCommand && parsedCommand.description.lastIndexOf('{') === 0) parsedCommand = false; // Dont handle if just one
  // 'yy' should fall through
  if (parsedCommand.description === '{operator}{operator}') parsedCommand = false;
  // '{n}y' should fall through
  if (parsedCommand.description === '{count}{operator}') parsedCommand = false;
  // '{n}yy', too
  if (parsedCommand.description === '{count}{operator}{operator}') parsedCommand = false;
  if (command.indexOf(':') === 0) {
    parsedCommand = false;
  }
  if (command.indexOf('?') === 0) {
    parsedCommand = false;
  }
  if (command.indexOf('/') === 0) {
    parsedCommand = false;
  }
  if (command.indexOf('<') > -1 && command.indexOf('>') > -1) {
    parsedCommand = false;
  }


  const handlers = [];
  var mode = this.mode();

  _(this.mode()).some((mode) => {
    let res;

    // Identify text
    if (command === mode.command) {
      handlers.push(mode);

      return true;
    }
    // But don't let text tests go on.
    if (typeof mode.command === 'string') return false;


    if (parsedCommand) {
      res = mode.command.exec(parsedCommand.description);
      if (res) return handlers.push(mode);
    } else if ('exec' in mode.command) {
      res = mode.command.exec(command);
    } else {
      return;
    }
    if (res) {
      regResult = res;
      arg = command;

      return handlers.push(mode);
    }
  });

  // If we found one
  if (handlers.length) {
    // For recording macros, i.e. qq{commands}q, @q
    if (this.recording && this.execDepth === 1 && command.indexOf('q') !== 0) {
      this.recordingBuffer.push(command);
    }

    // Clear keyBuffer before fn runs, so that it can reset keyBuffer if it desires without being overwritten
    this.lastKeyBuffer = command;
    this.keyBuffer = '';

    // Run the fn... TODO refactor the API so that that can be just one line
    if (parsedCommand) {
      handlers[0].fn.apply(this, parsedCommand.value);
    } else {
      handlers[0].fn.bind(this)(arg, this, regResult);
    }
  }

  // Escape valve for when the keyBuffer turns into a string that none of the commands recognize
  if (command === 'esc') {
    this.mode('command');
    this.keyBuffer = '';
  }

  if (this.execDepth === 1) {
    this.trigger('change:keyBuffer', command);
    this.trigger('exec', command);
  }

  this.curChar = this.curDoc.getRange(this.curDoc.selection()).substring(0, 1);
  this.curWord = getCurWord(this);
  this.execDepth--;

  if (this.execDepth === 0) {
    this.trigger('idle');
  }
};

function getCurWord(vim) {
  const doc = vim.curDoc;
  const startPoint = doc.find(/(?:^|\W)(\w+)$/g, {
    backwards: true,
    inclusive: true,
  });
  let endPoint;

  if (vim.modeName === 'insert') {
    endPoint = doc.find(/(\w)$/g, {
      backwards: true,
      inclusive: true,
    });
  } else {
    endPoint = doc.find(/(\w)(?:$|\W)/g, { inclusive: true });
  }
  // Expand for range friendly ness
  endPoint.col++;
  endPoint.char++;
  if (endPoint.found && startPoint.found) {
    const word = doc.getRange([startPoint, endPoint]);

    return word;
  }

  return '';
}

Vim.prototype.addUndoState = function () {
  const pos = this.curDoc.cursor.position();
  const result = this.curDoc.undo.add({
    text: this.curDoc.text(),
    cursor: pos,
    keys: this.keyHistory,
  });

  if (result) this.keyHistory = '';

  return result;
};


Vim.prototype.add = function (doc) {
  // Add a doc
  doc.on('change:cursor', () => {
    this.trigger('change');
  });
  doc.on('change:text', () => {
    this.trigger('change:text');
    this.trigger('change', { type: 'text' });
  });
  this.docs.push(doc);
  this.curDoc = doc;
  this.doc = this.curDoc; // I like this better than curDoc.
  this.trigger('change');
};


/** "Notifies" the user of something. Currently conducted by setting status. But could be growl, etc.

*/
Vim.prototype.notify = function (text) {
  this.view.status = text;
};

/* Shorthand fns */

Vim.prototype.insert = function () {
  return this.curDoc.insert.apply(this.curDoc, arguments);
};

Vim.prototype.remove = function () {
  return this.curDoc.remove.apply(this.curDoc, arguments);
};

Vim.prototype.text = function () {
  return this.curDoc.text.apply(this.curDoc, arguments);
};

Vim.prototype.cursor = function () {
  return this.curDoc.cursor;
};

Vim.prototype.toJSON = function () {
  const obj = this.curDoc.toJSON();

  obj.mode = this.modeName;

  return obj;
};

// Expose Doc for testing
Vim.prototype.Doc = Doc;

module.exports = Vim;
