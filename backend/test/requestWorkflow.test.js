const test = require('node:test');
const assert = require('node:assert/strict');
const { canTransition } = require('../src/domain/requestWorkflow');

test('new requests can enter review, progress, or be rejected', () => {
  assert.equal(canTransition('Submitted', 'Under Review'), true);
  assert.equal(canTransition('Submitted', 'In Progress'), true);
  assert.equal(canTransition('Submitted', 'Rejected'), true);
});
test('invalid and terminal transitions are rejected', () => {
  assert.equal(canTransition('Submitted', 'Closed'), false);
  assert.equal(canTransition('Closed', 'In Progress'), false);
  assert.equal(canTransition('Rejected', 'Resolved'), false);
  assert.equal(canTransition('unknown', 'Resolved'), false);
});
test('resolved requests can be closed or reopened into progress', () => {
  assert.equal(canTransition('Resolved', 'Closed'), true);
  assert.equal(canTransition('Resolved', 'In Progress'), true);
});
