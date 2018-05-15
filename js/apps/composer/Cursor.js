/*
 * Composer
 * Copyright (c) 2017 PROPHESSOR
*/

'use strict';

class Cursor {
  static get symbol() {
    return '#';
  }

  constructor() {
    this.position = 0;
  }

  moveRight() {
    this.position++;
  }
}

module.exports = new Cursor();
