// Copyright 2014-present runtime.js project authors
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

const keyboard = require('../keyboard');
const printer = require('./printer');
const LineEditor = require('./line-editor');

const log = LineEditor.logger.log;

exports.color = printer.color;
exports.print = printer.print;
exports.moveOffset = printer.moveOffset;
exports.moveTo = printer.moveTo;
exports.clear = printer.clear;

let isReading = false;

exports.read = (cb) => {
  if (isReading) {
    throw new Error('nested terminal read is not allowed');
  }

  const editor = new LineEditor();

  isReading = true;

  function addinput(keyinfo) {
    switch (keyinfo.type) {
      case 'character':
        printer.print(keyinfo.character);
        cb(keyinfo.character);
        keyboard.onKeydown.remove(addinput);
        break;
      case 'backspace':
        break;
      case 'enter':
        printer.print('\n');
        isReading = false;
        setImmediate(() => cb('\n'));
        keyboard.onKeydown.remove(addinput);
        break;
      default:
        break;
    }
  }

  keyboard.onKeydown.add(addinput);
  editor.drawCursor();
};

exports.readLine = (cb) => {
  if (isReading) {
    throw new Error('nested terminal read is not allowed');
  }

  const editor = new LineEditor();

  isReading = true;

  function addinput(keyinfo) {
    log(`Keyboard->${keyinfo.type}`, { level: 'Keyboard' });
    switch (keyinfo.type) {
      case 'kpleft':
        editor.moveCursorLeft();
        break;
      case 'kpright':
        editor.moveCursorRight();
        break;
      case 'kpup':
        editor.previous();
        break;
      case 'kpdown':
        editor.next();
        break;
      case 'kphome':
        editor.moveCursorStart();
        break;
      case 'kpend':
        editor.moveCursorEnd();
        break;
      case 'kppageup':
        printer.scrollUp(0);
        break;
      case 'kppagedown':
        printer.scrollDown(0);
        break;
      case 'character':
        editor.putChar(keyinfo.character);
        break;
      case 'backspace':
        editor.removeChar();
        break;
      case 'kpdel':
        editor.removeCharRight();
        break;
      case 'enter':
        editor.removeCursor();
        printer.print('\n');
        isReading = false;
        setImmediate(() => {
          let text = editor.getText();

          editor.writeHistory(text);
          if (text[0] === '#') {
            let result;

            text = text.slice(1);
            try {
              result = `=>${eval(text)}\n`; // eslint-disable-line no-eval
            } catch (e) {
              result = `\nError: ${e}\n`;
            }
            printer.print(result);

            return cb('');
          }

          return cb(editor.getText());
        });
        keyboard.onKeydown.remove(addinput);
        break;
      default:
    }
  }

  keyboard.onKeydown.add(addinput);
  editor.drawCursor();
};
