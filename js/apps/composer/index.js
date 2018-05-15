/*
 * Composer for JsOS
 * Copyright (c) 2017 PROPHESSOR
*/

'use strict';

// const Cursor = require('./Cursor');
// const Interface = require('./Interface'); //TODO: Interface
const Sound = require('./Sound');

function main(api, res, args) {
  const io = api.stdio;

  io.setColor('pink');
  io.writeLine(`Playing: ${args}`);

  const sound = new Sound(args);

  sound.play(res);
}

exports.call = (cmd, args, api, res) => main(api, res, args);

exports.commands = ['composer'];
