// Copyright 2014-present runtime.js project authors
// Copyright 2017-present JsOS project authors
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

class StdioInterface {
  constructor() {
    this.onread = () => {};
    this.onwrite = () => {};
    this.onwriteerror = () => {};
    this.onsetcolor = () => {};
    this.onsetbackgroundcolor = () => {};
    this.onmoveto = () => {};
    this.onmoveoffset = () => {};

    this.write = this.write.bind(this);
    this.writeError = this.writeError.bind(this);
    this.writeLine = this.writeLine.bind(this);
    this.setColor = this.setColor.bind(this);
    this.setBackgroundColor = this.setBackgroundColor.bind(this);
    this.clear = this.clear.bind(this);
    this.read = this.read.bind(this);
    this.readLine = this.readLine.bind(this);
  }

  get color() {
    return this.getColor();
  }

  get bgcolor() {
    return this.getBgColor();
  }

  // stdout
  write(...text) {
    this.onwrite(text.join(' '));
  }

  writeLine(...text) {
    this.onwrite(`${text.join(' ')}\n`);
  }

  setColor(fg) {
    this.onsetcolor(fg);
  }

  setBackgroundColor(bg) {
    this.onsetbackgroundcolor(bg);
  }

  moveTo(x, y) {
    this.onmoveto(x, y);
  }
  moveOffset(offset) {
    this.onmoveoffset(offset);
  }

  clear() {
    this.onclear();
  }

  // stdin
  read(cb) {
    this.onread(cb);
  }

  readLine(cb) {
    let text = '';

    function addinput(char) {
      if (char !== '\n') {
        text += char;
        this.onread(addinput);
      } else {
        cb(text);
      }
    }

    // If there's onreadline, use it.
    if (this.onreadline) {
      this.onreadline(cb);
    } else {
      // Else, use onread.
      // Downside: no cusor moving or backspace.
      // TODO: Fix downside.
      this.onread(addinput);
    }
  }

  // stderr
  writeError(...text) {
    this.write('\n');
    if (typeof text[0] === 'string') {
      this.onwriteerror(text.join(' '));
    } else {
      this.onwriteerror(text[0].stack);
    }
    this.setColor('green');
    this.write('\n>>');
  }
}

module.exports = StdioInterface;
