const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');

const core = fs.readFileSync('static/js/core.js', 'utf8');
const block = core.slice(core.indexOf('const DEMO_NAMES ='), core.indexOf('function fmtDate'));
const store = new Map([['demoMode', '1']]);
const context = {
  localStorage: {
    getItem: key => store.get(key) || null,
    setItem: (key, value) => store.set(key, String(value)),
  },
  document: { getElementById: () => ({ checked: false, addEventListener() {} }) },
  window: { dispatchEvent() {} },
  CustomEvent: function CustomEvent() {},
  people: [{ name: '10-16-JaneAugsburger' }],
  fuItems: [],
};
vm.createContext(context);
vm.runInContext(block + `
  result = {
    stem: displayName('10-16-JaneAugsburger'),
    calendar: displayName('Jane Augsburger'),
    event: displayNamesInText('Complimentary Support Session - Jane Augsburger', ['Jane Augsburger'])
  };`, context);

assert.equal(context.result.stem, context.result.calendar, 'spaced calendar name should use the call stem fake identity');
assert(!context.result.event.includes('Jane Augsburger'), 'event title should not expose the real name');
assert(context.result.event.includes(context.result.stem), 'event title should retain context and contain the fake name');
console.log('Demo-mode name coverage: OK');
