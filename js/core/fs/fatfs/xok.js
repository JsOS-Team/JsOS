module.exports = Object.assign ? Object.assign : function (obj) {
  Array.prototype.slice.call(arguments, 1).forEach((ext) => {
    if (ext) {
      Object.keys(ext).forEach((key) => {
        obj[key] = ext[key];
      });
    }
  });

  return obj;
};
