'use strict';

const fs = require('../fs');

const _path = Symbol('path');
const _data = Symbol('data');

class Storage {
  constructor(path = null) {
    this[_data] = new Map();
    this.path = path;
  }
  get(name) {
    return this[_data].get(name);
  }
  set(name, value) {
    return this[_data].set(name, value);
  }
  save(callback) {
    const data = JSON.stringify([...this[_data]]);

    return fs.writeFile(this.path, data, 'utf8', callback || (() => {}));
  }
  load() {
    return fs.readFile(this.path, 'utf8', (data) => {
      this[_data] = new Map(JSON.parse(data));
    });
  }
  set path(val) {
    this[_path] = val;
    if (val) {
      this.load();
    }

    return val;
  }
  get path() {
    return this[_path];
  }
}

module.exports = Storage;
