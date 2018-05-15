const _ = require('underscore');
const mark = require('../mark');

module.exports = {

  /* Any time you receive multiple keys in one go */
  '/^((?!\b|esc)[\\w\\W][\\w\\W]+)$/': function (keys, vim) {
    for (let i = 0; i < keys.length; i++) {
      this.exec(keys.substring(i, i + 1));
    }
  },

  '/^((?!\b|esc|}).)$/': function (keys, vim, match) {
    this.currentInsertedText += keys;
    vim.insert(keys);
  },

  '/^}$/': function () {
    if (this.rc.smartindent && this.curDoc._lines[this.curDoc.cursor.line()].match(/^\s*$/)) {
      let ct = this.rc.tabstop;

      this.exec('esc');
      while (ct--) {
        this.exec('X');
      }
      this.exec('i');
    }
    this.insert('}');
  },

  '/^(\r|\n)$/': function (keys) {
    this.currentInsertedText += keys;
    if (!this.rc.smartindent || this.curDoc._lines[this.curDoc.cursor.line()].length === 0) {
      this.insert('\n');
    } else {
      const thisLine = this.curDoc._lines[this.curDoc.cursor.line()];
      const indent = thisLine.match(/{\s*(?:\/\/.*|\/\*.*\*\/\s*)?$/);

      curChar = this.curDoc.cursor.char();
      const currentText = this.currentInsertedText;

      this.exec('esc');
      this.exec('^');

      // Assume you're indenting to the first non-blank char
      let ct = this.curDoc.cursor.char();
      // Unless it's all blank, then to zero.

      if (thisLine.match(/^\s*$/)) {
        ct = 0;
      }

      this.curDoc.cursor.char(curChar);
      this.insert('\n');

      if (indent) {
        ct += this.rc.tabstop;
      }
      this.exec('i');
      this.currentInsertedText = currentText;
      while (ct-- > 0) {
        this.exec(' ');
      }
    }
  },

  '/^(\b)$/': function (keys, vim) {
    if (this.currentInsertedText.length) this.currentInsertedText = this.currentInsertedText.substring(0, this.currentInsertedText.length - 1);
    const atZero = !vim.curDoc.cursor.char();

    vim.exec('esc');

    // Only backspace if there's somewhere to go.
    if (atZero & !vim.curDoc.cursor.line()) return;

    // Do a join if at the beginning (i.e., deleting a carriage return)
    if (atZero && vim.curDoc.cursor.line()) {
      vim.exec('k');
      vim.exec('J');
      vim.exec('x');
    } else {
      // Otherwise just erase the character. This works because "esc" from insert decrements the cursor.
      vim.exec('x');
    }
    vim.exec('i');
  },
  '/^esc/': function (keys, vim) {
    // Handle text

    vim.mode('command');
    vim.exec('h');

    if (this.submode === 'block' & !this.currentInsertedText.match(/\n/)) {
      this.submode = '';
      const lastText = this.currentInsertedText;
      // For each line that was a part of that block selection
      const meaningfulSelection = this.lastSelection.slice(1);

      _(meaningfulSelection).each(function (range) {
        // Move to the beginning of the selection on that line
        if (this.submodeVerb === 'I') {
          this.curDoc.cursor.position(range[0]);
          this.exec('i');
        } else if (this.submodeVerb === 'A') {
          const newPos = range[1];

          newPos.char--;
          newPos.col--;
          this.curDoc.cursor.position(range[1]);
          this.exec('a');
        }
        this.exec(lastText);
        this.exec('esc');
      }, this);
      this.curDoc.cursor.position(this.lastSelection[0][0]);
    }

    this.register('.', this.currentInsertedText);
    this.currentInsertedText = this.currentInsertedText.substring(0, 0);
  },


};
