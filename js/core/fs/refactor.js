/*
 * Copyright (c) 2017 PROPHESSOR
 * Based on https://raw.githubusercontent.com/charliesome/jsos/master/kernel/js/kernel/fs.js
 */

'use strict';

class Path {
  constructor(path) {
    if (path instanceof Path) {
      return path;
    }
    if (typeof path !== 'string') {
      throw new TypeError('path parameter must be a string or Path');
    }
    if (path[path.length - 1] === '/') {
      path = path.substr(0, path.length - 1);
    }
    const parts = path.split('/');

    if (parts[0] && parts[0].length !== 0) {
      throw new Error('path provided is not absolute');
    }
    this.parts = parts.slice(1);
    this.length = this.parts.length;

    this.toString = this.toString.bind(this);
    this.includes = this.includes.bind(this);
    this.equals = this.equals.bind(this);
    this.removePrefix = this.removePrefix.bind(this);
  }


  toString() {
    return `/${this.parts.join('/')}`;
  }

  includes(path) {
    path = new Path(path);
    for (let i = 0; i < this.length; i++) {
      if (this.parts[i] !== path.parts[i]) {
        return false;
      }
    }

    return true;
  }

  equals(path) {
    path = new Path(path);
    if (this.length !== path.length) {
      return false;
    }

    return this.includes(path);
  }

  removePrefix(prefix) {
    prefix = new Path(prefix);
    if (!prefix.includes(this)) {
      return null;
    }
    const parts = this.parts.slice(prefix.length);

    return new Path(`/${parts.join('/')}`);
  }

  normalize() {
    // TODO: Write me...
  }

  static normalize(/* path */) {
    // TODO: Write me...
  }
}

class Filesystem {
  constructor() {
    this.mountpoints = [];

    this.mount = this.mount.bind(this);
    this.unmount = this.unmount.bind(this);
    this.read = this.read.bind(this);
    this.find = this.find.bind(this);
    this.findMountpoint = this.findMountpoint.bind(this);
  }

  mount(path, fs) {
    path = new Path(path);
    if (typeof fs.init === 'function') {
      fs.init();
    }
    this.mountpoints.push({
      path,
      fs,
    });
  }

  unmount(path) {
    const mountpoint = this.findMountpoint(path);

    for (let i = 0; i < this.mountpoints.length; i++) {
      if (this.mountpoints[i] === mountpoint) {
        if (typeof mountpoint.fs.close === 'function') {
          mountpoint.fs.close();
        }
        this.mountpoints.splice(i, 1);

        return true;
      }
    }

    return false;
  }

  read(path) {
    const file = this.find(path);

    if (file === null || file.getType() !== 'file') {
      return null;
    }

    return file.readAllBytes();
  }

  find(path) {
    path = new Path(path);
    const mountpoint = this.findMountpoint(path);

    if (mountpoint === null) {
      return null;
    }

    return mountpoint.fs.find(path.removePrefix(mountpoint.path).toString());
  }

  findMountpoint(path) {
    path = new Path(path);
    let bestMatch = null;

    for (let i = 0; i < this.mountpoints.length; i++) {
      if (bestMatch === null || this.mountpoints[i].path.length > bestMatch.path.length) {
        if (this.mountpoints[i].path.includes(path)) {
          bestMatch = this.mountpoints[i];
        }
      }
    }

    return bestMatch;
  }
}

module.exports = {
  Filesystem,
  Path,
};
