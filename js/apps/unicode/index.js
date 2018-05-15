// Example application for JsOS
// By PROPHESSOR

'use strict';

let io,
  kb,
  resp,
  interval;

function main(api, res) {
  io = api.stdio;
  kb = api.keyboard;
  resp = res;
  kb.onKeydown.add(keylog);
  io.setColor('yellow');

  let i = 0;
  // io.writeLine('It works!!!');

  interval = setInterval(() => {
    io.write(`${i}:${String.fromCharCode(i)} `);
    i++;
  }, 10);

  return res(0); // 1 = error
}

function keylog(key) {
  if (key.type === 'f12') {
    clearInterval(interval);
    kb.onKeydown.remove(keylog);

    return resp(0);
  }

  return undefined;
}

exports.call = (cmd, args, api, res) => main(api, res);

exports.commands = ['unicode'];
