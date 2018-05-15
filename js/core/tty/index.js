// Copyright 2014-present runtime.js project authors
// Copyright 2017 JsOS project authors
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

const terminal = require('./terminal');

const {
  DARKGRAY, BLACK, YELLOW, GREEN, LIGHTGRAY,
} = terminal.color;

terminal.print(`

      _          ___    ____  
     | |  ___   / _ \\  / ___| 
  _  | | / __| | | | | \\___ \\ 
 | |_| | \\__ \\ | |_| |  ___) |
  \\___/  |___/  \\___/  |____/ 

`, 1, YELLOW);


terminal.print('\n Welcome to ', 1, LIGHTGRAY, BLACK);
terminal.print('JsOS ', 1, GREEN, BLACK);
terminal.print(`version ${require('../../../package.json').version}\n`, 1, DARKGRAY, BLACK);

terminal.print(' Type', 1, LIGHTGRAY, BLACK);
terminal.print(' help ', 1, YELLOW, BLACK);
terminal.print('to get list of commands\n\n', 1, LIGHTGRAY, BLACK);

module.exports = terminal;
