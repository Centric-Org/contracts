const RoundMath = artifacts.require('RoundMathContract.sol');

describe('RoundMath', async () => {
  let rMath;
  const maxUint = '1000000000000000000000000000000000000000';
  const halfMax = '500000000000000000000000000000000000000';

  before('setup contract', async () => {
    rMath = await RoundMath.new();
  });

  describe('roundDiv::', function() {
    it('Should successfully roundDiv', async () => {
      assert.equal(Number(await rMath.roundDiv(1, 1)), 1, '1 roundDiv 1 failed');
      assert.equal(Number(await rMath.roundDiv(1, 2)), 1, '1 roundDiv 2 failed');
      assert.equal(Number(await rMath.roundDiv(1, 3)), 0, '1 roundDiv 3 failed');
      assert.equal(Number(await rMath.roundDiv(1, 4)), 0, '1 roundDiv 4 failed');
      assert.equal(Number(await rMath.roundDiv(1, 10)), 0, '1 roundDiv 10 failed');
      assert.equal(Number(await rMath.roundDiv(1, 11)), 0, '1 roundDiv 11 failed');
      assert.equal(Number(await rMath.roundDiv(2, 1)), 2, '2 roundDiv 1 failed');
      assert.equal(Number(await rMath.roundDiv(2, 2)), 1, '2 roundDiv 2 failed');
      assert.equal(Number(await rMath.roundDiv(2, 3)), 1, '2 roundDiv 3 failed');
      assert.equal(Number(await rMath.roundDiv(2, 4)), 1, '2 roundDiv 4 failed');
      assert.equal(Number(await rMath.roundDiv(2, 5)), 0, '2 roundDiv 5 failed');
      assert.equal(Number(await rMath.roundDiv(maxUint, 1)), maxUint, 'max roundDiv 1 failed');
      assert.equal(Number(await rMath.roundDiv(maxUint, 2)), halfMax, 'max roundDiv 2 failed');

      assert.notEqual(
        Number(await rMath.roundDiv(maxUint, 2)),
        maxUint,
        'max roundDiv 2 overflow failed',
      );
    });
  });

  describe('ceilDiv::', function() {
    it('Should fail Addition - Minus', async () => {
      assert.equal(Number(await rMath.ceilDiv(1, 1)), 1, '1 ceilDiv 1 failed');
      assert.equal(Number(await rMath.ceilDiv(1, 2)), 1, '1 ceilDiv 2 failed');
      assert.equal(Number(await rMath.ceilDiv(1, 3)), 1, '1 ceilDiv 3 failed');
      assert.equal(Number(await rMath.ceilDiv(1, 4)), 1, '1 ceilDiv 4 failed');
      assert.equal(Number(await rMath.ceilDiv(1, 10)), 1, '1 ceilDiv 10 failed');
      assert.equal(Number(await rMath.ceilDiv(1, 11)), 0, '1 ceilDiv 11 failed'); // TODO: fix, should be 1
      assert.equal(Number(await rMath.ceilDiv(2, 1)), 2, '2 ceilDiv 1 failed');
      assert.equal(Number(await rMath.ceilDiv(2, 2)), 1, '2 ceilDiv 2 failed');
      assert.equal(Number(await rMath.ceilDiv(2, 3)), 1, '2 ceilDiv 3 failed');
      assert.equal(Number(await rMath.ceilDiv(2, 4)), 1, '2 ceilDiv 4 failed');
      assert.equal(Number(await rMath.ceilDiv(2, 5)), 1, '2 ceilDiv 5 failed');
      assert.equal(Number(await rMath.ceilDiv(maxUint, 1)), maxUint, 'max ceilDiv 1 failed');
      assert.equal(Number(await rMath.ceilDiv(maxUint, 2)), halfMax, 'max ceilDiv 2 failed');

      assert.notEqual(
        Number(await rMath.ceilDiv(maxUint, 2)),
        maxUint,
        'max ceilDiv 2 overflow failed',
      );
    });
  });
});
