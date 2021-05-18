const SafeMath = artifacts.require('SafeMathContract.sol');
const { assertReverts, assertInvalidArgument } = require('./helpers/assertThrows');

describe('SafeMath', async () => {
  let sMath;
  const maxUint = '1000000000000000000000000000000000000000';

  before('setup contract', async () => {
    sMath = await SafeMath.new();
  });

  describe('Subtraction::', function() {
    it('Should fail Subtraction - Minus', async () => {
      await assertReverts(sMath.sub(0, 1));
    });

    it('Should fail Subtraction - Negative argument )', async () => {
      await assertInvalidArgument(sMath.sub(-1, 0));
    });

    it('Should successfully Subtract', async () => {
      assert.equal(Number(await sMath.sub(10, 1)), 9, '10 minus 1 failed');
    });
  });

  describe('Addition::', function() {
    it('Should successfully Add', async () => {
      assert.equal(Number(await sMath.add(1, 1)), 2, '1 plus 1 failed');
    });

    it('Should fail Addition - +int to Minus (Adding to > -1 )', async () => {
      await assertInvalidArgument(sMath.add(1, -1));
    });

    it('Should fail Addition - Negative argument )', async () => {
      await assertInvalidArgument(sMath.add(0, -1));
      await assertInvalidArgument(sMath.add(-1, 0));
    });
  });

  describe('Division::', function() {
    it('Should fail Division - Zero division', async () => {
      await assertReverts(sMath.div(1, 0));
    });

    it('Should fail Division - Negative argument', async () => {
      await assertInvalidArgument(sMath.div(10, -1));
      await assertInvalidArgument(sMath.div(-5, 1));
    });

    it('Should successfully Divide', async () => {
      assert.equal(Number(await sMath.div(0, 1)), 0, '0 divided by 1 failed');
    });
  });

  describe('Multiplication::', function() {
    it('Should successfully Multiply', async () => {
      assert.equal(Number(await sMath.mul(1, 0)), 0, '1 multiplied by 0 failed');
      assert.equal(Number(await sMath.mul(0, 1)), 0, '0 multiplied by 1 failed');
    });

    it('Should Fail to Multiply - Negative argument', async () => {
      await assertInvalidArgument(sMath.mul(2, -2));
    });

    it('Should Fail to Multiply - Integer overflow', async () => {
      await assertReverts(sMath.mul(maxUint, maxUint));
    });
  });

  describe('Modulo::', function() {
    it('Should successfully mod', async () => {
      assert.equal(Number(await sMath.mod(1, 1)), 0, '1 mod by 1 failed');
      assert.equal(Number(await sMath.mod(2, 1)), 0, '2 mod by 1 failed');
      assert.equal(Number(await sMath.mod(3, 2)), 1, '3 mod by 2 failed');
      assert.equal(Number(await sMath.mod(4, 2)), 0, '4 mod by 2 failed');
      assert.equal(Number(await sMath.mod(5, 2)), 1, '5 mod by 2 failed');
    });

    it('Should Fail to mod - 0', async () => {
      await assertReverts(sMath.mod(2, 0));
    });
  });
});
