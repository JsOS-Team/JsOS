/*
 * Composer
 * Copyright (c) 2017 PROPHESSOR
*/

'use strict';

const DURATION = 50;
const MIN_OCTAVE = 1;
const MAX_OCTAVE = 7;


class Note {
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

  setOctave(octave) {
    if (octave >= MIN_OCTAVE && octave <= MAX_OCTAVE) this.octave = octave;
  }

  upOctave() {
    return this.octave === MAX_OCTAVE ? this.octave : ++this.octave;
  }

  downOctave() {
    return this.octave === MIN_OCTAVE ? this.octave : --this.octave;
  }

  parse(str) {
    const regexp = /(\d+)(\w)(\d)/;
    const [, duration, note, octave] = regexp.exec(str);

    return {
      duration,
      note,
      octave,
    };
  }

  duration2ms(duration) {
    // bpm   ¼	  1		 ½   ⅛  1/16
    // 120	500	2000 1000	250	125
    switch (Number(duration)) {
      case 1:
        return 2000;
      case 2:
        return 1000;
      case 4:
        return 500;
      case 8:
        return 250;
      case 16:
        return 125;
      default:
        return null;
    }
  }

  get notes() {
    return ['C', 'c', 'D', 'd', 'E', 'F', 'f', 'G', 'f', 'A', 'a', 'h'];
  }

  get octaver() {
    return Math.pow(2, this.octave - 2);
  }

  get keynotes() {
    return {
      C: 'C',
      c: 'CD',
      D: 'D',
      d: 'DD',
      E: 'E',
      F: 'F',
      f: 'FD',
      G: 'G',
      g: 'GD',
      A: 'A',
      a: 'AD',
      H: 'H',
    };
  }

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
}

module.exports = new Note();
