module.exports = function () {};

/**
 * Add a listener by event name
 * @param {String} name
 * @param {Function} fn
 * @return {Event} instance
 * @api public
 */
module.exports.prototype.on = function (name, fn) {
  // Lazy instanciation of events object
  const events = this.events = this.events || {};

  // Lazy instanciation of specific event
  events[name] = events[name] || [];

  // Give it the function
  events[name].push(fn);

  return this;
};


/**
 * Trigger an event by name, passing arguments
 *
 * @param {String} name
 * @return {Event} instance
 * @api public
 */
module.exports.prototype.trigger = function (name, arg1, arg2 /** ... */) {
  // Only if events + this event exist...
  if (!this.events || !this.events[name]) return this;

  // Grab the listeners
  let listeners = this.events[name],
    // All arguments after the name should be passed to the function
    args = Array.prototype.slice.call(arguments, 1);

  // So we can efficiently apply below

  function triggerFunction(fn) {
    fn.apply(this, args);
  }

  if ('forEach' in listeners) {
    listeners.forEach(triggerFunction.bind(this));
  } else {
    for (const i in listeners) {
      if (listeners.hasOwnProperty(i)) triggerFunction(fn);
    }
  }

  return this;
};
