// Copyright 2015-present runtime.js project authors
// Copyright 2018-present JsOS project authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const vga = require('./vga');

const buffer = vga.allocBuffer();

const w = vga.WIDTH;
const h = vga.HEIGHT;
let posCurrent = 0;

const tmpcolor = [vga.color.WHITE, vga.color.BLACK];
const { color } = vga;

class Printer {
  constructor() {
    {
      this.refresh = this.refresh.bind(this);
      this.scrollUp = this.scrollUp.bind(this);
      this.scrollDown = this.scrollDown.bind(this);
      this.clear = this.clear.bind(this);
      this.fill = this.fill.bind(this);
      this.print = this.print.bind(this);
      this.moveOffset = this.moveOffset.bind(this);
      this.moveTo = this.moveTo.bind(this);
      this.useControls = this.useControls.bind(this);
    }
    buffer.clear(vga.color.BLACK);
    this.refresh();
  }

  get color() {
    return color;
  }

  refresh() {
    vga.draw(buffer);
  }

  scrollUp() {
    buffer.scrollUp(vga.color.BLACK);
    posCurrent -= w;
  }

  scrollDown() {
    buffer.scrollDown(vga.color.BLACK);
    posCurrent -= w;
  }

  clear(color = vga.color.BLACK) {
    buffer.clear(color);
    posCurrent = 0;
    this.refresh();
  }

  fill(color) {
    return this.clear(color);
  }

  /**
   * Reserved symbols:
   * 0x1 -> 0xF - colors
   * 0x10 -> 0x1F - background colors
   * 0x20 -> 0x2F - special symbols (bold/italic/delete/clear/etc...)
   * @param {string} symbol - Constrol? symbol
   * @param {string} prevsymbol - Previous symbol (for 0x1B check)
   * @param {array} [setcolor] - Color values to control
   * @returns {bool} true - it's a control symbol; false - no
   */
  useControls(symbol, prevsymbol = '\0', setcolor = tmpcolor) {
    const code = symbol.charCodeAt();

    if (code >= 0x0 && code <= 0xF && prevsymbol.charCodeAt() === 0x1B) {
      setcolor[0] = code;

      return true;
    }

    if (code >= 0x10 && code <= 0x1F && prevsymbol.charCodeAt() === 0x1B) {
      setcolor[1] = code - 0x10;

      return true;
    }

    switch (code) {
      case 0x1B:
        return true;
      default:
        return false;
    }
  }

  print(textOpt = '', repeat = 1, fg = tmpcolor[0], bg = tmpcolor[1]) {
    const text = String(textOpt);
    const currentcolor = [fg, bg];

    for (let j = 0; j < repeat; j++) {
      for (const i in text) {
        const c = text[i];

        if (this.useControls(c, text[i - 1], currentcolor)) continue;

        if (c === '\n') {
          posCurrent -= posCurrent % w - w;
          if (posCurrent >= w * h) {
            this.scrollUp();
          }
        } else {
          if (posCurrent >= w * h) {
            this.scrollUp();
          }
          buffer.setOffset(posCurrent++, c, ...currentcolor);
        }
      }
    }

    this.refresh();
  }

  moveOffset(offsetOpt) {
    const offset = offsetOpt | 0;
    let newPos = posCurrent + offset;

    if (newPos < 0) {
      newPos = 0;
    }

    if (newPos >= w * h) {
      newPos = w * h - 1;
    }

    posCurrent = newPos;
  }

  moveTo(xOpt, yOpt) {
    let x = xOpt;
    let y = yOpt;

    if (x < 0) {
      x = 0;
    }
    if (x >= w) {
      x = w - 1;
    }
    if (y < 0) {
      y = 0;
    }
    if (y >= h) {
      y = h - 1;
    }
    posCurrent = y * w + x;
  }
}


module.exports = new Printer();
