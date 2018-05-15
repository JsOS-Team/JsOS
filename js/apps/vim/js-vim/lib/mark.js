const _ = require('underscore');
// http://blog.elliotjameschong.com/2012/10/10/underscore-js-deepclone-and-deepextend-mix-ins/ thanks!

_.mixin({
  deepClone(p_object) {
    return JSON.parse(JSON.stringify(p_object));
  },
});

function shallowCopy(obj) {
  const newObj = {};

  for (const i in obj) {
    if (obj.hasOwnProperty(i)) {
      newObj[i] = obj[i];
    }
  }

  return newObj;
}


var mark = module.exports = function (str, mk) {
  if (str.marks & !mk) return str;
  const tmpStr = new String(str);

  tmpStr.marks = [];
  if (str.marks) tmpStr.marks = _.deepClone(str.marks);
  str = tmpStr;
  if (mk) {
    if ('length' in mk) {
      if (mk.length) {
        str.marks = mk;
      }
    } else {
      str.marks.push(mk);
    }
  }
  str._substring = str._substring || str.substring;
  str.substring = function (from, to) {
    if (from === to) return mark('');
    const newString = mark(str._substring(...arguments));

    for (const i in str.marks) {
      if (str.marks.hasOwnProperty(i)) {
        if (str.marks[i].col >= from && (!to && to !== 0 || str.marks[i].col < to)) {
          const newMark = shallowCopy(str.marks[i]);

          newMark.col = str.marks[i].col - from;
          newString.marks.push(newMark);
        }
      }
    }
    if (newString.length > to - from) throw 'awwww';

    return newString;
  };

  str._concat = str.concat;
  str.concat = function (incomingStr) {
    const marks = str.marks;

    if (incomingStr.marks && incomingStr.marks.length) {
      for (const i in incomingStr.marks) {
        if (incomingStr.marks.hasOwnProperty(i)) {
          const newMark = incomingStr.marks[i];

          newMark.col += str.length;
          marks.push(newMark);
        }
      }
    }

    return mark(str._concat(incomingStr), marks);
  };

  return str;
};
