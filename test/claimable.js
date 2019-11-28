const Claimable = artifacts.require('Claimable');
const Reverter = require('./helpers/reverter');
const {assertReverts} = require('./helpers/assertThrows');
const truffleAssert = require('truffle-assertions');

contract('Claimable', async (accounts) => {
  const reverter = new Reverter(web3);

  let claimable;

  const OWNER = accounts[0];
  const SOMEBODY = accounts[1];
  const NOBODY = accounts[2];
  const ADDRESS_NULL = '0x0000000000000000000000000000000000000000';

  before('setup', async () => {
    await reverter.snapshot();
  });

  afterEach('revert', reverter.revert);

  describe('creating', async () => {
    it('should initialize and set a correct owner', async () => {
      claimable = await Claimable.new();

      const txHash = claimable.transactionHash;
      const result = await truffleAssert.createTransactionResult(claimable, txHash);

      assert.equal(await claimable.owner.call(), OWNER);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'OwnershipTransferred');
      assert.equal(result.logs[0].args.previousOwner, ADDRESS_NULL);
      assert.equal(result.logs[0].args.newOwner, OWNER);
    });
  });

  describe('transferOwnership()', async () => {
    beforeEach('initialize', async () => {
      claimable = await Claimable.new();
    });

    it('should be possible to transfer ownership by owner', async () => {
      await claimable.transferOwnership(SOMEBODY);

      assert.equal(await claimable.pendingOwner.call(), SOMEBODY);
    });

    it('after ownership transferred owner should remain unchanged', async () => {
      await claimable.transferOwnership(SOMEBODY);

      assert.equal(await claimable.owner.call(), OWNER);
    });

    it('should not be possible to transfer ownership by not owner', async () => {
      await assertReverts(claimable.transferOwnership(SOMEBODY, {from: SOMEBODY}));

      assert.equal(await claimable.owner.call(), OWNER);
      assert.equal(await claimable.pendingOwner.call(), ADDRESS_NULL);
    });
  });

  describe('claimOwnership()', async () => {
    beforeEach('initialize', async () => {
      claimable = await Claimable.new();
    });

    it('should be possible to claim ownership by pending owner', async () => {
      await claimable.transferOwnership(SOMEBODY);

      const result = await claimable.claimOwnership({from: SOMEBODY});

      assert.equal(await claimable.pendingOwner.call(), ADDRESS_NULL);
      assert.equal(await claimable.owner.call(), SOMEBODY);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'OwnershipTransferred');
      assert.equal(result.logs[0].args.previousOwner, OWNER);
      assert.equal(result.logs[0].args.newOwner, SOMEBODY);
    });

    it('should not be possible to claim ownership not by pending owner', async () => {
      await claimable.transferOwnership(SOMEBODY);

      await assertReverts(claimable.claimOwnership({from: NOBODY}));

      assert.equal(await claimable.owner.call(), OWNER);
      assert.equal(await claimable.pendingOwner.call(), SOMEBODY);
    });
  });

  describe('isOwner()', async () => {
    beforeEach('initialize', async () => {
      claimable = await Claimable.new();
    });

    it('should pass by valid owner', async () => {
      assert.isTrue(await claimable.isOwner.call());
    });

    it('should pass by valid owner after ownership transfered', async () => {
      await claimable.transferOwnership(SOMEBODY);

      assert.isTrue(await claimable.isOwner.call());
    });

    it('should pass by valid owner after ownership claimed', async () => {
      await claimable.transferOwnership(SOMEBODY);
      await claimable.claimOwnership({from: SOMEBODY});

      assert.isTrue(await claimable.isOwner.call({from: SOMEBODY}));
    });

    it('should not pass by not a valid owner', async () => {
      assert.isFalse(await claimable.isOwner.call({from: SOMEBODY}));
    });

    it('should not pass by not a valid owner after ownership transfered', async () => {
      await claimable.transferOwnership(SOMEBODY);

      assert.isFalse(await claimable.isOwner.call({from: SOMEBODY}));
    });

    it('should not pass by old valid owner after ownership claimed', async () => {
      await claimable.transferOwnership(SOMEBODY);
      await claimable.claimOwnership({from: SOMEBODY});

      assert.isFalse(await claimable.isOwner.call());
    });
  });
});
