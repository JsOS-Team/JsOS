let _ = require('underscore'),
  Set = require('get-set');

const mauve = require('../../mauve');

// var rainbow = require('./3rd/rainbow/js/rainbow.js');
// require('./3rd/rainbow/js/language/javascript.js')(rainbow);

mauve.set({
  idle: '#0000ff',
  gutter: '#d75f00',
  cursor: '/#555',
  status: 'bold',
  'entity.function': '#dc3',
  storage: '#21F',
  'function.anonymous': '#1F1',
  selection: '#000/#fff',
});

/*

	View handles the difference between what's stored in the file and what is visible on the screen.

	Individual implementations (cli, web) should listen to view

	Probably the optimal basis for view will be communication of diffs

*/
const View = module.exports = function (obj) {
  // Grab a handle
  this.vim = obj.vim;
  this.color = true;

  // Set dimensions, defaulting to 24 lines of 80 columns
  this.lines = obj.lines || 24;
  this.cols = obj.cols || 80;

  // Array keeping track of which segment of the doc we are looking at.
  this.lastVisibleLines = [0, 1];

  this.vim.on('change', this.handleChange.bind(this));
  this.idle = false;
  this.vim.on('idle', () => {
    this.idle = true;
    this.handleChange.bind(this);
  });


  this.vim.on('change:status', () => {
    this.trigger('change');
  });

  // The status message;
  this.status = '';

  // An array of the text
  this.lineArray = [];

  // The line that has focus. For now: line at bottom of screen
  this.focus = 0;
};

// Inherit 'on', 'trigger'
View.prototype = new Set();

/** Responds to vim changes

*/
View.prototype.handleChange = function () {
  //    if(!this.idle) return;
  this.refreshStatusLine();
  this.getText();

  this.trigger('change');
  this.idle = false;
};
let renderCt = 0;

/* The basic status line */
View.prototype.refreshStatusLine = function () {
  // Some modes just show the name
  if (this.notification) {
    this.status = this.notification;
    this.notification = false;

    return this.status;
  }
  if ('insert,replace'.indexOf(this.vim.modeName) !== -1) {
    const text = `-- ${this.vim.modeName.toUpperCase()} --`;

    this.status = this.color ? mauve(text).status : text;

    return this.status;
  }
  const keys = this.vim.keyBuffer;
  const firstKey = keys.substring(0, 1);

  if (firstKey === '/' || firstKey === '?' || firstKey === ':') {
    return this.status = this.vim.keyBuffer;
  }
  this.status = '';
};

View.prototype.getText = function () {
  const text = this.getArray().join('\n');

  // Do
  /* rainbow.color(text,'javascript', function(newText) {
		text = newText;
	}); */

  return text;
};


/** Returns an array [startLine,endLine] of visible lines
 *
 * Logic: moves w the cursor. TODO: scrolloff in vim.rc alias: "so"
 */
View.prototype.visibleLines = function () {
  if (this.lastVisibleLines[1] < this.lines) {
    this.lastVisibleLines[1] = this.lines;
  }
  // Lines we have
  const totalLines = this.lines - 1;

  const cursorLine = this.vim.curDoc.cursor.line();

  if (cursorLine >= this.lastVisibleLines[1]) {
    this.lastVisibleLines = [cursorLine - totalLines + 1, cursorLine];
  } else if (cursorLine < this.lastVisibleLines[0]) {
    this.lastVisibleLines = [cursorLine, cursorLine + totalLines];
  }
  if (this.lastVisibleLines[0] < 0) this.lastVisibleLines[0] = 0;

  return this.lastVisibleLines;
};

View.prototype.getArray = function () {
  renderCt++;
  // Grab those that are relevant
  const visibleLines = this.visibleLines();

  let textArray = this.vim.curDoc._lines.slice(visibleLines[0], visibleLines[1] + 1);
  let noLines = false;

  if (!textArray.length) {
    this.notify = '--No lines in buffer';
    noLines = true;
  }

  const cursor = noLines ? {
    line: 0,
    char: 0,
  } : this.vim.curDoc.cursor.position();

  const visibleCursorIndex = cursor.line - visibleLines[0];
  let cursorLine = textArray[visibleCursorIndex];

  if (!cursorLine) {
    cursorLine = '';
  }
  cursorLine += ' ';

  const selection = this.vim.curDoc.selection();
  const newLines = [];

  _(textArray).each(function (text, lineIndex) {
    let newText = '';

    if (lineIndex === cursor.line && cursor.char >= text.length) {
      text += ' ';
    }
    _(text).each(function (character, charIndex) {
      newText += this.renderChar(character, {
        line: lineIndex,
        char: charIndex,
      }, cursor, selection);
    }, this);
    newLines[lineIndex] = newText;
  }, this);
  textArray = newLines;


  const lines = [];

  // Lines of the screen left to account for
  let linesLeft = this.lines;

  // Add status first
  lines.unshift(this.status);
  linesLeft--;

  while (linesLeft > 0) {
    // Add the nearest text-line
    if (typeof textArray[linesLeft - 1] !== 'undefined') {
      const textLine = textArray[linesLeft - 1];

      lines.unshift(this.renderLine(textLine, visibleLines[0] + linesLeft));
    } else {
      lines.splice(lines.length - 1, 0, !this.color ? '~' : mauve('~').idle);
    }
    // Shift ref to the text-line above that

    // TODO incorporate wrapping lines
    // If wrap, linesLeft--
    // Record that we're one line shorter
    // linesLeft -= Math.ceil(this.lines[i]/this.cols);
    linesLeft--;
  }

  return lines;
};


/** render a specific character. This is brutal, but simplest way to handle cursor + selection highlighting without stepping on one another's toes.
 */

View.prototype.renderChar = function renderChar(character, position, cursor, selection) {
  // If is cursor, just do that.
  if (cursor.line === position.line && cursor.char === position.char) { return !this.color ? character : mauve(character).cursor; }
  // If is a typical range, show that.
  if ('line' in selection[0]) {
    if (position.line < selection[0].line || position.line > selection[1].line) { return character; }
    if (position.line > selection[0].line && position.line < selection[1].line) { return !this.color ? character : mauve(character).selection; }
    if (position.line === selection[0].line && position.line !== selection[1].line && position.char >= selection[0].char) { return !this.color ? character : mauve(character).selection; }
    if (position.line === selection[1].line && position.line !== selection[0].line && position.char < selection[1].char) { return !this.color ? character : mauve(character).selection; }
    if (selection[0].line === selection[1].line && position.line === selection[0].line) {
      if (position.char >= selection[0].char && position.char < selection[1].char) { return !this.color ? character : mauve(character).selection; }
    }
  } else {
    // A visual block selection
    if (position.line < selection[0][0].line || position.line > selection[selection.length - 1][1].line) return character;
    let result = false;

    _(selection).find(function (range) {
      if (range[0].line === position.line && (position.char >= range[0].char && position.char < range[1].char)) {
        result = !this.color ? character : mauve(character).selection;
      }
    }, this);
    if (result) return character.selection;
  }

  return character;
};


/** Return the difference between current and arg ref

	Making a decisioin here, let's let it collapse to "oh, this character changed..."
		Because that's going to be the cheapest way for terminal to handle small changes

*/
View.prototype.getPatch = function (ref) {
  this.renderText();
  // diff
  const patch = [];
  // current text
  const text = this.getText();

  if (!ref && ref !== '') throw 'No reference to diff!';

  /* Why doing this so slowly? Well, the point is:
		1) This is meant for diffing the current screen, so ~50 lines... not too expensive
		2) A comprehensive diff will be useful to a display where changes are expensive (imagine... kindle)
	*/
  // We need to definitely account for every refLine
  const refLines = ref.split('\n');

  while (refLines.length < 24) {
    refLines.push('');
  }
  const textLines = text.split('\n');

  let lineIndex = 0;
  // Do the lines

  _(refLines).each((line, i) => {
    // Get the general line changes
    const diff = this.diffLine(line, textLines[i]);

    _(diff).each((change) => {
      // Add the line number
      change.line = i + 1;
      // Push to the patch
      patch.push(change);
      lineIndex = i;
    });
  });

  return patch;
};

View.prototype.diffLine = function (line1, line2) {
  const diffs = [];
  // No changes

  if (line1 === line2) return [];
  // Clear the line
  if (!line2 || !line2.length) {
    return [
      {
        from: 0,
        to: line1.length - 1,
        content: '',
      },
    ];
  }
  // Write the line
  if (!line1 || !line1.length) {
    return [
      {
        from: 0,
        to: line2.length - 1,
        content: line2,
      },
    ];
  }

  const len = Math.max(line1.length, line2.length);
  let diff = false;

  for (var i = 0; i < len; i++) {
    // If the same
    if (line1[i] === line2[i]) {
      // And a diff had been started
      if (diff) {
        // The diff is over, man
        diff.to = i;
        diffs.push(diff);
        diff = false;
      }
      // Otherwise, proceed.
    } else { // There is a difference
      // And it's not the first one
      if (diff) {
        // Just add the different character
        diff.content += line2[i] ? line2[i] : '';
      } else { // But if it's the beginning of a diff
        // Start it off.
        diff = {
          from: i,
          content: line2[i] ? line2[i] : '',
        };
      }
    }
  }
  // What if the last line is different?
  if (diff) {
    diff.to = i;
    diffs.push(diff);
  }

  return diffs;
};

View.prototype.renderText = function () {
  // Grab the text. Dumb... should be transferring arrays, or just referencing directly
  //	this.text = this.vim.text();
};


/** Render an individual line. Expect a 1-indexed line # and.. who knows.

*/

View.prototype.renderLine = function (text, index, misc) {
  // Create gutter
  let gutter = `     ${index} `;

  while (gutter.length > 6) {
    gutter = gutter.substring(1);
  }
  gutter = !this.color ? gutter : mauve(gutter).gutter;

  return gutter + text;
};


View.prototype.notify = function (text) {
  this.notification = text;
  this.trigger('change:status');
};
