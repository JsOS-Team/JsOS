const _ = require('./helpers.js');

exports.wrapDriver = function (volume, opts) {
  opts = _.extend({ maxSectors: 2048 }, opts);

  let cache = {},
    advice = 'NORMAL',
    secSize = volume.sectorSize;

  function _freezeBuffer(b) {
    const f = new Buffer(b.length);

    b.copy(f);

    return f;
  }

  function addToCache(i, data) {
    if (advice === 'SEQUENTIAL' || advice === 'NOREUSE') return;
    data = _freezeBuffer(data);
    cache[i] = data;
    // if (data.length > secSize) addToCache(i+1, data.slice(secSize));
    while (data.length > secSize) {
      data = data.slice(secSize);
      cache[++i] = data;
    }
    // simple highest-sectors-lose eviction policy for now
    Object.keys(cache).sort()
      .slice(opts.maxSectors)
      .forEach((x) => {
        delete cache[x];
      });
    _.log(_.log.DBG, 'Cache now contains:', Object.keys(cache).join(','));
  }

  return {
    sectorSize: volume.sectorSize,
    numSectors: volume.numSectors,
    advice(val) {
      if (!arguments.length) return advice;
      advice = val;
      if (advice === 'SEQUENTIAL' || advice === 'NOREUSE') cache = {};

      return this;
    },
    readSectors(i, dest, cb) {
      // TODO: handle having partial parts of dest!
      if (i in cache && dest.length === secSize) {
        cache[i].copy(dest);
        setImmediate(cb);
      } else {
        volume.readSectors(i, dest, (e) => {
          if (e) cb(e);
          else addToCache(i, dest), cb();
        });
      }
    },
    writeSectors: !volume.writeSectors ? null : function (i, data, cb) {
      volume.writeSectors(i, data, (e) => {
        if (e) cb(e);
        else addToCache(i, data), cb();
      });
    },
  };
};
