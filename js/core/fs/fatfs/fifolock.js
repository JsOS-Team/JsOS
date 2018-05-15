// very simple FIFO serial queue (plus callback wrapper), helps you call `fn`s in order

module.exports = function SerialQueue() {
  let q = {},
    tasks = [];

  function runNext() {
    tasks[0](() => {
      tasks.shift(); // TODO: avoid?
      if (tasks.length) runNext();
    });
  }

  // usage: `q.aquire(function (release) { … release(); });`
  q.acquire = function (fn) {
    const len = tasks.push(fn);

    if (len === 1) process.nextTick(runNext);
  };

  // usage: `cb = q.TRANSACTION_WRAPPER(cb, function () { … cb(); });`
  // (pass `true` for `nested` if your own caller already holds lock)
  q.TRANSACTION_WRAPPER = function (cb, proceed, nested) {
    if (nested) return process.nextTick(proceed), cb;
    let _releaseQueue;

    if ('postAcquire' in this) proceed = this.postAcquire.bind(q, proceed);
    q.acquire((releaseQueue) => {
      _releaseQueue = releaseQueue;
      proceed();
    });
    let capturedCB,
      finish = 'preRelease' in this ? this.preRelease.bind(q, _finish) : _finish;

    function _finish() {
      capturedCB();
      _releaseQueue();
    }

    return function () {
      capturedCB = Function.prototype.apply.bind(cb, this, arguments);
      finish.call(null, Array.prototype.slice.call(arguments, 0), this);
    };
  };

  return q;
};
