function parseRange(range, doc) {
  if (range === '.-') range = '.-1';
  if (range === '-') range = '.-1';
  if (range === '.+') range = '.+1';
  if (range === '+') range = '.+1';
  let cur = doc.cursor.line(),
    last = doc._lines.length - 1;
  // Handle recursively

  if (range.indexOf(',') > -1) {
    const split = range.split(',');

    return [parseRange(split[0], doc)[0], parseRange(split[1], doc)[1]];
  }
  const num = parseInt(range);

  if (String(num) === range) return [num - 1, num - 1];
  if (range === '' || range === '.') return [cur, cur];
  if (range.match(/\.(\+|-)/)) {
    const val = parseInt(range.substring(1));

    return [cur + val, cur + val];
  }
  if (range === '%') return [0, last];
  if (range === '$') return [last, last];

  return [cur, cur];
}

module.exports = function (Vim) {
  Vim.addCommand({
    mode: 'command',
    match: /:(.+)s(?:ubstitute)?(\/.*\n)/,
    fn(keys, vim, expr) {
      const position = this.curDoc.cursor.position();
      let range = expr[1];

      range = parseRange(expr[1], this.curDoc);
      let line = range[1];

      while (line >= range[0]) {
        vim.curDoc.cursor.line(line);
        vim.exec(`:s${expr[2]}`);
        line--;
      }
      this.curDoc.cursor.line(position.line);
      this.curDoc.cursor.char(position.char);
    },
  });

  Vim.addCommand({
    mode: 'command',
    match: /:s(\/.*\n)/,
    fn(keys, vim, expr) {
      vim.exec(keys.replace(/:s/, ':substitute'));
    },
  });
  Vim.addCommand({
    mode: 'command',
    match: /:substitute\/([^\/]*)\/([^\/]*)\n/,
    fn(keys, vim, expr) {
      vim.exec(keys.replace(/\n/, '/\n'));
    },
  });

  Vim.addCommand({
    mode: 'command',
    match: /:substitute\/(.*)\/(.*)\/([gci]*)\n/,
    fn(res, vim, expr) {
      const pos = this.curDoc.cursor.position();
      const flags = (expr[3] || '').split('');

      val = this.curDoc.find(new RegExp(`(${expr[1]})`, 'g'), {
        wholeLine: true,
        range: false,
      });
      while (val.found) {
        this.curDoc.cursor.char(val.char);
        this.curDoc.cursor.line(val.line);
        vim.exec('v');
        for (let i = 1; i < expr[1].length; i++) {
          vim.exec('l');
        }
        vim.exec('c');
        vim.exec(expr[2]);
        vim.exec('esc');

        // If not global, stop after first.
        if (flags.indexOf('g') === -1) break;
        val = this.curDoc.find(new RegExp(`(${expr[1]})`, 'g'), {
          wholeLine: true,
          range: false,
        });
      }
      this.curDoc.cursor.char(pos.char);
      this.curDoc.cursor.line(pos.line);
    },
  });

  Vim.addCommand({
    mode: 'command',
    match: /:substitute\/([^\/]*)\/([^\/]*)\n/,
    fn(keys, vim, expr) {
      vim.exec(keys.replace(/\n/, '/\n'));
    },
  });

  Vim.addCommand({
    mode: 'command',
    match: /:(.*)g\/([^\/]*)\/([^\/]*)\n/,
    fn(keys, vim, expr) {
      let range = parseRange(expr[1], this.curDoc),
        pattern = expr[2],
        command = expr[3];
      const cur = this.curDoc.cursor.position();
      const end = range[1];

      while (end >= range[0]) {

      }
    },
  });
};

module.exports.parseRange = parseRange;
