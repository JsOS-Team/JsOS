/*
 * Composer
 * Copyright (c) 2017 PROPHESSOR
 */

'use strict';

const Notes = require('./Notes');

const { info, error, success } = $$.logger;

class Sound {
  constructor(notelist) {
    this.play = this.play.bind(this);

    this.sound = notelist.split(' ');
    this.tick_duration = 50;
  }

  play(res) {
    let position = 0;

    const tick = () => {
      const noteData = this.sound[position];
      const { duration, note, octave } = Notes.parse(noteData);

      Notes.setOctave(octave);
      const NOTE = Notes[Notes.keynotes[note]];
      const DURATION = Notes.duration2ms(duration);

      if (!DURATION) return error(`Duration ${duration} isn't supported!`) ^ res(1);

      if (note) {
        info(`Note: ${note}, Duration: 1/${duration}, Octave: ${octave}`, 0);
        $$.speaker.play(NOTE, DURATION);
      } else {
        return error(`I don't know note ${note}`) ^ res(1);
      }
      if (position < this.sound.length - 1) {
        position++;
        setTimeout(tick, DURATION);
      } else {
        success('End!', 0);
        res(0);
      }
    };

    tick();
  }

  stop() {} // TODO:

  save() {} // TODO:

  load() {} // TODO:

  static compress() {}
}

module.exports = Sound;
