// JsOS Pseudo-Graphics demonstrate
// By PROPHESSOR

'use strict';

const JsMB = require('../../core/graphics/jsmb-pseudo');
const UI = require('../../core/tty/pseudo-graphics');

const scw = JsMB.screenWidth();
const sch = JsMB.screenHeight();

let io,
  resp,
  kb,
  window;

let page = 0;
let demonstration = false;

function draw() {
  window = new UI.Window('Pseudo-GUI Demonstration');

  const startbtn = new UI.Button('Start');

  startbtn.once('click', () => {
    demonstration = true;
    page++;
    sdraw();
  });
  window.addButton(startbtn);

  const exitbtn = new UI.Button('Exit', 0x4);

  exitbtn.once('click', exit);
  window.addButton(exitbtn);
}

function sdraw() {
  if (!demonstration) return;
  JsMB
    .cls()
    .setColor(0xF)
    .setBackColor(0x0);
  switch (page) {
    case 1:
      JsMB.fillScreen(0x2);
      break;
    case 2:
      JsMB
        .fillScreen(0xA)
        .setColor(0xC)
        .drawRect(0, 0, scw, sch);
      break;
    case 3:
      JsMB
        .fillScreen(0xA)
        .setColor(0xC)
        .drawArc(scw / 2, sch / 2, 5);
      break;
    case 4:
      JsMB
        .fillScreen(0xA)
        .setColor(0xC)
        .drawArc(scw / 4, sch / 4, 5)
        .drawArc(3 * scw / 4, sch / 4, 5)
        .drawLine(scw / 4 + 5, 7 * sch / 8, 3 * scw / 4 - 5, 7 * sch / 8);
      break;
    case 5:
      JsMB
        .drawLine(0, 0, scw, 0)
        .setColor(0x4)
        .setBackColor(0xF)
        .drawString('LOL', scw / 2 - 1, 0);
      break;
    case 6:
      JsMB
        .fillScreen(0xC)
        .setColor(0xB)
        .drawCube(0, 0, scw - 5, sch - 5, 5);
      break;
    case 7:
      return exit();
    default:
      throw new (require('errors').WTFError)(`Page ${page} doesn't exist!`);
  }
}

function onKeyDown(key) {
  switch (key.type) {
    case 'f12':
      return exit();
    case 'kpleft':
      if (!demonstration) return window.prevButton();
      break;
    case 'enter':
      if (!demonstration) return window.pressButton();
      break;
    case 'kpright':
      if (!demonstration) return window.nextButton();
      break;
    default:
      if (!demonstration) return;
      break;
  }
  page++;
  sdraw();
}

function exit() {
  page = 0;
  kb.onKeydown.remove(onKeyDown);
  JsMB.cls();

  return resp(0);
}

function main(api, res) {
  io = api.stdio;
  kb = api.keyboard;
  resp = res;

  kb.onKeydown.add(onKeyDown);
  io.setColor('yellow');
  io.writeLine('Press any button to start or F12 to exit!');
  io.clear();
  draw();
}

exports.call = (cmd, args, api, res) => main(api, res);

exports.commands = ['pgtest'];
