'use strict';

/* global $$ */

const driverUtils = require('../../core/driver-utils');

class ATA {
  constructor(firstPort, interrupt, isSlave) {
    this.ports = [];

    for (let i = 0; i < 8; i++) {
      this.ports[i] = driverUtils.ioPort(firstPort + i);
    }

    // this.driveSelect = isSlave ? 0x50 : 0x40;
    this.isSlave = isSlave;
    this.driveSelect = isSlave ? 0xF0 : 0xE0;

    this.formatInfo = { sectorSize: 512 };

    this.read = this.read.bind(this);
    this.isOnline = this.isOnline.bind(this);
    this.write = this.write.bind(this);
  }
  read(sector, u8) {
    const numSectors = u8.length / 512;

    return new Promise((resolve, reject) => {
      if (!this.isOnline()) return reject(new Error('Device isn\'t online'));

      this.ports[6].write8(this.driveSelect | sector >> 24 & 0x0F);
      this.ports[2].write8(numSectors);
      this.ports[3].write8(sector & 0xff);
      this.ports[4].write8(sector >> 8 & 0xff);
      this.ports[5].write8(sector >> 16 & 0xff);
      this.ports[7].write8(0x20);

      while (this.ports[7].read8() & 0x80) __SYSCALL.halt();

      while (!(this.ports[7].read8() & 8)) __SYSCALL.halt();

      if (this.ports[7].read8() & 0x1 || this.ports[7].read8() & 0x20) { return reject(new Error('I/O error')); }

      for (let i = 0; i < numSectors * 256; i++) {
        const data = this.ports[0].read16();

        u8[i * 2 + 1] = data >> 8 & 0xFF;
        u8[i * 2] = data & 0xFF;
      }
      this.ports[7].read8();
      this.ports[7].read8();
      this.ports[7].read8();
      this.ports[7].read8();
      // console.log(!!(this.ports[7].read8() & 8));
      return resolve(u8);
    });
  }
  write(sector, u8) {
    const numSectors = u8.length / 512;

    console.log(numSectors);

    return new Promise((resolve, reject) => {
      if (!this.isOnline()) return reject(new Error('Device isn\'t online'));

      this.ports[6].write8(this.driveSelect | sector >> 24 & 0x0F);
      this.ports[2].write8(numSectors);
      this.ports[3].write8(sector & 0xff);
      this.ports[4].write8(sector >> 8 & 0xff);
      this.ports[5].write8(sector >> 16 & 0xff);
      this.ports[7].write8(0x30);

      while (this.ports[7].read8() & 0x80) __SYSCALL.halt();

      while (!(this.ports[7].read8() & 8)) __SYSCALL.halt();

      if (this.ports[7].read8() & 0x1 || this.ports[7].read8() & 0x20) { return reject(new Error('I/O error')); }

      for (let i = 0; i < numSectors * 256; i++) {
        const data = u8[i * 2] | u8[i * 2 + 1] << 8;

        this.ports[0].write16(data);
      }
      this.ports[7].write8(0xE7);

      while (this.ports[7].read8() & 8) this.ports[0].write16(0); // FIXME: WTF???? read breaks without this

      return resolve(u8);
    });
  }
  isOnline() {
    return true; // TODO: really check if online
  }
}

console.log(JSON.stringify($$));

$$.block.registerDevice(new $$.block.BlockDeviceInterface('hd', new ATA(0x1F0, 14, false)));
$$.block.registerDevice(new $$.block.BlockDeviceInterface('hd', new ATA(0x1F0, 14, true)));
$$.block.registerDevice(new $$.block.BlockDeviceInterface('hd', new ATA(0x170, 15, false)));
$$.block.registerDevice(new $$.block.BlockDeviceInterface('hd', new ATA(0x170, 15, true)));

/* $$.block.registerDevice(new $$.block.BlockDeviceInterface('hd', new ATA(0x1E8, false)));
$$.block.registerDevice(new $$.block.BlockDeviceInterface('hd', new ATA(0x1E8, true)));
$$.block.registerDevice(new $$.block.BlockDeviceInterface('hd', new ATA(0x168, false)));
$$.block.registerDevice(new $$.block.BlockDeviceInterface('hd', new ATA(0x168, true))); */
