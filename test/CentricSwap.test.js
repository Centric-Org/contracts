const Swap = artifacts.require('CentricSwap');
const Rise = artifacts.require('RiseMock');
const Reverter = require('./helpers/reverter');
const { assertReverts } = require('./helpers/assertThrows');

contract('Swap', async (accounts) => {
  const reverter = new Reverter(web3);

  let riseToken;
  let swapToken;

  const OWNER = accounts[0];
  const SOMEBODY = accounts[1];
  const ANYBODY = accounts[2];
  const ADDRESS_NULL = '0x0000000000000000000000000000000000000000';

  before('setup', async () => {
    riseToken = await Rise.new(OWNER, OWNER);
    swapToken = await Swap.new(OWNER);

    await reverter.snapshot();
  });

  describe('name()', async () => {
    it('should return token name', async () => {
      assert.equal((await swapToken.name()).toString(), 'Centric SWAP');
    });
  });

  describe('symbol()', async () => {
    it('should return token symbol', async () => {
      assert.equal((await swapToken.symbol()).toString(), 'CNS');
    });
  });

  describe('decimals()', async () => {
    it('should return token decimals', async () => {
      assert.equal((await swapToken.decimals()).toString(), 8);
    });
  });

  describe('getOwner()', async () => {
    it('should return owner', async () => {
      assert.equal((await swapToken.getOwner()).toString(), OWNER);
    });
  });

  describe('setRiseContract()', async () => {
    it('should be possible to set Rise contract address to a new one by owner', async () => {
      assert.equal(await swapToken.riseContract(), ADDRESS_NULL);
      await swapToken.setRiseContract(riseToken.address);
      assert.equal(await swapToken.riseContract(), riseToken.address);
    });

    it('should not be possible to set Rise contract address to a new one not by owner', async () => {
      assert.equal(await swapToken.riseContract(), ADDRESS_NULL);
      await assertReverts(swapToken.setRiseContract(riseToken.address, { from: ANYBODY }));
      assert.equal(await swapToken.riseContract(), ADDRESS_NULL);
    });

    it('should not be possible to set Rise contract address to a ADDRESS_NULL by owner', async () => {
      assert.equal(await swapToken.riseContract(), ADDRESS_NULL);
      await assertReverts(swapToken.setRiseContract(ADDRESS_NULL));
      assert.equal(await swapToken.riseContract(), ADDRESS_NULL);
    });

    it('should not be possible to set Rise contract address to a ADDRESS_NULL by not owner', async () => {
      assert.equal(await swapToken.riseContract(), ADDRESS_NULL);
      await assertReverts(swapToken.setRiseContract(ADDRESS_NULL, { from: ANYBODY }));
      assert.equal(await swapToken.riseContract(), ADDRESS_NULL);
    });

    it('should be possible to set Rise contract address to a new one by owner if it is already set', async () => {
      assert.equal(await swapToken.riseContract(), ADDRESS_NULL);
      await swapToken.setRiseContract(riseToken.address);
      assert.equal(await swapToken.riseContract(), riseToken.address);

      await assertReverts(swapToken.setRiseContract(SOMEBODY));

      assert.equal(await swapToken.riseContract(), riseToken.address);
    });

    describe('mintFromRise()', async () => {
      before('setRiseContract', async () => {
        await swapToken.setRiseContract(SOMEBODY);
      });

      it('should be possible to mintFromRise by Rise contract address', async () => {
        assert.equal((await swapToken.balanceOf(ANYBODY)).toString(), 0);

        await swapToken.mintFromRise(ANYBODY, 100, { from: SOMEBODY });

        assert.equal((await swapToken.balanceOf(ANYBODY)).toString(), 100);
      });

      it('should not be possible to mintFromRise by not Rise contract address', async () => {
        assert.equal((await swapToken.balanceOf(ANYBODY)).toString(), 0);

        await assertReverts(swapToken.mintFromRise(ANYBODY, 100, { from: ANYBODY }));

        assert.equal((await swapToken.balanceOf(ANYBODY)).toString(), 0);
      });
    });

    describe('burnFromRise()', async () => {
      beforeEach('setRiseContract', async () => {
        await swapToken.setRiseContract(SOMEBODY);
        await swapToken.mintFromRise(ANYBODY, 100, { from: SOMEBODY });
      });

      it('should be possible to burnFromRise by Rise contract address', async () => {
        assert.equal((await swapToken.balanceOf(ANYBODY)).toString(), 100);

        await swapToken.burnFromRise(ANYBODY, 100, { from: SOMEBODY });

        assert.equal((await swapToken.balanceOf(ANYBODY)).toString(), 0);
      });

      it('should not be possible to burnFromRise by not Rise contract address', async () => {
        assert.equal((await swapToken.balanceOf(ANYBODY)).toString(), 100);

        await assertReverts(swapToken.burnFromRise(ANYBODY, 100, { from: ANYBODY }));

        assert.equal((await swapToken.balanceOf(ANYBODY)).toString(), 100);
      });
    });
  });

  afterEach('revert', reverter.revert);
});
