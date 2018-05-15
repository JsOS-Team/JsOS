// Copyright 2015-present runtime.js project authors
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

class JsOSError {
  constructor(message, errcode, call) {
    let msg = '';

    if (errcode) msg += `${errcode}: `;
    if (message) {
      msg += message;
    }
    if (call) msg += `, ${call}`;
    const err = new Error(msg);

    err.code = errcode || '';
    err.syscall = call || '';

    return err;
  }
}

class IOError extends JsOSError {
  constructor(message, errcode, call) { // TODO: Normalize
    const msg = `[IO Error]: ${message}`;

    super(msg, errcode, call);
  }
}

class WTFError extends JsOSError {
  constructor(message, errcode, call) {
    const msg = `[WTF Error]: ${message}
    We don't understand how it was happened...
    Write to us: github.com/PROPHESSOR/JsOS/issues`;

    super(msg, errcode, call);
  }
}

class FatalError extends JsOSError {
  // constructor(message, )
  constructor() {
    // TODO: Write me...
    super('FatalError... But this error doesn\'t implemented...');
  }
}

class TerminalError {
  constructor(msg, errcode, call) {
    const output = typeof $$ !== 'undefined'
      ? $$.stdio.defaultStdio.writeError
      : debug;

    output(`Error ${msg} ${errcode ? `(${errcode})` : ''} ${call ? `[${call}]` : ''}`);
    console.error(msg); //eslint-disable-line
    console.error([errcode, call]); //eslint-disable-line
  }
}

class Warning extends Error {
  constructor(msg, name) {
    super();
    this.name = name;
    this.message = msg;
  }
}

module.exports = {
  Error,
  JsOSError,
  SystemError: JsOSError,
  IOError,
  WTFError,
  FatalError,
  Warning,
  TerminalError,
};
