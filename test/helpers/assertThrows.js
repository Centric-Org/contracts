const expectThrow = (text) => async (promise) => {
  try {
    await promise;
  } catch (error) {
    assert(error.message.search(text) >= 0, 'Expected throw, got \'' + error + '\' instead');
    return;
  }
  assert.fail('Expected throw not received');
};

module.exports = {
  assertOutOfGas: expectThrow('out of gas'),
  assertReverts: expectThrow('revert'),
  assertInvalidJump: expectThrow('invalid JUMP'),
};
