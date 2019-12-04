const StableToken = artifacts.require('StableToken');
const Urise = artifacts.require('UriseMock');
const Reverter = require('./helpers/reverter');
const {assertReverts} = require('./helpers/assertThrows');

contract('StableToken', async (accounts) => {
  const reverter = new Reverter(web3);

  let uriseToken;
  let stableToken;

  const OWNER = accounts[0];
  const SOMEBODY = accounts[1];
  const ANYBODY = accounts[2];
  const ADDRESS_NULL = '0x0000000000000000000000000000000000000000';

  before('setup', async () => {
    uriseToken = await Urise.new(OWNER, OWNER, OWNER);
    stableToken = await StableToken.new(OWNER, OWNER);

    await reverter.snapshot();
  });

  describe('updateRiseContract()', async () => {
    it('should be possible to update quarantine wallet address to a new one by owner', async () => {
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
      await stableToken.updateRiseContract(uriseToken.address);
      assert.equal(await stableToken.uriseContract(), uriseToken.address);
    });

    it('should not be possible to update quarantine wallet address to a new one not by owner', async () => {
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
      await assertReverts(stableToken.updateRiseContract(uriseToken.address, {from: ANYBODY}));
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
    });

    it('should not be possible to update quarantine wallet address to a ADDRESS_NULL by owner', async () => {
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
      await assertReverts(stableToken.updateRiseContract(ADDRESS_NULL));
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
    });

    it('should not be possible to update quarantine wallet address to a previous address by owner', async () => {
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
      await stableToken.updateRiseContract(uriseToken.address);
      await assertReverts(stableToken.updateRiseContract(uriseToken.address));
      assert.equal(await stableToken.uriseContract(), uriseToken.address);
    });

    it('should not be possible to update quarantine wallet address to a ADDRESS_NULL by not owner', async () => {
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
      await assertReverts(stableToken.updateRiseContract(ADDRESS_NULL, {from: ANYBODY}));
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
    });

    it('should not be possible to update quarantine wallet address to a previous address by not owner', async () => {
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
      await assertReverts(stableToken.updateRiseContract(OWNER, {from: ANYBODY}));
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
    });
  });

  describe('transferForOwner()', async () => {
    it('should be possible to transfer from one addresss to the other by owner', async () => {
      await stableToken.mint(SOMEBODY, 100);
      await stableToken.mint(ANYBODY, 100);

      assert.isTrue(await stableToken.transferForOwner.call(ANYBODY, SOMEBODY, 50));
      const result = await stableToken.transferForOwner(ANYBODY, SOMEBODY, 50);

      assert.equal((await stableToken.balanceOf(ANYBODY)).toNumber(), 50);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toNumber(), 150);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Transfer');
      assert.equal(result.logs[0].args.from, ANYBODY);
      assert.equal(result.logs[0].args.to, SOMEBODY);
      assert.equal(result.logs[0].args.value, 50);
    });

    it('should be possible to transfer from owner addresss to the other by owner', async () => {
      await stableToken.mint(SOMEBODY, 100);
      await stableToken.mint(OWNER, 100);

      assert.isTrue(await stableToken.transferForOwner.call(OWNER, SOMEBODY, 50));
      const result = await stableToken.transferForOwner(OWNER, SOMEBODY, 50);

      assert.equal((await stableToken.balanceOf(OWNER)).toString(), '50');
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toNumber(), 150);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Transfer');
      assert.equal(result.logs[0].args.from, OWNER);
      assert.equal(result.logs[0].args.to, SOMEBODY);
      assert.equal(result.logs[0].args.value, 50);
    });

    it('should be possible to transfer from some addresss to the owner by owner', async () => {
      await stableToken.mint(SOMEBODY, 100);
      await stableToken.mint(OWNER, 100);

      assert.isTrue(await stableToken.transferForOwner.call(SOMEBODY, OWNER, 50));
      const result = await stableToken.transferForOwner(SOMEBODY, OWNER, 50);

      assert.equal((await stableToken.balanceOf(OWNER)).toString(), '150');
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toNumber(), 50);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Transfer');
      assert.equal(result.logs[0].args.from, SOMEBODY);
      assert.equal(result.logs[0].args.to, OWNER);
      assert.equal(result.logs[0].args.value, 50);
    });

    it('should not be possible to transfer from null addresss to the other by owner', async () => {
      await stableToken.mint(SOMEBODY, 100);

      await assertReverts(stableToken.transferForOwner(ADDRESS_NULL, SOMEBODY, 50));

      assert.equal((await stableToken.balanceOf(SOMEBODY)).toNumber(), 100);
    });

    it('should not be possible to transfer from some addresss to the null address by owner', async () => {
      await stableToken.mint(SOMEBODY, 100);

      await assertReverts(stableToken.transferForOwner(SOMEBODY, ADDRESS_NULL, 50));

      assert.equal((await stableToken.balanceOf(SOMEBODY)).toNumber(), 100);
    });
  });

  afterEach('revert', reverter.revert);
});
