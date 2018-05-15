/* Screenfetch
 * Copyright (c) 2017 PROPHESSOR
*/

'use strict';

const os = require('os');

let io;

// 38->
const prefix = [
  '                                       ',
  '                                       ',
  '                                       ',
  '                                       ',
  '                                       ',
  '      _          ___    ____           ',
  '     | |  ___   / _ \\  / ___|          ',
  '  _  | | / __| | | | | \\___ \\          ',
  ' | |_| | \\__ \\ | |_| |  ___) |         ',
  '  \\___/  |___/  \\___/  |____/          ',
  '                                       ',
  '                                       ',
  '                                       ',
  '                                       ',
  '                                       ',
  '                                       ',
  '                                       ',
  '                                       ',
  '                                       ',
];

const root = [
  ' ',
  ' OS: ',
  ' Kernel: ',
  ' Uptime: ',
  ' Packages: ',
  ' Shell: ',
  ' Resolution: ',
  ' DE: ',
  ' WM: ',
  ' Color theme: ',
  ' Color depth: ',
  ' Font: ',
  ' CPU: ',
  ' GPU: ',
  ' RAM: ',
  0,
  0,
  0,
  0,
];

const suffix = [
  () => `User@${os.hostname()}`,
  () => `JsOS version ${require('../../../package.json').version}`,
  () => `JsOS kernel version ${os.release()} ${os.arch()} (${os.endianness()})`,
  () => os.uptime(),
  () => PERSISTENCE.Apps._commands.length,
  () => 'JsOS-Shell',
  () => `${80}x${25}`,
  () => 'Terminal shell',
  () => undefined,
  () => `${$$.stdio.defaultStdio.color} :: ${$$.stdio.defaultStdio.bgcolor}`,
  () => 16,
  () => undefined,
  () => undefined,
  () => undefined,
  () => `${
    Number((__SYSCALL.memoryInfo().pmUsed / 1024 / 1024).toFixed(2))
  }M / ${
    Number((__SYSCALL.memoryInfo().pmTotal / 1024 / 1024).toFixed(2))
  }M`,
  0,
  0,
  0,
  0,
];

function main(cmd, args, api, res) {
  io = api.stdio;
  for (const i in prefix) { // eslint-disable-line
    io.setColor('cyan');
    io.write(`${prefix[i]} `);

    if (typeof root[i] === 'string') {
      io.setColor('green');
      io.write(root[i]);
    }

    if (typeof suffix[i] === 'function') {
      io.setColor('yellow');
      io.write(suffix[i]());
    }
    io.write('\n');
  }

  return res(0); // 1 = error
}

exports.call = main;// (cmd, args, api, res) => main(api, res);

exports.commands = ['screenfetch'];
