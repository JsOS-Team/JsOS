/**
 *    Copyright 2018 JsOS authors
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

'use strict';

const llfs = require('./low-level');
const Utils = require('./utils');

const utils = new Utils(llfs);

const {
  log, success, error, warn,
} = $$.logger;

module.exports = {
  readdir(path, options = () => {}, callback = options) {
    let resolved = null;

    if (utils.isSystemPath(path)) {
      // Remove last splash
      if (path[path.length - 1] === '/') path = path.slice(0, path.length - 1);

      log(`${path} is a system path`, { level: 'fs' });

      const extpath = utils.extractSystemPath(path);

      log(`${path} extracted to ${extpath}`, { level: 'fs' });

      const find = __SYSCALL.initrdListFiles();

      // Set is faster than .filter((value, i, arr) => arr.indexOf(value) === i)
      const dirs = new Set(find
        .filter(findPath => findPath.slice(0, extpath.length + 1) === `${extpath}/`)
        .map(findPath => findPath.slice(extpath.length + 1))
        .map(name => name.split('/')[0]));

      success('OK!', { from: 'FS->readdir->System', level: 'fs' });
      callback(null, Array.from(dirs).sort());

      return;
    }

    try {
      resolved = utils.resolvePath(path);
    } catch (e) {
      callback(e);

      return;
    }
    if (resolved.level === 0) {
      const devices = $$.block.devices.map(device => device.name);

      devices.push('system');
      callback(null, devices);
    } else if (resolved.level >= 1) {
      llfs.getPartitions(resolved.parts[0]).then((partitions) => {
        if (resolved.level >= 2) {
          return partitions[resolved.parts[1]].getFilesystem();
        }
        callback(null, partitions.map((_, i) => `p${i}`));
      })
        .then((filesystem) => {
          if (resolved.level <= 1) return;

          /* if (resolved.level >= 3) {
          callback(new Error('Subdirectories aren\'t supported yet'));
        } */
          return filesystem.readdir(resolved.parts.slice(2).join('/'), callback);
        })

      /* .then(list => {
        if (resolved.level <= 1) return;
        callback(null, list.map(file => file.name), list);
      }) */
        .catch((err) => {
          callback(err);
        });
    }
  },

  /** Read file from system path or device
   * @param  {string} path - Path
   * @param  {object} [options] - Options
   * @param  {function} callback - Callback(error, result)
   */
  readFile(path, options = () => {}, callback = options) {
    let resolved = null;

    if (utils.isSystemPath(path)) {
      log(`${path} is a system path`, { level: 'fs' });

      const extpath = utils.extractSystemPath(path);

      log(`${path} extracted to ${extpath}`, { level: 'fs' });

      callback(null, __SYSCALL.initrdReadFile(extpath));
      success('OK!', { from: 'FS->readFile->System', level: 'fs' });

      return;
    }

    try {
      resolved = utils.resolvePath(path);
    } catch (e) {
      callback(e);

      return;
    }
    if (resolved.level >= 3) {
      llfs.getPartitions(resolved.parts[0]).then(partitions => partitions[resolved.parts[1]].getFilesystem())
        .then((filesystem) => {
          filesystem.readFile(resolved.parts.slice(2).join('/'), typeof options === 'string' ? { encoding: options } : options, callback);
        })
        .catch((err) => {
          callback(err);
        });
    } else {
      callback(new Error('Is a directory'));
    }
  },

  /** Returns file content (or buffer if encoding = 'buffer')
   * @param  {string} path - Path to file
   * @param  {string} [encoding='ascii'] - File encoding
   * @returns {string} or Buffer
   */
  readFileSync(path, encoding = 'ascii') {
    // TODO: buffer => binary
    if (utils.isSystemPath(path)) {
      log(`${path} is a system path`, { level: 'fs' });

      const extpath = utils.extractSystemPath(path);

      log(`${path} extracted to ${extpath}`, { level: 'fs' });

      success('OK!', { from: 'FS->readFile->System', level: 'fs' });

      return encoding === 'buffer'
        ? __SYSCALL.initrdReadFileBuffer(extpath)
        : __SYSCALL.initrdReadFile(extpath);
    }

    warn('readFileSync for external pathes doesn\'t implemented!', { from: 'fs->readFileSync' });

    return ''; // TODO:
  },

  writeFile(path, data, options = () => {}, callback = options) {
    let resolved = null;

    try {
      resolved = utils.resolvePath(path);
    } catch (e) {
      callback(e);

      return;
    }
    if (resolved.level >= 3) {
      llfs.getPartitions(resolved.parts[0]).then(partitions => partitions[resolved.parts[1]].getFilesystem())
        .then((filesystem) => {
          filesystem.writeFile(resolved.parts.slice(2).join('/'), data, typeof options === 'string' ? { encoding: options } : options, callback);
        })
        .catch((err) => {
          callback(err);
        });
    } else {
      callback(new Error('Is a directory'));
    }
  },
  mkdir(path, options = () => {}, callback = options) {
    let resolved = null;

    try {
      resolved = utils.resolvePath(path);
    } catch (e) {
      callback(e);

      return;
    }
    if (resolved.level >= 3) {
      llfs.getPartitions(resolved.parts[0]).then(partitions => partitions[resolved.parts[1]].getFilesystem())
        .then((filesystem) => {
          filesystem.mkdir(resolved.parts.slice(2).join('/'), options, callback);
        })
        .catch((err) => {
          callback(err);
        });
    } else {
      callback(new Error('Is a directory'));
    }
  },
};
