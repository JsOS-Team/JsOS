// Example application for JsOS
// By PROPHESSOR

'use strict';

let io,
  kb,
  ms,
  resp;

function main(api, res) {
  io = api.stdio;
  kb = api.keyboard;
  ms = api.mouse;

  resp = res;
  io.setColor('green');
  io.writeLine('Keylogger started!');
  io.setColor('yellow');
  io.writeLine('Press F12 for exit');
  io.setColor('pink');
  kb.onKeydown.add(keylog);
  ms.onMousedown.add(mouselog);
  // return res(0); // 1 = error
}

function mouselog(key) {
  let type;

  switch (key) {
    case 0:
      type = 'Left button';
      break;
    case 1:
      type = 'Middle button';
      break;
    case 2:
      type = 'Right button';
      break;
    default:
      type = 'Unknown mouse button';
      break;
  }

  io.writeLine(type);

  return false;
}

function keylog(key) {
  if (key.type === 'f12') return stop();
  io.writeLine(JSON.stringify(key));

  return false;
}

function stop() {
  io.setColor('yellow');
  io.writeLine('Keylogger stoped');
  kb.onKeydown.remove(keylog);
  ms.onMousedown.remove(mouselog);

  return resp(0);
}

exports.call = (cmd, args, api, res) => main(api, res);

exports.commands = ['example'];
