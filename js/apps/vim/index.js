'use strict';

const Vim = require('./js-vim');
const fs = require('fs');

let vim = null;
let kb = null;
let io = null;
let res = null;

const kbaliases = {
  enter: '\n',
  tab: '\t',
  backspace: '\b',
  space: ' ',
  escape: 'esc',
  kpup: 'k', // '↑'
  kpdown: 'j', // '↓'
  kpleft: 'h', // '←'
  kpright: 'l', // '→'
};

function keyboard(key) {
  if (key.type === 'kppagedown') {
    kb.onKeydown.remove(keyboard);

    return res(0);
  }

  if (key.type === 'character') {
    vim.exec(kbaliases[key.character] || key.character);
  } else if (kbaliases[key.type]) vim.exec(kbaliases[key.type]);
  else debug(`Ignoring ${key.type}`);

  return false;
}

function exit() {
  kb.onKeydown.remove(keyboard);
  res(0);
}

function main(app, strargs, api, cb) {
  vim = new Vim();

  require('./lib/commands')(vim, exit);

  kb = api.keyboard;
  io = api.stdio;
  res = cb;

  const args = strargs.split(/\s+/);

  kb.onKeydown.add(keyboard);

  let previousLines = vim.view.getArray();

  io.clear();
  io.write(previousLines.join('\n'));

  vim.view.on('change', () => {
    const newLines = vim.view.getArray();

    for (let i = 0; i < newLines.length; i++) {
      if (newLines[i] !== previousLines[i]) {
        // Line changed, redraw it
        io.moveTo(0, i);
        io.write(newLines[i]);
        if (newLines[i].length < previousLines[i].length) {
          io.write(' '.repeat(previousLines[i].length - newLines[i].length));
        }
      }
    }

    previousLines = newLines;
  });

  if (args[0]) {
    vim.notify('Loading file...');
    fs.readFile(args[0], (err, data) => {
      if (err) {
        const errmsg = `Error: Can't read the file ${args[0]}`;

        debug(errmsg);
        vim.notify(errmsg);

        return;
      }

      const doc = new vim.Doc();

      doc.path = args[0];
      doc.text(data);
      vim.add(doc);
    });
  }
}
exports.commands = ['vim'];
exports.call = main;
