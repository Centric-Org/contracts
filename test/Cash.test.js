const Cash = artifacts.require('Cash');
const Rise = artifacts.require('RiseMock');
const Reverter = require('./helpers/reverter');
const { assertReverts } = require('./helpers/assertThrows');

contract('Cash', async accounts => {
  const reverter = new Reverter(web3);

  let riseToken;
  let cashToken;

  const OWNER = accounts[0];
  const SOMEBODY = accounts[1];
  const ANYBODY = accounts[2];
  const ADDRESS_NULL = '0x0000000000000000000000000000000000000000';

  before('setup', async () => {
    riseToken = await Rise.new(OWNER, OWNER);
    cashToken = await Cash.new(OWNER);

    await reverter.snapshot();
  });

  describe('setRiseContract()', async () => {
    it('should be possible to set Rise contract address to a new one by owner', async () => {
      assert.equal(await cashToken.riseContract(), ADDRESS_NULL);
      await cashToken.setRiseContract(riseToken.address);
      assert.equal(await cashToken.riseContract(), riseToken.address);
    });

    it('should not be possible to set Rise contract address to a new one not by owner', async () => {
      assert.equal(await cashToken.riseContract(), ADDRESS_NULL);
      await assertReverts(cashToken.setRiseContract(riseToken.address, { from: ANYBODY }));
      assert.equal(await cashToken.riseContract(), ADDRESS_NULL);
    });

    it('should not be possible to set Rise contract address to a ADDRESS_NULL by owner', async () => {
      assert.equal(await cashToken.riseContract(), ADDRESS_NULL);
      await assertReverts(cashToken.setRiseContract(ADDRESS_NULL));
      assert.equal(await cashToken.riseContract(), ADDRESS_NULL);
    });

    it('should not be possible to set Rise contract address to a ADDRESS_NULL by not owner', async () => {
      assert.equal(await cashToken.riseContract(), ADDRESS_NULL);
      await assertReverts(cashToken.setRiseContract(ADDRESS_NULL, { from: ANYBODY }));
      assert.equal(await cashToken.riseContract(), ADDRESS_NULL);
    });

    it('should be possible to set Rise contract address to a new one by owner if it is already set', async () => {
      assert.equal(await cashToken.riseContract(), ADDRESS_NULL);
      await cashToken.setRiseContract(riseToken.address);
      assert.equal(await cashToken.riseContract(), riseToken.address);

      await assertReverts(cashToken.setRiseContract(SOMEBODY));

      assert.equal(await cashToken.riseContract(), riseToken.address);
    });

    describe('mintFromRise()', async () => {
      before('setRiseContract', async () => {
        await cashToken.setRiseContract(SOMEBODY);
      });

      it('should be possible to mintFromRise by Rise contract address', async () => {
        assert.equal((await cashToken.balanceOf(ANYBODY)).toString(), 0);

        await cashToken.mintFromRise(ANYBODY, 100, { from: SOMEBODY });

        assert.equal((await cashToken.balanceOf(ANYBODY)).toString(), 100);
      });

      it('should not be possible to mintFromRise by not Rise contract address', async () => {
        assert.equal((await cashToken.balanceOf(ANYBODY)).toString(), 0);

        await assertReverts(cashToken.mintFromRise(ANYBODY, 100, { from: ANYBODY }));

        assert.equal((await cashToken.balanceOf(ANYBODY)).toString(), 0);
      });
    });

    describe('burnFromRise()', async () => {
      beforeEach('setRiseContract', async () => {
        await cashToken.setRiseContract(SOMEBODY);
        await cashToken.mintFromRise(ANYBODY, 100, { from: SOMEBODY });
      });

      it('should be possible to burnFromRise by Rise contract address', async () => {
        assert.equal((await cashToken.balanceOf(ANYBODY)).toString(), 100);

        await cashToken.burnFromRise(ANYBODY, 100, { from: SOMEBODY });

        assert.equal((await cashToken.balanceOf(ANYBODY)).toString(), 0);
      });

      it('should not be possible to burnFromRise by not Rise contract address', async () => {
        assert.equal((await cashToken.balanceOf(ANYBODY)).toString(), 100);

        await assertReverts(cashToken.burnFromRise(ANYBODY, 100, { from: ANYBODY }));

        assert.equal((await cashToken.balanceOf(ANYBODY)).toString(), 100);
      });
    });
  });

  afterEach('revert', reverter.revert);
});
