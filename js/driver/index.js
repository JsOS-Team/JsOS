'use strict';

const { log } = console; // FIXME: $$.logger;

class Driver {
  constructor(name, vendor = 'vendor', author = 'author') {
    this.NAME = name;
    this.VENDOR = vendor;
    this.AUTHOR = author;

    log(`Loading driver for ${vendor} => ${name} by ${author}`);
  }


  /**
   * @param  {string} name - Name like ibmpc/pcspeaker
   */
  static load(name) {
    try {
      return require(`./${name}`);
    } catch (e) {
      return e;
    }
  }
}

module.exports = Driver;
