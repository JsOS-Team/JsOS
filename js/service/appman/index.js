// Copyright 2017-present jsos project authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

class App {
  constructor() {
    'do nothing';

    $$.shell.setCommand('start', {
      description: 'Run the app',
      usage: 'start <command> <arguments>',
      run: this.run,
    });
    this.isAppExist = this.isAppExist.bind(this);
    debug(`PERSISTENCE: ${PERSISTENCE}`);
  }

  install(name) {
    debug(`Installing app ${name}...`);

    let app;

    try {
      app = require(`../../apps/${name}`);
    } catch (e) {
      debug(e);

      return Boolean($$.stdio.defaultStdio.writeError(`Unable to install app ${name}`));
    }

    // Install app
    PERSISTENCE.Apps[name] = {
      run: app.call,
      commands: app.commands,
    };

    // Create links
    for (const i of app.commands) {
      PERSISTENCE.Apps._commands[i] = name;
      // $$.shell.setCommand(i, {
      //   description: 'Application',
      //   usage: `start ${i} <arguments>`,
      //   run: this.run,
      // });
    }

    debug(`App ${name} installed successful!`);

    return true;
    // return console.warn('Not implemented!');
  }

  run(__args, f, res) {
    // FIXME: Похоже на костыль
    const _args = __args.split(/\s+/);
    const app = _args.shift();

    function isAppExist(x) { // FIXME: Точно костыль, но спать хочется
      return Boolean(PERSISTENCE.Apps[x]); // || PERSISTENCE.Apps._commands[app]);
    }
    if (!isAppExist(app) || app === 0) {
      f.stdio.writeError(`App ${app} doesn't exist!`);

      return res('App doesn\'t exist!');
    }
    const args = _args.join(' ');

    /* const callback =  */

    try {
      PERSISTENCE.Apps[app].run(app, args, f, res);
    } catch (e) {
      f.stdio.writeError(`App ${app} crashed!`);
      debug(e);

      return res(1);
    }
    // return res(callback);
    // return console.warn('Not implemented!');
  }

  isAppExist(app) {
    return Boolean(PERSISTENCE.Apps[app]); // || PERSISTENCE.Apps._commands[app]);
  }

  runByCmd(cmd) {
    return this.run(this.cmd2app(cmd));
  }

  cmd2app(cmd) {
    return PERSISTENCE.Apps._commands[cmd] || 0;
  }
}

module.exports = new App();
