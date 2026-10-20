const allowedTransitions = Object.freeze({
  Submitted: ['Under Review', 'In Progress', 'Rejected'],
  'Under Review': ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Under Review'],
  Resolved: ['Closed', 'In Progress'],
  Closed: [],
  Rejected: []
});
function canTransition(from, to) {
  return Array.isArray(allowedTransitions[from]) && allowedTransitions[from].includes(to);
}
module.exports = { allowedTransitions, canTransition };
