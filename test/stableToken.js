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

  describe('setUriseContract()', async () => {
    it('should be possible to set urise contract address to a new one by owner', async () => {
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
      await stableToken.setUriseContract(uriseToken.address);
      assert.equal(await stableToken.uriseContract(), uriseToken.address);
    });

    it('should not be possible to set urise contract address to a new one not by owner', async () => {
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
      await assertReverts(stableToken.setUriseContract(uriseToken.address, {from: ANYBODY}));
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
    });

    it('should not be possible to set urise contract address to a ADDRESS_NULL by owner', async () => {
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
      await assertReverts(stableToken.setUriseContract(ADDRESS_NULL));
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
    });

    it('should not be possible to set urise contract address to a ADDRESS_NULL by not owner', async () => {
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
      await assertReverts(stableToken.setUriseContract(ADDRESS_NULL, {from: ANYBODY}));
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
    });

    it('should be possible to set urise contract address to a new one by owner if it is already set', async () => {
      assert.equal(await stableToken.uriseContract(), ADDRESS_NULL);
      await stableToken.setUriseContract(uriseToken.address);
      assert.equal(await stableToken.uriseContract(), uriseToken.address);

      await assertReverts(stableToken.setUriseContract(SOMEBODY));

      assert.equal(await stableToken.uriseContract(), uriseToken.address);
    });

    describe('mintFromUrise()', async () => {
      before('setUriseContract', async () => {
        await stableToken.setUriseContract(SOMEBODY);
      });

      it('should be possible to mintFromUrise by urise contract address', async () => {
        assert.equal((await stableToken.balanceOf(ANYBODY)).toString(), 0);

        await stableToken.mintFromUrise(ANYBODY, 100, {from: SOMEBODY});

        assert.equal((await stableToken.balanceOf(ANYBODY)).toString(), 100);
      });

      it('should not be possible to mintFromUrise by not urise contract address', async () => {
        assert.equal((await stableToken.balanceOf(ANYBODY)).toString(), 0);

        await assertReverts(stableToken.mintFromUrise(ANYBODY, 100, {from: ANYBODY}));

        assert.equal((await stableToken.balanceOf(ANYBODY)).toString(), 0);
      });
    });

    describe('burnFromUrise()', async () => {
      beforeEach('setUriseContract', async () => {
        await stableToken.setUriseContract(SOMEBODY);
        await stableToken.mintFromUrise(ANYBODY, 100, {from: SOMEBODY});
      });

      it('should be possible to burnFromUrise by urise contract address', async () => {
        assert.equal((await stableToken.balanceOf(ANYBODY)).toString(), 100);

        await stableToken.burnFromUrise(ANYBODY, 100, {from: SOMEBODY});

        assert.equal((await stableToken.balanceOf(ANYBODY)).toString(), 0);
      });

      it('should not be possible to burnFromUrise by not urise contract address', async () => {
        assert.equal((await stableToken.balanceOf(ANYBODY)).toString(), 100);

        await assertReverts(stableToken.burnFromUrise(ANYBODY, 100, {from: ANYBODY}));

        assert.equal((await stableToken.balanceOf(ANYBODY)).toString(), 100);
      });
    });
  });

  afterEach('revert', reverter.revert);
});
