const Urise = artifacts.require('UriseMock');
const StableToken = artifacts.require('StableToken');
const Reverter = require('./helpers/reverter');
const {assertReverts} = require('./helpers/assertThrows');
contract('Urise', async (accounts) => {
  const reverter = new Reverter(web3);

  let uriseToken;
  let stableToken;

  const OWNER = accounts[0];
  const SOMEBODY = accounts[1];
  const ANYBODY = accounts[2];
  const ADDRESS_NULL = '0x0000000000000000000000000000000000000000';

  before('setup', async () => {
    uriseToken = await Urise.new(OWNER, OWNER, OWNER);

    await uriseToken.setCurrentTime(3600);

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
      assert.equal((await uriseToken.lastBlockNumber()).toString(), '0');
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

      await assertReverts(uriseToken.updateFutureGrowthRate(201,
        [39050, 37703, 36446, 35270], {from: ANYBODY}));

      assert.equal((await uriseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 39050);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 37703);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 36446);
      assert.equal((await uriseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 35270);
    });
  });

  describe('createBlock()', async () => {
    it('should be possible to create first block with valid future growth rate values and price factors case 1', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(1)).blockNumber.toString(), '1');
      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._blockNumber.toString(), '1');
      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 2', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(696);

      assert.equal((await uriseToken.hoursToBlock(1)).blockNumber.toString(), '1');
      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._blockNumber.toString(), '1');
      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 3', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(720);

      assert.equal((await uriseToken.hoursToBlock(1)).blockNumber.toString(), '1');
      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._blockNumber.toString(), '1');
      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 4', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(744);

      assert.equal((await uriseToken.hoursToBlock(1)).blockNumber.toString(), '1');
      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._blockNumber.toString(), '1');
      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 1', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(1)).blockNumber.toString(), '1');
      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._blockNumber.toString(), '1');
      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(2)).blockNumber.toString(), '2');
      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args._blockNumber.toString(), '2');
      assert.equal(result1.logs[0].args._risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args._futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args._change.toString(), '29991');
      assert.equal(result1.logs[0].args._created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 2', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(1)).blockNumber.toString(), '1');
      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._blockNumber.toString(), '1');
      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(696);

      assert.equal((await uriseToken.hoursToBlock(2)).blockNumber.toString(), '2');
      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args._blockNumber.toString(), '2');
      assert.equal(result1.logs[0].args._risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args._futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args._change.toString(), '29991');
      assert.equal(result1.logs[0].args._created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 3', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(1)).blockNumber.toString(), '1');
      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._blockNumber.toString(), '1');
      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(720);

      assert.equal((await uriseToken.hoursToBlock(2)).blockNumber.toString(), '2');
      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args._blockNumber.toString(), '2');
      assert.equal(result1.logs[0].args._risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args._futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args._change.toString(), '29991');
      assert.equal(result1.logs[0].args._created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 4', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(744);

      assert.equal((await uriseToken.hoursToBlock(1)).blockNumber.toString(), '1');
      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._blockNumber.toString(), '1');
      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(744);

      assert.equal((await uriseToken.hoursToBlock(2)).blockNumber.toString(), '2');
      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args._blockNumber.toString(), '2');
      assert.equal(result1.logs[0].args._risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args._futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args._change.toString(), '29991');
      assert.equal(result1.logs[0].args._created.toString(), '2');
    });

    it('should not be possible to create block with wrong monthBlock', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      await assertReverts(uriseToken.createBlockMock(673));

      assert.equal((await uriseToken.hoursToBlock(1)).blockNumber.toString(), '0');
      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '0');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '0');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '0');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '0');
    });
  });

  describe('switchToStable()', async () => {
    const quarantineAddress = ANYBODY;

    beforeEach('set up stable contract', async () => {
      stableToken = await StableToken.new(OWNER, OWNER);
      await uriseToken.updateStableTokenAddress(stableToken.address);
      await stableToken.updateRiseContract(uriseToken.address);
      await uriseToken.updateQuarantineWalletAddress(quarantineAddress);
    });

    it('should be possible to switchToStable with sufficient balance', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      await uriseToken.createBlockMock(672);

      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 50000, {from: SOMEBODY});

      const result = await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), '50000');
      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), '50015');

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[2].event, 'MintStable');
      assert.equal(result.logs[2].args.receiver, SOMEBODY);
      assert.equal(result.logs[3].event, 'ConvertToStable');
      assert.equal(result.logs[3].args.converter, SOMEBODY);
      assert.equal(result.logs[3].args.amountConverted, 50000);
      assert.equal(result.logs[3].args.activeBlockNumber, 1);
    });

    it('should return valid value while switchToStable with sufficient balance', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      await uriseToken.createBlockMock(672);

      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 100000, {from: SOMEBODY});

      const result = await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), '50000');
      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), '50015');

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[2].event, 'MintStable');
      assert.equal(result.logs[2].args.receiver, SOMEBODY);
      assert.equal(result.logs[3].event, 'ConvertToStable');
      assert.equal(result.logs[3].args.converter, SOMEBODY);
      assert.equal(result.logs[3].args.amountConverted, 50000);
      assert.equal(result.logs[3].args.activeBlockNumber, 1);

      assert.equal((await uriseToken.switchToStable.call(50000, SOMEBODY,
        {from: SOMEBODY})).toString(), '50015');
    });

    it('should be possible to switchToStable with sufficient balance and to active blocks', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      await uriseToken.createBlockMock(672);
      await uriseToken.setCurrentTime(7201);
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
      await uriseToken.createBlockMock(672);

      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 50000, {from: SOMEBODY});

      const result = await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), '50000');
      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), '50030');

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[2].event, 'MintStable');
      assert.equal(result.logs[2].args.receiver, SOMEBODY);
      assert.equal(result.logs[3].event, 'ConvertToStable');
      assert.equal(result.logs[3].args.converter, SOMEBODY);
      assert.equal(result.logs[3].args.amountConverted, 50000);
      assert.equal(result.logs[3].args.activeBlockNumber, 2);
    });

    it('should not be possible to switchToStable with insufficient balance', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);
      await uriseToken.createBlockMock(672);

      await uriseToken.mint(SOMEBODY, 10);
      await uriseToken.approve(SOMEBODY, 50000, {from: SOMEBODY});

      await assertReverts(uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY}));

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), '10');
      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '0');
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), '0');
    });

    it('should not be possible to switchToStable with wrong approval', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);
      await uriseToken.createBlockMock(672);

      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 40000, {from: SOMEBODY});

      await assertReverts(uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY}));

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), '100000');
      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '0');
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), '0');
    });

    it('should not be possible to switchToStable with wrong approval', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);
      await uriseToken.createBlockMock(672);

      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 40000, {from: SOMEBODY});

      await assertReverts(uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY}));

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), '100000');
      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '0');
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), '0');
    });
  });

  describe('burnQuarantined()', async () => {
    const quarantineAddress = ANYBODY;

    beforeEach('set up stable contract', async () => {
      stableToken = await StableToken.new(OWNER, OWNER);
      await uriseToken.updateStableTokenAddress(stableToken.address);
      await stableToken.updateRiseContract(uriseToken.address);
      await uriseToken.updateQuarantineWalletAddress(quarantineAddress);
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);
      await uriseToken.createBlockMock(672);
      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 50000, {from: SOMEBODY});
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 1', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(10000)).toString(), 5);
      await uriseToken.burnQuarantinedMock(10000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '49995');
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 2', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(100000)).toString(), 50);
      await uriseToken.burnQuarantinedMock(100000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '49950');
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 3', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(30530)).toString(), 16);
      await uriseToken.burnQuarantinedMock(30530);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '49984');
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 4', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(78000)).toString(), 39);
      await uriseToken.burnQuarantinedMock(78000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '49961');
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 5', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(12000)).toString(), 6);
      await uriseToken.burnQuarantinedMock(12000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '49994');
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 6', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(1200000)).toString(), 593);
      await uriseToken.burnQuarantinedMock(1200000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '49407');
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 7', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(800000)).toString(), 397);
      await uriseToken.burnQuarantinedMock(800000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '49603');
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 8', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(916000)).toString(), 454);
      await uriseToken.burnQuarantinedMock(916000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '49546');
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 9', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(1983000)).toString(), 973);
      await uriseToken.burnQuarantinedMock(1983000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '49027');
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 10', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(20000000000)).toString(), 49752);
      await uriseToken.burnQuarantinedMock(20000000000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '248');
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 11', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(8500000)).toString(), 3918);
      await uriseToken.burnQuarantinedMock(916000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '49546');
    });

    it('should be possible to burnQuarantined with quarantine wallet empty and evarage change', async () => {
      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '0');

      assert.equal((await uriseToken.burnQuarantinedMock.call(34000)).toString(), 0);
      await uriseToken.burnQuarantinedMock(10000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '0');
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and huge change', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(10000000000000)).toString(), '50000');
      await uriseToken.burnQuarantinedMock(10000000000000);

      assert.equal((await uriseToken.balanceOf(quarantineAddress)).toString(), '0');
    });
  });

  describe('switchToRise()', async () => {
    beforeEach('set up stable contract', async () => {
      stableToken = await StableToken.new(OWNER, OWNER);
      await uriseToken.updateStableTokenAddress(stableToken.address);
      await stableToken.updateRiseContract(uriseToken.address);
    });

    it('should not be possible to switchToRise from address with sufficient balance not from stable owner', async () => {
      await stableToken.mint(SOMEBODY, 10000);
      await uriseToken.approve(SOMEBODY, 5000);

      await assertReverts(uriseToken.switchToRise(5000, SOMEBODY));

      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 10000);
    });

    it('should not be possible to switchToRise from address with insufficient balance from stable owner', async () => {
      await stableToken.mint(SOMEBODY, 100);
      await uriseToken.approve(SOMEBODY, 500);

      await assertReverts(uriseToken.switchToRise(5000, SOMEBODY));

      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 100);
    });

    it('should not be possible to switchToRise from address with sufficient balance from stable owner with invalid allowance', async () => {
      await stableToken.mint(SOMEBODY, 10000);
      await uriseToken.approve(SOMEBODY, 500);

      await assertReverts(uriseToken.switchToRise(5000, SOMEBODY));

      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 10000);
    });
  });

  describe('doRise()', async () => {
    const quarantineAddress = ANYBODY;

    beforeEach('set up stable contract', async () => {
      stableToken = await StableToken.new(OWNER, OWNER);
      await uriseToken.updateStableTokenAddress(stableToken.address);
      await stableToken.updateRiseContract(uriseToken.address);
      await uriseToken.updateQuarantineWalletAddress(quarantineAddress);
    });

    it('should be possible to doRise with valid futureGrowthRate and monthBlocks from owner', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
      await uriseToken.createBlockMock(672);
      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 50000, {from: SOMEBODY});
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      const result = await uriseToken.doRise(720);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoRise');
      assert.equal(result.logs[2].args.time, 3600);
      assert.equal(result.logs[2].args.blockNumber, 1);
      assert.equal(result.logs[2].args.riseAmountBurnt, 15);
      assert.equal(result.logs[2].args.change, 30000);
    });

    it('should not be possible to doRise with invalid futureGrowthRate but valid monthBlocks from owner', async () => {
      await uriseToken.createBlockMock(672);
      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 50000, {from: SOMEBODY});
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      await assertReverts(uriseToken.doRise(720));
    });

    it('should not be possible to doRise with valid futureGrowthRate but invalid monthBlocks from owner', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
      await uriseToken.createBlockMock(672);
      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 50000, {from: SOMEBODY});
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      await assertReverts(uriseToken.doRise(721));
    });

    it('should not be possible to doRise with valid futureGrowthRate but invalid monthBlocks from owner case 2', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
      await uriseToken.createBlockMock(672);
      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 50000, {from: SOMEBODY});
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      await assertReverts(uriseToken.doRise(10000));
    });

    it('should not be possible to doRise with valid futureGrowthRate and monthBlocks not from owner', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
      await uriseToken.createBlockMock(672);
      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 50000, {from: SOMEBODY});
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      await assertReverts(uriseToken.doRise(720, {from: ANYBODY}));
    });

    it('should not be possible to doRise with valid futureGrowthRate and monthBlocks from owner when burQuarantine returns 0', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
      await uriseToken.createBlockMock(672);
      await uriseToken.mint(SOMEBODY, 100000);
      await uriseToken.approve(SOMEBODY, 50000, {from: SOMEBODY});
      await uriseToken.switchToStable(0, SOMEBODY);

      await assertReverts(uriseToken.doRise(720, {from: ANYBODY}));
    });
  });

  describe('doCreateBlocks', async () => {
    beforeEach('set up stable contract', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
    });

    it('should be possible to doCreateBlocks with valid values from owner case 1', async () => {
      const result = await uriseToken.doCreateBlocks(672);

      assert.equal(result.logs.length, 24);
      assert.equal(result.logs[0].event, 'BlockCreated');
    });

    it('should be possible to doCreateBlocks with valid values from owner case 2', async () => {
      const result = await uriseToken.doCreateBlocks(696);

      assert.equal(result.logs.length, 24);
      assert.equal(result.logs[0].event, 'BlockCreated');
    });

    it('should be possible to doCreateBlocks with valid values from owner case 3', async () => {
      const result = await uriseToken.doCreateBlocks(720);

      assert.equal(result.logs.length, 24);
      assert.equal(result.logs[0].event, 'BlockCreated');
    });

    it('should be possible to doCreateBlocks with valid values from owner case 4', async () => {
      const result = await uriseToken.doCreateBlocks(744);

      assert.equal(result.logs.length, 24);
      assert.equal(result.logs[0].event, 'BlockCreated');
    });

    it('should not be possible to doCreateBlocks with invalid montjBlock values from owner case 1', async () => {
      await assertReverts(uriseToken.doCreateBlocks(691));
    });

    it('should not be possible to doCreateBlocks with invalid montjBlock values from owner case 2', async () => {
      await assertReverts(uriseToken.doCreateBlocks(10000));
    });
  });
});
