'use strict';

const fatfs = require('./fatfs');

class Partition {
  getFilesystem() {
    const device = this.device;
    const address = this.address;
    const size = this.size;
    const driver = {
      sectorSize: device.formatInfo.sectorSize,
      numSectors: size,
      readSectors(sector, dest, callback) {
        device.read(address + sector, dest).then(() => {
          callback();
        })
          .catch((err) => {
            callback(err);
          });
      },
      writeSectors(sector, data, callback) {
        device.write(address + sector, data).then(() => {
          callback();
        })
          .catch((err) => {
            callback(err);
          });
      },
    };

    return fatfs.createFileSystem(driver);
  }
}

function getDeviceByName(name) {
  let iface = null;

  for (const device of $$.block.devices) {
    if (device.name === name) iface = device;
  }
  if (!iface) return null;

  return iface;
}

function getPartitions(device) {
  return device.read(0, Buffer.allocUnsafe(device.formatInfo.sectorSize)).then(_buf => new Promise((resolve) => {
    const partitions = [];
    const buf = _buf.slice(0x1BE, 0x1BE + 64);

    for (let i = 0; i < 4; i++) {
      const partition = new Partition();
      const type = buf[i * 16 + 0x4];

      if (type) {
        partition.device = device;
        partition.type = type;
        partition.address = buf.readUInt32LE(i * 16 + 0x8);
        partition.size = buf.readUInt32LE(i * 16 + 0xC);
        partitions.push(partition);
      }
    }
    resolve(partitions);
  }));
}

module.exports = {
  getDeviceByName,
  getPartitions,
};
