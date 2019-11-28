const Urise = artifacts.require('Urise');
const Reverter = require('./helpers/reverter');
const {assertReverts} = require('./helpers/assertThrows');
const truffleAssert = require('truffle-assertions');

contract('Claimable', async (accounts) => {
  const reverter = new Reverter(web3);

  let uriseToken;

  const OWNER = accounts[0];
  const SOMEBODY = accounts[1];
  const NOBODY = accounts[2];
  const ADDRESS_NULL = '0x0000000000000000000000000000000000000000';

  before('setup', async () => {
    uriseToken = await Urise.new(OWNER, OWNER, OWNER);

    await reverter.snapshot();
  });

  afterEach('revert', reverter.revert);

  describe('transferForOwner()', async () => {
    it('should be possible to transfer from one addresss to the other by owner', async () => {
      await uriseToken.mint(SOMEBODY, 100);
      await uriseToken.mint(NOBODY, 100);

      assert.isTrue(await uriseToken.transferForOwner.call(NOBODY, SOMEBODY, 50));
      const result = await uriseToken.transferForOwner(NOBODY, SOMEBODY, 50);

      assert.equal((await uriseToken.balanceOf(NOBODY)).toNumber(), 50);
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toNumber(), 150);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Transfer');
      assert.equal(result.logs[0].args.from, NOBODY);
      assert.equal(result.logs[0].args.to, SOMEBODY);
      assert.equal(result.logs[0].args.value, 50);
    });

    it('should be possible to transfer from owner addresss to the other by owner', async () => {
      await uriseToken.mint(SOMEBODY, 100);
      await uriseToken.mint(OWNER, 100);

      assert.isTrue(await uriseToken.transferForOwner.call(OWNER, SOMEBODY, 50));
      const result = await uriseToken.transferForOwner(OWNER, SOMEBODY, 50);

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), '100000000000000050');
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toNumber(), 150);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Transfer');
      assert.equal(result.logs[0].args.from, OWNER);
      assert.equal(result.logs[0].args.to, SOMEBODY);
      assert.equal(result.logs[0].args.value, 50);
    });

    it('should be possible to transfer from some addresss to the owner by owner', async () => {
      await uriseToken.mint(SOMEBODY, 100);
      await uriseToken.mint(OWNER, 100);

      assert.isTrue(await uriseToken.transferForOwner.call(SOMEBODY, OWNER, 50));
      const result = await uriseToken.transferForOwner(SOMEBODY, OWNER, 50);

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), '100000000000000150');
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toNumber(), 50);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Transfer');
      assert.equal(result.logs[0].args.from, SOMEBODY);
      assert.equal(result.logs[0].args.to, OWNER);
      assert.equal(result.logs[0].args.value, 50);
    });

    it('should not be possible to transfer from null addresss to the other by owner', async () => {
      await uriseToken.mint(SOMEBODY, 100);

      await assertReverts(uriseToken.transferForOwner(ADDRESS_NULL, SOMEBODY, 50));

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toNumber(), 100);
    });

    it('should not be possible to transfer from some addresss to the null address by owner', async () => {
      await uriseToken.mint(SOMEBODY, 100);

      await assertReverts(uriseToken.transferForOwner(SOMEBODY, ADDRESS_NULL, 50));

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toNumber(), 100);
    });
  });
});
