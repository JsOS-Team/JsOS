const Undo = module.exports = function () {
  this._history = [];
  this.position = 0;
};

/** Add a state
 *
 * N.B.: this.position can use some conceptual explanation.
 * At its root, position is the state that you are presently in.
 * Undo.add is not used when you have completed a change, but when you are about to initiate a change. Therefore it's appropriate that insert the state at your current position, then increment position into a state that is not defined in _history.
 */
Undo.prototype.add = function (ev) {
  // Don't add additional identical states.
  if (this.position && typeof ev !== 'string' && 'cursor' in ev && 'text' in ev) {
    const current = this._history.slice(this.position - 1, this.position)[0];
    let next = this._history.slice(this.position, this.position + 1);

    next = next.length ? next[0] : false;
    if (areSame(ev, current) || next && areSame(ev, next)) {
      return;
    }
  }

  this._history.splice(this.position);
  this._history.push(ev);
  this.position++;

  return true;
};

function areSame(ev1, ev2) {
  return ev1.text === ev2.text;
}

/** Retrieve a state and move the current "position" to there
 */
Undo.prototype.get = function (index) {
  if (index < 0 || index >= this._history.length) return;
  const state = this._history.slice(index, index + 1)[0];

  this.position = index;

  return state;
};

/** Retrieve the previous state
 */
Undo.prototype.last = function () {
  return this.get(this.position - 1);
};

/** Retrieve the next state
 */
Undo.prototype.next = function () {
  return this.get(this.position + 1);
};
