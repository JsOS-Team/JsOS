/*
 * Logger library by PROPHESSOR (2017)
 *
 * Simple usage:
 * Log.setLevels(["name of level"]);
 * Log.log/warn/error/info("message", { //optional object
 * 	noconvert: true/false, //Disable convertion (timestamps and else)
 * 	level: "name of level"
 * });
 * Log.log("message");
 * Log.log("message", {noconvert:true});
 */
// /* eslint-disable */

'use strict';

/* eslint-disable no-console */
/* eslint-disable no-negated-condition */


let io;

class Logger {
  constructor(stdio) {
    io = stdio.defaultStdio;

    this.log = this.log.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
    this.info = this.info.bind(this);
    this.success = this.success.bind(this);
    this.setLevels = this.setLevels.bind(this);
    this.removeLevel = this.removeLevel.bind(this);
    this.setCallback = this.setCallback.bind(this);

    this.levels = [];
    this.callbacks = {
      log() {},
      error() {},
      warn() {},
      info() {},
      success() {},
    };
  }


  /**
   * Advance console.log
   * @param  {any} data
   * @param  {object} options - Options
   * @param  {undefined} options - We'll consider that this is {}
   * @param  {any} options - Disable "[LOG]:"
   */
  log(data, options = {}) {
    let out = data;

    if (typeof options === 'object') { // It can be a number (0)/boolean (false)/string ('') etc.
      if (options.level && this.levels.indexOf(options.level) < 0) return this;
      out = !options.noconvert ? Logger.convert(data) : data;
    }

    console.log(`[LOG]: ${out}`);
    this.callbacks.log(out); // cyan

    return this;
  }

  /**
   * Advance console.warn
   * @param  {any} data
   * @param  {object} options - Options
   * @param  {undefined} options - We'll consider that this is {}
   * @param  {any} options - Disable "[WARN]:"
   */
  warn(data, options = {}) {
    let out = data;

    if (typeof options === 'object') { // It can be a number (0)/boolean (false)/string ('') etc.
      if (options.level && this.levels.indexOf(options.level) < 0) return this;
      if (!options.noconvert) out = Logger.convert(data);
      out = `[WARN]: ${out}`;
    }

    const tmpcolor = io.color;

    io.setColor('yellow');
    io.writeLine(out);
    io.setColor(tmpcolor);
    console.warn(out);
    this.callbacks.warn(out);

    return this;
  }

  /**
   * Advance console.error
   * @param  {any} data
   * @param  {object} options - Options
   * @param  {undefined} options - We'll consider that this is {}
   * @param  {any} options - Disable "[ERROR]:"
   */
  error(data, options = {}) {
    let out = data;

    if (typeof options === 'object') { // It can be a number (0)/boolean (false)/string ('') etc.
      if (options.level && this.levels.indexOf(options.level) < 0) return this;
      if (!options.noconvert) out = Logger.convert(data);
      out = `[ERROR]: ${out}`;
    }

    const tmpcolor = io.color;

    io.setColor('red');
    io.writeLine(out);
    io.setColor(tmpcolor);
    console.error(out);
    this.callbacks.error(out);

    return this;
  }

  /**
   * Advance console.info
   * @param  {any} data
   * @param  {object} options - Options
   * @param  {undefined} options - We'll consider that this is {}
   * @param  {any} options - Disable "[INFO]:"
   */
  info(data, options = {}) {
    let out = data;

    if (typeof options === 'object') { // It can be a number (0)/boolean (false)/string ('') etc.
      if (options.level && this.levels.indexOf(options.level) < 0) return this;
      if (!options.noconvert) out = Logger.convert(data);
      out = `[INFO]: ${out}`;
    }

    const tmpcolor = io.color;

    io.setColor('cyan');
    io.writeLine(out);
    io.setColor(tmpcolor);
    console.info(out);
    this.callbacks.info(out);

    return this;
  }

  /**
   * Analog of info but green
   * @param  {any} data
   * @param  {object} options - Options
   * @param  {undefined} options - We'll consider that this is {}
   * @param  {any} options - Disable "[SUCCESS]:"
   */
  success(data, options = {}) {
    let out = data;

    if (typeof options === 'object') { // It can be a number (0)/boolean (false)/string ('') etc.
      if (options.level && this.levels.indexOf(options.level) < 0) return this;
      if (!options.noconvert) out = Logger.convert(data);
      out = `[SUCCESS]: ${out}`;
    }

    const tmpcolor = io.color;

    io.setColor('green');
    io.writeLine(out);
    io.setColor(tmpcolor);
    console.log(out);
    this.callbacks.success(out);

    return this;
  }

  setLevels(levels) {
    if (levels instanceof Array) {
      this.levels = levels;
    } else if (typeof levels === 'string') {
      this.levels.push(levels);
    } else {
      this.log(new Error('Levels must be a Array or String'));
    }

    return this;
  }

  removeLevel(level) {
    const idx = this.levels.indexOf(level);

    if (idx >= 0) {
      this.levels.splice(idx, 1);
    }

    return this;
  }

  setCallback(event, callback = () => {}) {
    if (!this.callbacks[event]) return this.log(new Error(`[LOGGER]: Invalid event ${event}`));
    this.callbacks[event] = callback;

    return this;
  }


  static convert(data) {
    let out = data;
    let error = null;

    if (out instanceof Error) {
      error = out;
      out = out.message;
    }

    if (typeof out === 'object') {
      try {
        out = JSON.stringify(out);
      } catch (e) {
        // Ok...
      }
    }

    if (error) {
      console.error(error.stack); // Debug
    }

    return out; // Logger.timestamp(out);
  }

  static timestamp(data) {
    return `[${Date.now()}] ${data}`;
  }
}

module.exports = Logger;


/*
 * TODO:
 * {rule:'console/file'}
 */
