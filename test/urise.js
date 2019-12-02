const Urise = artifacts.require('UriseMock');
const Reverter = require('./helpers/reverter');
const {assertReverts} = require('./helpers/assertThrows');
contract('Urise', async (accounts) => {
  const reverter = new Reverter(web3);

  let uriseToken;

  const OWNER = accounts[0];
  const SOMEBODY = accounts[1];
  const ANYBODY = accounts[2];
  const ADDRESS_NULL = '0x0000000000000000000000000000000000000000';

  before('setup', async () => {
    uriseToken = await Urise.new(OWNER, OWNER, OWNER);
    await uriseToken.setCurrentTime(1000000);

    await reverter.snapshot();
  });

  afterEach('revert', reverter.revert);

  describe('creation', async () => {
    before('setup', async () => {
      uriseToken = await Urise.new(OWNER, SOMEBODY, ANYBODY);

      await reverter.snapshot();
    });

    it('should set up all correctly while creation', async () => {
      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), '100000000000000000');
      assert.equal(await uriseToken.stableContract(), ANYBODY);
      assert.equal((await uriseToken.stableContract()), ANYBODY);
      assert.equal((await uriseToken.lastBlockNumber()).toString(), '276');
    });
  });

  describe('transferForOwner()', async () => {
    it('should be possible to transfer from one addresss to the other by owner', async () => {
      await uriseToken.mint(SOMEBODY, 100);
      await uriseToken.mint(ANYBODY, 100);

      assert.isTrue(await uriseToken.transferForOwner.call(ANYBODY, SOMEBODY, 50));
      const result = await uriseToken.transferForOwner(ANYBODY, SOMEBODY, 50);

      assert.equal((await uriseToken.balanceOf(ANYBODY)).toNumber(), 50);
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toNumber(), 150);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Transfer');
      assert.equal(result.logs[0].args.from, ANYBODY);
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

  describe('updateQuarantineWalletAddress()', async () => {
    it('should be possible to update quarantine wallet address to a new one by owner', async () => {
      assert.equal(await uriseToken.quarantineWalletAddress(), OWNER);
      assert.isTrue(await uriseToken.updateQuarantineWalletAddress.call(SOMEBODY));
      const result = await uriseToken.updateQuarantineWalletAddress(SOMEBODY);
      assert.equal(await uriseToken.quarantineWalletAddress(), SOMEBODY);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'QuarantineWalletUpdated');
      assert.equal(result.logs[0].args._oldWallet, OWNER);
      assert.equal(result.logs[0].args._newWallet, SOMEBODY);
    });

    it('should not be possible to update quarantine wallet address to a new one not by owner', async () => {
      assert.equal(await uriseToken.quarantineWalletAddress(), OWNER);
      await assertReverts(uriseToken.updateQuarantineWalletAddress(SOMEBODY, {from: ANYBODY}));
      assert.equal(await uriseToken.quarantineWalletAddress(), OWNER);
    });

    it('should not be possible to update quarantine wallet address to a ADDRESS_NULL by owner', async () => {
      assert.equal(await uriseToken.quarantineWalletAddress(), OWNER);
      await assertReverts(uriseToken.updateQuarantineWalletAddress(ADDRESS_NULL));
      assert.equal(await uriseToken.quarantineWalletAddress(), OWNER);
    });

    it('should not be possible to update quarantine wallet address to a previous address by owner', async () => {
      assert.equal(await uriseToken.quarantineWalletAddress(), OWNER);
      await assertReverts(uriseToken.updateQuarantineWalletAddress(OWNER));
      assert.equal(await uriseToken.quarantineWalletAddress(), OWNER);
    });

    it('should not be possible to update quarantine wallet address to a ADDRESS_NULL by not owner', async () => {
      assert.equal(await uriseToken.quarantineWalletAddress(), OWNER);
      await assertReverts(uriseToken.updateQuarantineWalletAddress(ADDRESS_NULL, {from: ANYBODY}));
      assert.equal(await uriseToken.quarantineWalletAddress(), OWNER);
    });

    it('should not be possible to update quarantine wallet address to a previous address by not owner', async () => {
      assert.equal(await uriseToken.quarantineWalletAddress(), OWNER);
      await assertReverts(uriseToken.updateQuarantineWalletAddress(OWNER, {from: ANYBODY}));
      assert.equal(await uriseToken.quarantineWalletAddress(), OWNER);
    });
  });

  describe('updateFutureGrowthRate()', async () => {
    it('should be possible to update with valid arguments from owner', async () => {
      assert.isTrue(await uriseToken.updateFutureGrowthRate.call(101,
        [39050, 37703, 36446, 35270]));

      const result = await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'FutureGrowthRateUpdated');
      assert.equal(result.logs[0].args._oldValue, 0);
      assert.equal(result.logs[0].args._newValue, 101);
      assert.equal(result.logs[0].args._newPriceFactors[0].toNumber(), 39050);
      assert.equal(result.logs[0].args._newPriceFactors[1].toNumber(), 37703);
      assert.equal(result.logs[0].args._newPriceFactors[2].toNumber(), 36446);
      assert.equal(result.logs[0].args._newPriceFactors[3].toNumber(), 35270);
    });

    it('should not be possible to update with zero rate from owner', async () => {
      assert.isTrue(await uriseToken.updateFutureGrowthRate.call(101,
        [39050, 37703, 36446, 35270]));

      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);

      await assertReverts(uriseToken.updateFutureGrowthRate(0, [39050, 37703, 36446, 35270]));

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);
    });

    it('should not be possible to update with current rate from owner', async () => {
      assert.isTrue(await uriseToken.updateFutureGrowthRate.call(101,
        [39050, 37703, 36446, 35270]));

      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);

      await assertReverts(uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]));

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);
    });

    it('should not be possible to update with rate greater than base from owner', async () => {
      assert.isTrue(await uriseToken.updateFutureGrowthRate.call(101,
        [39050, 37703, 36446, 35270]));

      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);

      await assertReverts(uriseToken.updateFutureGrowthRate(10001, [39050, 37703, 36446, 35270]));

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);
    });

    it('should not be possible to update with at least one 0 value in priceFactors from owner', async () => {
      assert.isTrue(await uriseToken.updateFutureGrowthRate.call(101,
        [39050, 37703, 36446, 35270]));

      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);

      await assertReverts(uriseToken.updateFutureGrowthRate(201, [0, 37703, 36446, 35270]));

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);
    });

    it('should not be possible to update with at least one 0 value in priceFactors from owner', async () => {
      assert.isTrue(await uriseToken.updateFutureGrowthRate.call(101,
        [39050, 37703, 36446, 35270]));

      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);

      await assertReverts(uriseToken.updateFutureGrowthRate(201, [39050, 37703, 0, 35270]));

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);
    });

    it('should not be possible to update with all 0 values in priceFactors from owner', async () => {
      assert.isTrue(await uriseToken.updateFutureGrowthRate.call(101,
        [39050, 37703, 36446, 35270]));

      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);

      await assertReverts(uriseToken.updateFutureGrowthRate(201, [0, 0, 0, 0]));

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);
    });

    it('should not be possible to update with value less than next one in priceFactors case 1 from owner', async () => {
      assert.isTrue(await uriseToken.updateFutureGrowthRate.call(101,
        [39050, 37703, 36446, 35270]));

      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);

      await assertReverts(uriseToken.updateFutureGrowthRate(201, [10000, 37703, 36446, 35270]));

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);
    });

    it('should not be possible to update with value less than next one in priceFactors case 2 from owner', async () => {
      assert.isTrue(await uriseToken.updateFutureGrowthRate.call(101,
        [39050, 37703, 36446, 35270]));

      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);

      await assertReverts(uriseToken.updateFutureGrowthRate(201, [39050, 10000, 36446, 35270]));

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);
    });

    it('should not be possible to update with value less than next one in priceFactors case 3 from owner', async () => {
      assert.isTrue(await uriseToken.updateFutureGrowthRate.call(101,
        [39050, 37703, 36446, 35270]));

      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);

      await assertReverts(uriseToken.updateFutureGrowthRate(201, [39050, 37703, 10000, 35270]));

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);
    });

    it('should not be possible to update with valid values not from owner', async () => {
      assert.isTrue(await uriseToken.updateFutureGrowthRate.call(101,
        [39050, 37703, 36446, 35270]));

      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);

      await assertReverts(uriseToken.updateFutureGrowthRate(201, [39050, 37703, 36446, 35270], {from: ANYBODY}));

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);
    });
  });

  describe('createBlock()', async () => {
    it('shoulf be possible to create first block with valid values', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);
    });
  });
});
