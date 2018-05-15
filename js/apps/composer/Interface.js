/*
 * Composer
 * Copyright (c) 2017 PROPHESSOR
*/

'use strict';

const io = $$.stdio.defaultStdio;

// ######################################################################################
class Interface {
  static render() {
    io.write(` 
 ##############################################################################
 #                          SpeakPlay (c) PROPHESSOR 2017                     #
 ##############################################################################\n
                                 Press F12 to exit\n\n\n\n\n\n\n
DURATION: ${note.duration}
OCTAVE: ${note.octave}\n\n\n\n\n\n\n\n\n
`);
  }
}

module.exports = Interface;
