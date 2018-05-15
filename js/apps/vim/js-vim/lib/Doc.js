'use strict';

const Cursor = require('./Cursor');
const _ = require('underscore');

const mark = require('./mark');

const Event = require('./Event');

const Doc = function (obj) {
  this.cursor = new Cursor();
  this.cursor.doc = this;
  this.cursor.on('change', () => {
    this.trigger('change:cursor');
  });

  this._text = '';
  this._lines = [];
  this.undo.add({
    text: '',
    cursor: {
      char: 0,
      line: 0,
    },
  });
  this._marks = {};

  this.selecting = false; // The document behaves differently when navigating vs. selecting
  this.yanking = false; // 'yanking' sub-mode
  if (typeof obj === 'object') {
    if ('text' in obj) {
      this._text = obj.text;
    }
  }

  this._selection = [];

  if (this._text.length) this._lines = this._text.split('\n');
};

Doc.prototype = new Event();
const _lasts = [];

/** Repeating commands need to look up the parameters for the command that happened! Store it here.

*/
Doc.prototype.last = function (k, v) {
  if (v) {
    _lasts[k] = v;
  }

  return k in _lasts ? _lasts[k] : undefined;
};
const Undo = require('./Undo');

Doc.prototype.undo = new Undo();


Doc.prototype.set = function (k, v) {
  let obj;

  if (v && typeof k === 'string') {
    obj = {};
    obj[k] = v;

    return this.set(obj);
  }
  obj = k;
  for (const i in obj) {
    if (obj.hasOwnProperty(i)) {
      this[`_${i}`] = obj[i];
      this.trigger(`change:${i}`, obj[i]);
      this.trigger('change');
    }
  }
};

// Getter / setter
Doc.prototype.text = function (text) {
  if (text || text === '') {
    if (typeof text === 'string') {
      this._text = text;
      this._lines = this._text.split('\n');
      this.trigger('change:text');
    } else if ('length' in text) {
      return this._lines.slice.apply(this._lines, text).join('\n');
    }
  }

  return this._text;
};

Doc.prototype.getRange = function (range) {
  let text = mark('');

  // If block selection
  if (!('line' in range[0]) && range[0][0] && 'line' in range[0][0]) {
    // AAAHHH!
    _(range).each(function (subRange) {
      text += this.getRange(subRange);
    }, this);

    return text;
  }


  // if same line, just do as one
  if (range[0].line === range[1].line) {
    text = this.line(range[0].line).substring(parseInt(range[0].char), parseInt(range[1].char));
  } else {
    // else start by grabbing rest of this line
    text = text.concat(this.line(range[0].line).substring(range[0].char));

    // if more lines, add each with an \n before
    const middleLineCount = range[1].line - range[0].line;
    let ct = 1;

    while (ct < middleLineCount) {
      text = text.concat('\n').concat(this.line(range[0].line + ct));
      ct++;
    }

    // add the first bit of the last line
    const lastLine = this.line(range[1].line);

    text = text.concat('\n').concat(lastLine.substring(0, range[1].char));
  }

  // If it extends beyond the actual text add a return
  if (range[1].char > this.line(range[1].line).length) {
    text = text.concat('\n');
  }

  return text;
};

/** Add a mark to the document, embedded in one of the lines of the document
 */
Doc.prototype.addMark = function (mk) {
  if (!mk) return;
  if (!('line' in mk && 'col' in mk)) throw 'bad mark.';
  const markId = (new Date().getTime() + Math.random()).toString(16);

  mk.id = markId;
  this._marks[mk.mark] = mk;
  if (mk.mark === '.') return;
  this._lines[mk.line] = mark(this._lines[mk.line], mk);
};

Doc.prototype.getMark = function (index) {
  if (index === '.') return this._marks['.'];
  const markId = this._marks[index].id;
  let mark = false;

  _(this._lines).each((line, lineIndex) => {
    if (mark) return;
    if (line.marks && line.marks.length) {
      if (mark) return;
      _(line.marks).each((lineMark) => {
        if (lineMark.id === markId) mark = lineMark;
        mark.line = lineIndex;
      });
    }
  });

  return mark;
};

// Retrieve the line at num; default to cursor if no num
Doc.prototype.line = function (num) {
  if (typeof num !== 'number') num = this.cursor.line();
  if (this._lines.length <= num) {
    if (this.cursor.line() === 0) {
      this._lines.push('');
    } else {
      console.log(new Error().stack);
      throw 'Line out of range of document';
    }
  }

  return this._lines[num];
};

// Input text
Doc.prototype.insert = function (text) {
  if (typeof text !== 'string' & !text.marks) throw 'Only strings can be inserted into a doc';

  if (text.length > 1) {
    for (let i = 0; i < text.length; i++) {
      this.insert(text.substring(i, i + 1));
    }

    return;
  }

  let curLine = this.line();
  const lineBackup = mark(curLine, curLine.marks);

  curLine = curLine.substring(0, this.cursor.char());
  if (typeof text.marks !== 'undefined' && typeof curLine.marks === 'undefined') {
    curLine = mark(curLine);
  }
  curLine = curLine.concat(text);
  curLine = curLine.concat(lineBackup.substring(this.cursor.char()));
  if (text.toString() === '\n') {
    const curLineIndex = this.cursor.line();
    const lines = curLine.split('\n');

    this._lines[curLineIndex] = lines[0];
    this._lines.splice(curLineIndex + 1, 0, lines[1]);
    this.cursor.line(curLineIndex + 1);
    this.cursor.char(0);
  } else {
    this._lines[this.cursor.line()] = curLine;
    this.cursor.char(this.cursor.char() + text.length);
  }

  // Add mark
  const pos = this.cursor.position();

  pos.mark = '.';
  this.addMark(pos);

  this.set({ text: this._lines.join('\n') });
  this.trigger('change');
};

/** Remove removes a range of characters like:

	[
		//from
		{
			char: number,
			line: number
		},
		//to
		{
			char: number,
			line: number
		}
	]

*/
Doc.prototype.remove = function (range) {
  // if invalid
  if (!isRange(range)) throw 'Not a valid range.';
  if (!('line' in range[0])) {
    return _.each(range, function (subRange) {
      this.remove(subRange);
    }, this);
  }

  // grab first half of line if exists
  const first = this._lines[range[0].line].substring(0, range[0].char);

  // check if joining after, determined by whether there's anything left of the line.
  const join = range[1].char >= this._lines[range[1].line].length;

  // grab end of other line if exists
  const last = this._lines[range[1].line].substring(range[1].char);

  // if the last line is entirely selected, remove it.

  // if the entire
  const deleteLastLine = (!range[0].char || // range opens at first character of a line
		range[0].line < range[1].line) && // or range opens above the line it ends on
	range[1].char > this.line(range[1].line).length; // and range extends beyond the characters (into presumed \n)

  // delete all lines in between if exist
  if (range[1].line > range[0].line) this._lines.splice(range[0].line + 1, range[1].line - range[0].line);

  // if the second range goes over and no first half AND not the same line, remove current line
  if (join && !first.length && range[0].line !== range[1].line) {
    this._lines.splice(range[0].line, 1);
  } else if (deleteLastLine) {
    this._lines.splice(range[1].line, 1);
  } else { // otherwise join first and second half and set as line.
    this._lines[range[0].line] = first.concat(last);
  }

  // Add mark
  const pos = this.cursor.position();

  pos.mark = '.';
  this.addMark(pos);


  this.set({ text: this._lines.join('\n') });
};

/* Finds the next instance of that exp, returning a range */

Doc.prototype.find = function (exp, opts) {
  opts = opts || {};
  let carriage = '',
    backwards = false,
    wholeLine = false,
    // Range here represents how far to look. Defaults to %, all.
    range = opts.range || opts.range === false ? opts.range : '%',
    offset = 0,
    inclusive = false;

  if (this.selecting) {
    carriage = '\n';
  }

  if ('backwards' in opts && opts.backwards) {
    backwards = true;
  }

  if ('inclusive' in opts && opts.inclusive) {
    inclusive = true;
  }

  if ('wholeLine' in opts && opts.wholeLine) wholeLine = true;

  if ('offset' in opts && opts.offset) offset = opts.offset;


  // check the rest of this line
  let rest;
  const thisLine = this.line() + carriage;

  let tmpOffset = 0;

  if (offset) {
    tmpOffset = offset;
  } else if (wholeLine) {
    tmpOffset = 0;
  } else {
    tmpOffset = this.cursor.char();
    if (backwards) {
      // TODO
    } else {
      tmpOffset += 1;
    }
    if (inclusive) {
      if (backwards) {
        tmpOffset += 1;
      } else {
        tmpOffset -= 1;
      }
    }
  }

  const curIndex = checkString(exp, thisLine, tmpOffset, backwards);

  if (curIndex > -1) {
    return {
      line: this.cursor.line(),
      char: curIndex,
      found: true,
    };
  }

  if (range) {
    // now check the rest. Decrement if this is a backwards search.
    let lineIndex = this.cursor.line() + (backwards ? -1 : 1);

    while (lineIndex < this._lines.length && lineIndex >= 0) {
      const foundAt = checkString(exp, this._lines[lineIndex] + carriage, 0, backwards);

      if (foundAt > -1) {
        return {
          line: lineIndex,
          char: foundAt,
          found: true,
        };
      }
      lineIndex += backwards ? -1 : 1;
    }
  }

  // return the last character if not found.
  const result = backwards ? this.firstPosition() : this.lastPosition();

  result.found = false;

  return result;
};

Doc.prototype.lastPosition = function () {
  return {
    line: this._lines.length - 1,
    char: this._lines[this._lines.length - 1].length - 1,
  };
};

Doc.prototype.firstPosition = function () {
  return {
    line: 0,
    char: 0,
  };
};


/** Check a string for a regular expression, indicating where in the string the match begins. -1 for false
 */

function checkString(exp, str, offset, backwards) {
  // Because of the lastIndex use the expression needs to be global
  if (!exp.global) throw 'Regular expressions need to be global here';

  // Offset optional
  if (offset == null) offset = 0;

  // Don't search before the offset
  if (!backwards) exp.lastIndex = offset;

  // If backwards, don't consider the rest of the string
  if (backwards && offset !== 0) str = str.substring(0, offset);

  const test = exp.exec(str);

  if (!test) return -1;

  const result = test[1] ? test[1] : test[2];

  if (backwards) {
    // AND this match is not looking for the beginning of the line.
    // TODO: make this check airtight, maybe faster.
    if (exp.toString().match(/[^\\^\[](\^)/)) {
      return str.indexOf(result);
    }

    return str.lastIndexOf(result);
  }

  return exp.lastIndex - test[0].length + test[0].indexOf(result);
}

// Expose for testing!
Doc.prototype.checkString = checkString;

let _selection = false;

Doc.prototype.selection = function (range) {
  // Reset if told
  if (range === 'reset') {
    _selection = false;

    return;
  }

  if (range) { // Set
    _selection = range;
  } else if (!_selection) { // Set as cursor position if none
    const pos = this.cursor.position();
    const end = {
      line: pos.line,
      char: pos.char + 1,
    };

    return [pos, end];
  }

  return _selection; // get
};


function isRange(range) {
  if (!('line' in range[0]) && _(range[0]).isArray()) {
    let areRanges = true;

    _.each(range, (subRange) => {
      if (!isRange(subRange)) areRanges = false;
    });

    return areRanges;
  }
  if (!range) return false;
  if (!('length' in range)) return false;

  if (range.length !== 2) return false;

  // basic structure
  if ('char' in range[0] && 'line' in range[0] && 'char' in range[1] && 'line' in range[1]) {
    if (range[0].line > range[1].line) return false;
    if (range[0].line === range[1].line && range[0].char > range[1].char) return false;
  } else {
    return false;
  }

  return true;
}

/** Check whether a position is a part of the current selection. */
Doc.prototype.inSelection = function (pos) {

};

Doc.prototype.exec = function () {
  if ('vim' in this) this.vim.exec.apply(this.vim, arguments);
};

Doc.prototype.toJSON = function () {
  return {
    text: this.text(),
    cursor: this.cursor.position(),
    selection: this.selection(),
  };
};

module.exports = Doc;
