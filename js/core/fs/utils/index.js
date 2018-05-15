'use strict';

let llfs = null;

class PathUtils {
  /**
   * @constructor
   * @param  {object} fsapi - Low-level file system API
   */
  constructor(fsapi) {
    llfs = fsapi;
  }

  resolvePath(path) {
    const spl = path.split('/');

    if (spl[spl.length - 1] === '') spl.pop();
    if (spl[0]) throw new Error('Path is not absolute');
    let level = spl.length - 1;

    if (level < 0) level = 0;
    if (level >= 1) {
      const device = llfs.getDeviceByName(spl[1]);

      if (!device) throw new Error(`No device ${spl[1]}`);
      spl[1] = device;
      if (level >= 2) {
        if (!(/^p\d+$/).test(spl[2])) {
          throw new Error(`Invalid partition name ${spl[2]}`);
        }
        spl[2] = Number(spl[2].slice(1));
      }
    }

    return {
      level,
      parts: spl.slice(1),
    };
  }

  /** Returns true if path starts from /system
   * @param  {string} path - Path
   * @returns {bool} true/false
   */
  isSystemPath(path) {
    if (typeof path !== 'string') throw new TypeError('path must be a String');

    return path.slice(0, 7) === '/system';
  }

  /** Extracts (remove /system) kernel path from the system path
   * @param  {string} path - system path
   * @returns {string} initrd kernel path
   */
  extractSystemPath(path) {
    if (this.isSystemPath(path)) {
      return path.slice(7);
    }
    throw new Error('path is not a system path');
  }
}

module.exports = PathUtils;
