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

const processor = require('./index.js');

const { log, warn } = $$.logger;

debug('Loading commands...');

const cmds = {
  shutdown: {
    description: 'Shut down the computer',
    usage: 'shutdown',
    run(args, f, res) {
      warn('Shutting down...');
      $$.machine.shutdown();

      return res(0);
    },
  },
  suspend: {
    description: 'Suspend the computer',
    usage: 'suspend',
    run(args, f, res) {
      warn('Suspending...');
      $$.machine.suspend();

      return res(0);
    },
  },
  reboot: {
    description: 'Reboot the computer',
    usage: 'reboot',
    run(args, f, res) {
      warn('Rebooting...');
      $$.machine.reboot();

      return res(0);
    },
  },
  echo: {
    description: 'Display text into the screen',
    usage: 'echo <text>',
    run(suffix, f, res) {
      f.stdio.onwrite(suffix);

      return res(0);
    },
  },
  clear: {
    description: 'Clear the display',
    usage: 'clear',
    run(a, f, res) {
      f.stdio.clear();

      return res(0);
    },
  },
  help: {
    description: 'Show this message or show usage of the command =)',
    usage: 'help <command>',
    run(_args, f, res) {
      let args = _args.trim();

      if (!args) {
        f.stdio.writeLine('Commands list:');
        // let out = 'Commands list:\n';
        for (const i of processor.getCommands()) {
        //   out += `${i}: ${processor.getDescription(i)}\n`;
          f.stdio.setColor('yellow');
          f.stdio.write(i);
          f.stdio.setColor('white');
          f.stdio.writeLine(`: ${processor.getDescription(i)}`);
        }
        // f.stdio.write(out);
      } else {
        args = args.split(/\s+/)[0]; // Safety
        f.stdio.setColor('lightcyan');
        f.stdio.write(processor.getUsage(args));
      }

      return res(0);
    },
  },
  dns: {
    description: 'Get DNS namespace from url',
    usage: 'dns <url>',
    run(_args, env, cb) {
      const $ = env.stdio;
      const args = _args.trim();

      if (!args) {
        $.writeError('You forgot to enter the URL');

        return cb(0);
      }
      $.setColor('yellow');
      $.writeLine(`Sending request to ${args}...`);
      runtime.dns.resolve(args, {}, (err, data) => {
        if (err) {
          $.writeError('Error!');

          return cb(1);
        }
        log(JSON.stringify(data));
        if (data.results[0]) {
          $.setColor('green');
          $.writeLine('OK!');
          $.writeLine(JSON.stringify(data, null, 4));
        } else {
          $.setColor('red');
          $.writeLine('Error: Does URL exist?');
        }
        cb(0);
      });
    },
  },
  time: {
    description: 'Display the current time',
    usage: 'time',
    run(a, f, res) {
      f.stdio.setColor('yellow');
      f.stdio.writeLine(`${(new Date()).toLocaleTimeString()}`);

      return res(0);
    },
  },
  date: {
    description: 'Display the current date',
    usage: 'date',
    run(a, f, res) {
      f.stdio.setColor('yellow');
      f.stdio.writeLine(`${(new Date()).toDateString()}`);

      return res(0);
    },
  },
  install: {
    description: 'Install applications',
    usage: 'install <app>',
    run(app, f, res) {
      if ($$.appman.install(app.trim())) {
        f.stdio.setColor('green');
        f.stdio.writeLine(`App ${app} installed successful!`);

        return res(0);
      }
      f.stdio.writeError(`Error happened during ${app} installation`);

      return res(1);
    },
  },
  speaker: {
    description: 'Beep',
    usage: 'speaker <play/stop> <frecuency> <duration>',
    run(_args, f, res) {
      const args = _args.split(/\s+/);
      const mode = args[0];
      const frec = Number(args[1]) || 1000;
      const duration = Number(args[2]) || 1000;

      if (mode === 'play') {
        $$.speaker.play(frec, duration);
        f.stdio.writeLine(`Playing ${frec} Hz at ${duration} ms...`);

        return res(0);
      } else if (mode === 'stop') {
        $$.speaker.stop();
        f.stdio.writeLine('Stop.');

        return res(0);
      }
      f.stdio.writeError('Use "play" or "stop"!');

      return res(1);
    },
  },
  listparts: {
    description: 'List HDD partitions',
    usage: 'listparts <device>',
    run(_args, f, res) {
      // debug(JSON.stringify($$.block.devices));
      const args = _args.trim();
      let iface;

      for (const device of $$.block.devices) {
        if (device.name === args) iface = device;
      }
      if (!iface) return res(1);

      iface.read(0, Buffer.allocUnsafe(512)).then((_buf) => {
        let firstsec;
        const buf = _buf.slice(0x1BE, 0x1BE + 64);

        for (let i = 0; i < 4; i++) {
          log(buf[i * 16 + 4]);
          if (buf[i * 16 + 4]) {
            f.stdio.writeLine(`[${i}]:`);
            f.stdio.writeLine(`  type: 0x${buf[i * 16 + 4].toString(16)}`);
            f.stdio.writeLine(`  size: ${buf.readUInt32LE((i * 16) + 0xC) / 1024 / 1024 * 512}M`); //eslint-disable-line

            firstsec = buf.readUInt32LE(i * 16 + 0x8);
          }
        }
        log(firstsec);

        return iface.read(firstsec, buf);
      })
        .then((fsbuf) => {
          f.stdio.writeLine('  assumming that FS is FAT, header:');
          f.stdio.writeLine(`    created with: ${fsbuf.toString('utf8', 3, 11)}`);
          f.stdio.writeLine(`    bytes per sector: ${fsbuf.readUInt16LE(11)}`);
          f.stdio.writeLine(`    sectors per cluster: ${fsbuf[13]}`);
          f.stdio.writeLine(`    ${fsbuf.readUInt16LE(14)} sectors reserved`);
          f.stdio.writeLine(`    ${fsbuf.readUInt16LE(22)} sectors per FAT`);
          f.stdio.writeLine(`    ${fsbuf.toString('utf8', 54, 62)}`);
          f.stdio.writeLine(`    rootdir cluster: ${fsbuf.readUInt16LE(512)}`);
          res(0);
        })
        .catch((err) => {
          f.stdio.writeError(err);
          res(1);
        });
    },
  },
  ls: {
    description: 'List files in directory',
    usage: 'ls /<drive>/<partition>',
    run(args, f, res) {
      const fs = require('fs');
      // const filesize = require('../../utils/filesize');

      fs.readdir(args, 'utf8', (err, list) => {
        if (err) {
          f.stdio.writeError(err);

          return res(1);
        }
        for (const name of list) f.stdio.writeLine(`------ ${name}`);
        res(0);
      });

      /* const fs = require('fs');
      const device = fs.getDeviceByName(args[0]);
      const partition = +(args[1][1]);
      fs.getPartitions(device).then((parts) => parts[partition].getFilesystem())
        .then(filesystem => {
          return filesystem.getFileList();
        }).then(fileList => {
          for (const name of fileList) f.stdio.writeLine(name);
          res(0);
        }); */
    },
  },
  cat: {
    description: 'Show file contents',
    usage: 'cat <file>',
    run(args, f, res) {
      const fs = require('fs');

      fs.readFile(args, 'utf8', (err, data) => {
        if (err) {
          f.stdio.writeError(err);

          return res(1);
        }
        f.stdio.write(data);

        return res(0);
      });
    },
  },
  mkdir: {
    description: 'Make directory',
    usage: 'mkdir <path>',
    run(args, f, res) {
      const fs = require('fs');

      fs.mkdir(args, (err) => {
        if (err) {
          f.stdio.writeError(err);

          return res(1);
        }
        res(0);
      });
    },
  },
  wget: {
    description: 'Print data from HTTP request',
    usage: 'wget <url>',
    run(args, f, result) {
      const http = require('http');

      try {
        http.get(args, (res) => {
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            f.stdio.write(chunk);
          });
          res.on('end', () => {
            f.stdio.writeLine('');
            result(0);
          });
        });
      } catch (err) {
        f.stdio.writeError('wget command error');
        result(1);
      }
    },
  },
  meminfo: {
    description: 'Information about RAM',
    usage: 'meminfo',
    run(args, f, res) {
      const info = __SYSCALL.memoryInfo();

      f.stdio.writeLine(`MEM:  ${
        Number((info.pmUsed / 1024 / 1024).toFixed(2))
      }M / ${
        Number((info.pmTotal / 1024 / 1024).toFixed(2))
      }M`);
      f.stdio.writeLine(`HEAP: ${
        Number((info.heapUsed / 1024 / 1024).toFixed(2))
      }M / ${
        Number((info.heapTotal / 1024 / 1024).toFixed(2))
      }M`);

      return res(0);
    },
  },
  jsmb: {
    description: 'Initialize global jsmb variable',
    usage: 'jsmb',
    run(args, f, res) {
      global.jsmb = require('../../core/graphics/jsmb-pseudo');
      f.stdio.writeLine('JsMobileBasic initialized!');

      return res(0);
    },
  },
};

/* eslint no-restricted-syntax:0, guard-for-in:0 */
for (const i in cmds) {
  processor.setCommand(i, cmds[i]);
}

debug('Commands loaded successful!');

module.exports = cmds;
