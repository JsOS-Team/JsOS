let hex2rgbString = require('rgb'),
  x256 = require('../x256'),
  rgbRegExp = /(\d+),(\d+),(\d+)/;

/*
	mauve does colors stuff, but with less error checking + all 256 xterm colors rendered from hex
*/

let mauve;

function getPrefix(scheme) {
  // Handle the CSS here TODO: bold
  return `<span style="${
    scheme.fg ? `color:${scheme.fg};` : ''
  }${scheme.bg ? `background-color:${scheme.bg};` : ''
  }${scheme.misc ? 'font-weight:700;' : ''
  }">`;
}

mauve = function (raw) {
  const freshString = new String(raw);

  if (typeof window !== 'undefined') { // || !document.getElementsById('terminals')) {
    for (var scheme in mauve.hash) {
      freshString[mauve.hash[scheme].name] = new String(`${getPrefix(mauve.hash[scheme]) + raw}</span>`);
      freshString[mauve.hash[scheme].name].substring = function () {
        return `${getPrefix(mauve.hash[scheme]) + raw.substring(...arguments)}</span>`;
      };
    }
  }

  return freshString;
};

mauve.hash = {};

mauve.set = function (name, color) {
// Pass k, v of item name and ideal color
  // Allow setting via a hash, i.e. "set theme"
  if (typeof name === 'object') {
    for (const i in name) {
      this.set(i, name[i]);
    }

    return;
  }

  const scheme = {};

  var fg = false;
  var bg = false;
  let misc = false;

  if (color.indexOf('#') > -1) {
    const colors = color.split('/');
    var fg = colors[0].length ? hex2Address(colors[0]) : false;

    scheme.fg = colors[0];
    var bg = colors[1] ? hex2Address(colors[1]) : false;

    scheme.bg = colors[1];
    this.hash[name] = scheme;
    this.hash[name].name = name;
  } else {
    switch (color) {
      case 'bold':
        misc = '\u001B\u0001';
        this.hash[name] = {
          misc: 'bold',
          name,
        };
        break;
    }
  }

  // In node, ammend this TODO: kill this in favor of above strategy.
  if (typeof window === 'undefined') { // || document.getElementById('terminals') ) { //node or substack unix
    // When called, overwrite the substring method to ignore the added characters
    String.prototype.substring = function (start, end) {
      if (start === end) return '';
      if (!end) end = this.length;
      let text = '';
      const raw = this.split('');
      let index = 0;
      let inEscape = false;
      let curChar;
      let currentCommand = '';

      while (index < start) {
        curChar = raw.shift();
        if (inEscape) {
          currentCommand += curChar;
          if (curChar === 'm') {
            inEscape = false;
          }
          continue;
        } else {
          if (curChar === '\u001B') {
            inEscape = true;
            currentCommand = curChar;
            continue;
          }
          index++;
        }
      }

      // If there is current formatting, apply it.
      if (currentCommand !== '\u001B[0m') {
        text += currentCommand;
      }

      while (index < end && raw.length) {
        curChar = raw.shift();
        text += curChar;
        if (inEscape) {
          if (curChar === 'm') {
            inEscape = false;
          }
          continue;
        } else if (curChar === '\u001B') {
          inEscape = true;
          continue;
        }
        index++;
      }

      return text;
    };


    String.prototype.__defineGetter__(name, function () {
      const raw = this.replace(/\u001B(?:.*)m/, '');
      let result = '';

      // if (fg) result += `\u001B[38;5;${fg}m`;
      // if (bg) result += `\u001B[48;5;${bg}m`;
      if (fg) result += `\u001B${String.fromCharCode(fg)}`;
      if (bg) result += `\u001B${String.fromCharCode(bg)}`;
      if (misc) result += misc;
      result += `${raw}\u001B\u000F`;

      return result;
    });
  }
};

function hex2Address(hex) {
  const rgb = hex2rgbString(hex);
  const nums = rgbRegExp.exec(rgb);

  return x256(parseInt(nums[1]), parseInt(nums[2]), parseInt(nums[3]));
}


module.exports = mauve;
