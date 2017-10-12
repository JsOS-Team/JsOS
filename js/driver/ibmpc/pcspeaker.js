'use strict';

const driverUtils = require('../../core/driver-utils');

const ioPort43 = driverUtils.ioPort(0x43);
const ioPort42 = driverUtils.ioPort(0x42);
const ioPort61 = driverUtils.ioPort(0x61);

function stopSound() {
  ioPort61.write8(ioPort61.read8() & 0xFC);
}

function playSound(freq, duration) {
  const newfreq = freq >>> 0;
  const div = (1193180 / newfreq) >>> 0;
  ioPort43.write8(0xb6);
  ioPort42.write8(div & 0xff);
  ioPort42.write8((div >> 8) & 0xff);
  const tmp = ioPort61.read8();
  if (tmp !== (tmp | 3)) {
    ioPort61.write8(tmp | 3);
  }
  if (!duration) return;
  setTimeout(stopSound, duration);
}

module.exports = {};
module.exports.play = playSound;
module.exports.stop = stopSound;
module.exports.isPlaying = () => !!(ioPort61.read8() | 3);