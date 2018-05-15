'use strict';

const Event = require('./Event');

const Cursor = function (obj) {
  this._line = 0;
  this._char = 0;

  if (typeof obj === 'object') {
    if ('line' in obj) this._line = obj.line;
    if ('char' in obj) this._char = obj.char;
  }

  // Whether the cursor has changed since last set
  this.moved = false;

  this.on('change', function () {
    this.moved = true;
  });
};


Cursor.prototype = new Event();

Cursor.prototype.line = function (num) {
  if (typeof num === 'number' && this._line !== num) {
    this._line = num;
    this.trigger('change:line', num);
    this.trigger('change');
  }

  if ('doc' in this) {
    if (this.doc._lines.length && this.doc._lines.length <= this._line) {
      this.line(this.doc._lines.length - 1);
    }
  }

  return this._line;
};

Cursor.prototype.col = function (num) {
  if (typeof num === 'number' && this._char !== num) {
    this._char = num;
    this.trigger('change:char', num);
    this.trigger('change');
  }

  // Just say we are on the last character if it's not available.
  if ('doc' in this) {
    if (this.doc.line().length < this._char) {
      return this.doc.line().length;
    }
  }

  return this._char;
};

Cursor.prototype.char = function () {
  return this.col.apply(this, arguments);
};

Cursor.prototype.position = function (pos) {
  if (pos) {
    this.line(pos.line);
    this.char(pos.char);
  }

  return {
    line: this.line(),
    char: this.char(),
    col: this.col(),
  };
};

module.exports = Cursor;
