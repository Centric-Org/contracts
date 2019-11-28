const UriseToken = artifacts.require('UriseToken');
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
    uriseToken = await UriseToken.new('a', 'a', 18);

    await reverter.snapshot();
  });

  afterEach('revert', reverter.revert);

  describe('transferForOwner()', async () => {
    it('should be possible to transfer from one addresss to the other by owner', async () => {
      await uriseToken.mint(SOMEBODY, 100);
      await uriseToken.mint(NOBODY, 100);

      const result = await uriseToken.transferForOwner(NOBODY, SOMEBODY, 50);

      assert.equal((await uriseToken.balanceOf(NOBODY)).toNumber(), 50);
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toNumber(), 150);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Tarnsfer');
      assert.equal(result.logs[0].args.from, NOBODY);
      assert.equal(result.logs[0].args.to, SOMEBODY);
      assert.equal(result.logs[0].args.value, 50);
    });
  })
});
