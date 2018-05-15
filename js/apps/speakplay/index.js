// SpeakPlay for JsOS
// By PROPHESSOR

'use strict';

const DURATION = 50;
const MIN_OCTAVE = 1;
const MAX_OCTAVE = 7;

let io, kb, resp; //eslint-disable-line


const note = new class Note {
  constructor() {
    this.octave = 4;
    this.duration = DURATION;
  }

  convert(note) {
    return note * this.octaver;
  }

  upDuration() {
    return this.duration += 10;
  }

  downDuration() {
    return this.duration === 10 ? this.duration : this.duration -= 10;
  }

  upOctave() {
    return this.octave === MAX_OCTAVE ? this.octave : ++this.octave;
  }

  downOctave() {
    return this.octave === MIN_OCTAVE ? this.octave : --this.octave;
  }


  get octaver() {
    return Math.pow(2, this.octave - 2);
  }

  get keynotes() {
    return {
      z: 'C',
      s: 'CD',
      x: 'D',
      d: 'DD',
      c: 'E',
      v: 'F',
      g: 'FD',
      b: 'G',
      h: 'GD',
      n: 'A',
      j: 'AD',
      m: 'H',

      ',': 'CP',
      l: 'CDP',
      '.': 'DP',
      ';': 'DDP',
      '/': 'EP',
      q: 'CP',
      '2': 'CDP', //eslint-disable-line
      w: 'DP',
      '3': 'DDP', //eslint-disable-line
      e: 'EP',
      r: 'FP',
      '5': 'FDP', //eslint-disable-line
      t: 'GP',
      '6': 'GDP', //eslint-disable-line
      y: 'AP',
      '7': 'ADP', //eslint-disable-line
      u: 'HP',
      i: 'CPP',
      '9': 'CDPP', //eslint-disable-line
      o: 'DPP',
      '0': 'DDPP', //eslint-disable-line
      p: 'EPP',
      '[': 'FPP',
      '=': 'FDPP',
      ']': 'GPP',
    };
  }

  // [z - m]

  get C() {
    return this.convert(65);
  }

  get CD() {
    return this.convert(69);
  }

  get D() {
    return this.convert(73);
  }
  get DD() {
    return this.convert(78);
  }
  get E() {
    return this.convert(82);
  }
  get F() {
    return this.convert(87);
  }
  get FD() {
    return this.convert(92);
  }

  get G() {
    return this.convert(98);
  }

  get GD() {
    return this.convert(104);
  }

  get A() {
    return this.convert(110);
  }

  get AD() {
    return this.convert(116);
  }

  get H() {
    return this.convert(123);
  }

  // [, - /] U [q - u]

  get CP() {
    return this.convert(131);
  }

  get CDP() {
    return this.convert(139);
  }

  get DP() {
    return this.convert(147);
  }
  get DDP() {
    return this.convert(156);
  }
  get EP() {
    return this.convert(165);
  }
  get FP() {
    return this.convert(175);
  }
  get FDP() {
    return this.convert(185);
  }

  get GP() {
    return this.convert(196);
  }

  get GDP() {
    return this.convert(208);
  }

  get AP() {
    return this.convert(220);
  }

  get ADP() {
    return this.convert(233);
  }

  get HP() {
    return this.convert(247);
  }

  // [i - ]]

  get CPP() {
    return this.convert(262);
  }

  get CDPP() {
    return this.convert(277);
  }

  get DPP() {
    return this.convert(294);
  }
  get DDPP() {
    return this.convert(311);
  }
  get EPP() {
    return this.convert(330);
  }
  get FPP() {
    return this.convert(349);
  }
  get FDPP() {
    return this.convert(370);
  }

  get GPP() {
    return this.convert(392);
  }
}();

class Interface {
  // region eol
// ######################################################################################
  static render() {
    io.write(` 
 ##############################################################################
 #                          SpeakPlay (c) PROPHESSOR 2017                     #
 ##############################################################################

                                 Press F12 to exit







DURATION: ${note.duration}
OCTAVE: ${note.octave}









`);
  }
  // endregion eol
}

function main(api, res) {
  io = api.stdio;
  kb = api.keyboard;
  resp = res;

  io.setColor('pink');
  kb.onKeydown.add(keylog);
  Interface.render();
  // return res(0); // 1 = error
}

function keylog(key) {
  switch (key.type) {
    case 'f12':
      stop();
      break;
    case 'kpup':
      note.upOctave();
      break;
    case 'kpdown':
      note.downOctave();
      break;
    case 'kpleft':
      note.downDuration();
      break;
    case 'kpright':
      note.upDuration();
      break;
    default:
  }
  if (note.keynotes[key.character]) {
    $$.speaker.play(note[note.keynotes[key.character]], note.duration);
  }

  Interface.render();

  return false;
}

function stop() {
  io.setColor('yellow');
  io.writeLine('Synthezier stoped');
  kb.onKeydown.remove(keylog);
  io.clear();

  return resp(0);
}

exports.call = (cmd, args, api, res) => main(api, res);

exports.commands = ['speakplay'];
