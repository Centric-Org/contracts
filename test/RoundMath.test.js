const RoundMath = artifacts.require('RoundMathContract.sol');
const { assertReverts } = require('./helpers/assertThrows');

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
      assert.equal(Number(await rMath.roundDiv(2, 21)), 0, '2 roundDiv 21 failed');
      assert.equal(Number(await rMath.roundDiv(2, 201)), 0, '2 roundDiv 201 failed');

      assert.equal(Number(await rMath.roundDiv(100, 10001)), 0, '100 roundDiv 10001 failed');
      assert.equal(Number(await rMath.roundDiv(2001, 1000)), 2, '2001 roundDiv 1000 failed');
      assert.equal(Number(await rMath.roundDiv('123450000001', '1000000')), '123450');

      assert.equal(Number(await rMath.roundDiv(maxUint, 1)), maxUint, 'max roundDiv 1 failed');
      assert.equal(Number(await rMath.roundDiv(maxUint, 2)), halfMax, 'max roundDiv 2 failed');

      assert.notEqual(Number(await rMath.roundDiv(maxUint, 2)), maxUint);
    });

    it('Should Fail with 0', async () => {
      await assertReverts(rMath.roundDiv(1, 0));
    });
  });

  describe('ceilDiv::', function() {
    it('Should fail Addition - Minus', async () => {
      assert.equal(Number(await rMath.ceilDiv(1, 1)), 1, '1 ceilDiv 1 failed');
      assert.equal(Number(await rMath.ceilDiv(1, 2)), 1, '1 ceilDiv 2 failed');
      assert.equal(Number(await rMath.ceilDiv(1, 3)), 1, '1 ceilDiv 3 failed');
      assert.equal(Number(await rMath.ceilDiv(1, 4)), 1, '1 ceilDiv 4 failed');
      assert.equal(Number(await rMath.ceilDiv(1, 10)), 1, '1 ceilDiv 10 failed');
      assert.equal(Number(await rMath.ceilDiv(1, 11)), 1, '1 ceilDiv 11 failed');
      assert.equal(Number(await rMath.ceilDiv(2, 1)), 2, '2 ceilDiv 1 failed');
      assert.equal(Number(await rMath.ceilDiv(2, 2)), 1, '2 ceilDiv 2 failed');
      assert.equal(Number(await rMath.ceilDiv(2, 3)), 1, '2 ceilDiv 3 failed');
      assert.equal(Number(await rMath.ceilDiv(2, 4)), 1, '2 ceilDiv 4 failed');
      assert.equal(Number(await rMath.ceilDiv(2, 5)), 1, '2 ceilDiv 5 failed');
      assert.equal(Number(await rMath.ceilDiv(2, 21)), 1, '2 ceilDiv 21 failed');
      assert.equal(Number(await rMath.ceilDiv(2, 201)), 1, '2 ceilDiv 201 failed');

      assert.equal(Number(await rMath.ceilDiv(100, 10001)), 1, '100 ceilDiv 10001 failed');
      assert.equal(Number(await rMath.ceilDiv(2001, 1000)), 3, '2001 ceilDiv 1000 failed');
      assert.equal(Number(await rMath.ceilDiv('123450000001', '1000000')), '123451');

      assert.equal(Number(await rMath.ceilDiv(maxUint, 1)), maxUint, 'max ceilDiv 1 failed');
      assert.equal(Number(await rMath.ceilDiv(maxUint, 2)), halfMax, 'max ceilDiv 2 failed');

      assert.notEqual(Number(await rMath.ceilDiv(maxUint, 2)), maxUint);
    });

    it('Should Fail with 0', async () => {
      await assertReverts(rMath.ceilDiv(1, 0));
    });
  });
});
