const _ = require('underscore');
const mark = require('../mark');


/*

	Visual mode is just text selection on top of command mode. Each keypress, simply maintain your range.

*/

// TODO absorb these elsewhere... Won't work with multiple vim instances
let originalCursorPosition = false,
  rangeStart;

module.exports = {

  /* Keys that pass through visual mode. Motion, mostly.  */
  '/^((?![1-9])(?!esc|x|d|y|i|a|J|c|>|<|~|g~|gu|gU).*[^1-9]+.*)/': function (keys, vim, res) {
    // Remember we're in the process of selecting
    this.curDoc.selecting = true;

    // "I" in visual block
    if (this.submode === 'block') {
      /* if(keys === '$') {
				var sel = this.curDoc.selection();
				var firstPoint = ('line' in sel[0]) ? sel[0] : sel[0][0];
				var startingColumn = firstPoint.char;
				var curLine = this.curDoc.getMark('<').line;
				var finalLine = this.curDoc.getMark('>').line;
				var newSelection = [];
				while(curLine <= finalLine) {
					var subRange = [ { line: curLine }, { line: curLine } ];
					if(this.curDoc._lines[curLine].length > startingColumn) {
						subRange[0].char = startingColumn;
					} else {
						subRange[0].char = 0;
					}
					subRange[1].char = this.curDoc._lines[curLine].length;
					newSelection.push(subRange);
					curLine++;
				}
				this.curDoc.selection(newSelection);
				return;
			} */
      if (keys === 'C') {
        this.exec('$');
        this.exec('c');

        return;
      }
      if (keys === 'I' || keys === 'A') {
        this.submodeVerb = keys;
        this.submode === '';
        // Move to command mode
        if (keys === 'A') {
          var pos = this.curDoc.selection()[0][1];

          pos.char--;
          pos.col--;
        }
        this.exec('esc');
        // Move to insert mode
        if (keys === 'A') {
          this.curDoc.cursor.position(pos);
          this.exec('a');
        } else {
          this.exec('i');
        }
        // Ensure still block submode
        this.submode = 'block';

        return;
      }
    }


    if (!originalCursorPosition) {
      originalCursorPosition = this.curDoc.cursor.position();
    }

    this.lastMode = 'visual';

    // execute the command in command mode
    this.mode('command'); // dont use 'esc' as that is defined below to cancel the visual session
    this.exec(keys);


    // Re-adjust the selection if necessary
    var pos = this.curDoc.cursor.position();

    this.rangeEnd = pos;

    let range = [JSON.parse(JSON.stringify(this.rangeStart)), JSON.parse(JSON.stringify(this.rangeEnd))];

    // Reverse if not correct order. But rangeStart remains where it was.
    if (this.rangeEnd.line < this.rangeStart.line || this.rangeEnd.line === this.rangeStart.line && this.rangeEnd.char < this.rangeStart.char) {
      range = [range[1], range[0]];
    }
    range[1].char++;

    // Store as marks; Augment with col as char is deprecated.
    range[0].col = range[0].char;
    range[0].mark = '<';
    range[1].col = range[1].char;
    range[1].mark = '>';


    this.curDoc.addMark(range[0]);
    this.curDoc.addMark(range[1]);

    // Visual
    if (this.submode === 'Visual') {
      range[0].char = 0;
      const line = this.curDoc.line(range[1].line);

      range[1].char = this.curDoc.line(range[1].line).length;
    }


    // Block mode
    if (this.submode === 'block') {
      // Starting line
      let curLine = range[0].line;
      const lastLine = range[1].line;
      // The first col of the selection
      let firstCol,
        lastCol;

      if (range[1].char <= range[0].char) {
        firstCol = range[1].char - 1;
        lastCol = range[0].char + 1;
      } else {
        firstCol = range[0].char;
        lastCol = range[1].char;
      }
      // Redefine range as an array
      blockRange = [];
      while (curLine <= range[1].line) {
        // If the range begins after the end of the line, skip it for now.
        // TODO:handle $ edge case
        if (firstCol >= this.curDoc._lines[curLine].length) {
          curLine++;
          continue;
        }
        let lastLineCol = Math.min(this.curDoc._lines[curLine].length, lastCol);
        var pos = this.curDoc.cursor.position();

        if (curLine === pos.line && lastLineCol === pos.col) {
          lastLineCol++;
        }

        blockRange.push([
          {
            line: curLine,
            char: firstCol,
            col: firstCol,
          }, {
            line: curLine,
            char: lastLineCol,
            col: lastLineCol,
          },
        ]);
        curLine++;
      }
      if (blockRange.length === 1) blockRange = blockRange[0];
      range = blockRange;
    }


    this.curDoc.selection(range);

    // Assuming we can, move back to visual mode after executing.
    // If we can't, must trust the mode to return us.
    if (this.modeName === 'command') this.mode('visual');
  },

  /* OPERATORS


	*/

  '/^c$/': function () {
    if (this.submode === 'block') {
      let newSelection = JSON.parse(JSON.stringify(this.curDoc.selection()));

      if ('line' in newSelection[0]) {
        newSelection = [newSelection];
      }
      _(newSelection).each((subRange, i) => {
        const newEnd = subRange[1];

        newEnd.char++;
        newEnd.col++;
        newSelection[i][1] = newEnd;
      });
      this.exec('d');
      this.exec('<Ctrl-v>');
      this.curDoc.selection(newSelection);
      this.exec('I');

      return;
    }
    this.exec('d');
    this.exec('i');
  },

  /* delete */
  '/^d$/': function () {
    const sel = this.curDoc.selection();

    this.exec('y');
    this.exec('v');
    this.curDoc.selection(sel);


    const doc = this.curDoc;

    // Grab the selection
    const range = doc.selection();

    // Don't kill the line
    // if(range[0].line === range[1].line &! doc.line(range[0].line).length) return;

    // Grab text val for register
    const val = doc.getRange(range);

    if (val.match(/\n/)) {

    } else {
      this.register('-', val);
    }

    doc.remove(range);

    doc.selection('reset');

    // Move to the beginning of the range
    if (range[0].line >= doc._lines.length) {
      let newLine = doc._lines.length - 1;

      if (newLine < 0) newLine = 0;
      doc.cursor.line(newLine);
    } else {
      doc.cursor.line(range[0].line);
    }
    doc.cursor.char(range[0].char);
    this.exec('esc');
  },

  /* yank */
  '/^y$/': function () {
    const selection = this.curDoc.getRange(this.curDoc.selection());
    const index = this.currentRegister;

    this.register(index, selection);
    this.curDoc.cursor.position(this.curDoc.selection()[0]);
    this.curDoc.selection('reset');
    this.exec('esc');
  },

  /* swap case */
  '/^~$/': function () {
    this.exec('g~');
  },


  /* swap case */
  '/^g~$/': function () {
    let selection = this.curDoc.selection();

    if (!selection[0].length) {
      selection = [selection];
    }
    _(selection).each(function (subRange) {
      const text = this.curDoc.getRange(subRange);
      let newText = mark('');

      for (let i = 0; i < text.length; i++) {
        const newChar = text[i] === text[i].toLowerCase() ? text[i].toUpperCase() : text[i].toLowerCase();

        newText = newText.concat(newChar);
      }
      this.curDoc.selection(selection);
      this.curDoc.exec('d');
      this.curDoc.exec('i');
      this.exec(newText);
      this.exec('esc');
    }, this);
  },

  /* make lowercase */
  '/^gu$/': function () {
    let selection = this.curDoc.selection();

    if (!selection[0].length) {
      selection = [selection];
    }
    _(selection).each(function (subRange) {
      const text = this.curDoc.getRange(subRange);
      let newText = mark('');

      for (let i = 0; i < text.length; i++) {
        const newChar = text[i].toLowerCase();

        newText = newText.concat(newChar);
      }
      this.curDoc.selection(selection);
      this.curDoc.exec('d');
      this.curDoc.exec('i');
      this.exec(newText);
      this.exec('esc');
    }, this);
  },

  /* make uppercase */
  '/^gU$/': function () {
    let selection = this.curDoc.selection();

    if (!selection[0].length) {
      selection = [selection];
    }
    _(selection).each(function (subRange) {
      const text = this.curDoc.getRange(subRange);
      let newText = mark('');

      for (let i = 0; i < text.length; i++) {
        const newChar = text[i].toUpperCase();

        newText = newText.concat(newChar);
      }
      this.curDoc.selection(selection);
      this.curDoc.exec('d');
      this.curDoc.exec('i');
      this.exec(newText);
      this.exec('esc');
    }, this);
  },

  /* filter through an external program */
  '/^!$/': function () {},


  /* filter through 'equalprg' */
  '/^=$/': function () {},

  /* text formatting */
  '/^gq$/': function () {},

  /* ROT13 encoding */
  '/^g?$/': function () {},

  /* shift right */
  '/^>$/': function () {
    const selection = this.curDoc.selection();
    let ct = selection[1].line - selection[0].line + 1;

    this.curDoc.cursor.line(selection[0].line);
    while (ct > 0) {
      this.exec('0');
      this.mode('insert');
      this.exec('\t');
      this.mode('visual');
      this.exec('j');
      ct--;
    }
    this.exec('esc');
    this.exec('^');
  },

  /* shift left */
  '/^<$/': function () {

  },

  /* define a fold */
  '/^zf$/': function () {

  },

  /* call function set with the 'operatorfunc' option */
  '/^g@$/': function () {

  },

  // Inner select
  '/^([1-9]+[0-9]*)?(a|i)(w|W|s|S|p|\\]|\\[|\\(|\\)|b|>|<|t|\\{|\\}|"|\'|`)$/': function (keys, vim, match) {
    const outer = match[2] === 'a';
    let count = 1;

    if (match[1] && match[1].length) count = parseInt(match[1]);
    let boundaries = [];
    const boundaryMap = {
      w: ['b', 'e'],
      W: ['F ', 'f '],
      '"': ['F"', 'f"'],
      s: ['(', ')'],
      '(': ['F(', 'f)'],
    };

    if (match[3] in boundaryMap) {
      boundaries = boundaryMap[match[3]];
    } else {
      boundaries = [match[3], match[3]];
    }

    let moveIn = false;

    if (boundaries[0].substring(0, 1) === 'F' && match[2] === 'i') {
      boundaries[0] = `T${boundaries[0].substring(1)}`;
      boundaries[1] = `t${boundaries[1].substring(1)}`;
    } else if (match[2] === 'i') { // fix this
      moveIn = true;
    }

    if (boundaries.length) {
      this.exec('esc');
      var i = 0;

      while (i++ < count) {
        this.exec(boundaryMap[match[3]][0]);
      }
      if (moveIn) this.exec('l');
      this.exec('v');
      var i = 0;

      while (i++ < count) {
        this.exec(boundaryMap[match[3]][1]);
      }

      if (moveIn) this.exec('h');
    }
  },

  '/^esc/': function (keys, vim) {
    // Grab the last selection. Shitty to be cloning like this, but TODO fix.
    this.lastSelection = JSON.parse(JSON.stringify(this.curDoc.selection()));
    this.rangeStart = false;
    this.curDoc.selection('reset');
    this.curDoc.selecting = false;
    this.curDoc.cursor.position(originalCursorPosition);
    originalCursorPosition = false;
    this.submode = false;
  },

  '/^(x)$/': function (keys, vim) {
    this.exec('d');
  },

  '/^(J)$/': function (keys, vim) {
    const range = this.curDoc.selection();
    let ct = range[1].line - range[0].line || 1; // do first join ANYWAYS

    // Move to the beginning
    this.curDoc.cursor.line(range[0].line);
    this.exec('esc');
    while (ct--) {
      this.exec('J');
    }
  },
};
