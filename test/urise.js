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

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 2', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(696);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 3', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(720);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 4', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(744);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 1', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args._risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args._futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args._change.toString(), '29991');
      assert.equal(result1.logs[0].args._created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 2', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(696);

      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args._risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args._futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args._change.toString(), '29991');
      assert.equal(result1.logs[0].args._created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 3', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(720);

      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args._risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args._futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args._change.toString(), '29991');
      assert.equal(result1.logs[0].args._created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 4', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(744);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args._risePrice.toString(), '10003');
      assert.equal(result.logs[0].args._futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args._change.toString(), '30000');
      assert.equal(result.logs[0].args._created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(744);

      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args._risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args._futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args._change.toString(), '29991');
      assert.equal(result1.logs[0].args._created.toString(), '2');
    });

    it('should not be possible to create block with wrong monthBlock', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      await assertReverts(uriseToken.createBlockMock(673));

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '0');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '0');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '0');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '0');
    });
  });

  describe('switchToStable()', async () => {
    beforeEach('set up stable contract', async () => {
      stableToken = await StableToken.new(OWNER, OWNER);
      uriseToken = await Urise.new(OWNER, OWNER, stableToken.address);
      await stableToken.setUriseContract(uriseToken.address);
    });
    
    it('should be possible to switchToStable with suficient balance case 1', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      await uriseToken.mint(SOMEBODY, 1000);

      await uriseToken.doRise(672);

      const result = await uriseToken.switchToStable(900, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 900);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 900);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 900);
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 100);

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[3].event, 'ConvertToStable');
      assert.equal(result.logs[3].args.converter, SOMEBODY);
      assert.equal(result.logs[3].args.amountConverted, 900);
      assert.equal(result.logs[2].event, 'MintStable');
      assert.equal(result.logs[2].args.receiver, SOMEBODY);
      assert.equal(result.logs[2].args.amount, 900);
    })

    it('should be possible to switchToStable with suficient balance case 2', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      await uriseToken.mint(SOMEBODY, 1000);

      await uriseToken.doCreateBlocks(672);
      await uriseToken.setCurrentTime(72001);
      await uriseToken.doRise(672);

      const result = await uriseToken.switchToStable(900, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 900);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 900);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 905);
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 100);

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[3].event, 'ConvertToStable');
      assert.equal(result.logs[3].args.converter, SOMEBODY);
      assert.equal(result.logs[3].args.amountConverted, 900);
      assert.equal(result.logs[2].event, 'MintStable');
      assert.equal(result.logs[2].args.receiver, SOMEBODY);
      assert.equal(result.logs[2].args.amount, 905);
    })

    it('should be possible to switchToStable with suficient balance case 3', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      await uriseToken.mint(SOMEBODY, 1000);

      await uriseToken.doCreateBlocks(672);
      await uriseToken.setCurrentTime(72001);
      await uriseToken.doRise(672);

      const result = await uriseToken.switchToStable(0, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 0);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 1000);

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[3].event, 'ConvertToStable');
      assert.equal(result.logs[3].args.converter, SOMEBODY);
      assert.equal(result.logs[3].args.amountConverted, 0);
      assert.equal(result.logs[2].event, 'MintStable');
      assert.equal(result.logs[2].args.receiver, SOMEBODY);
      assert.equal(result.logs[2].args.amount, 0);
    })

    it('should not be possible to switchToStable with insufficient balance', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      await uriseToken.mint(SOMEBODY, 800);

      await uriseToken.doCreateBlocks(672);
      await uriseToken.setCurrentTime(72001);
      await uriseToken.doRise(672);

      await assertReverts(uriseToken.switchToStable(900, SOMEBODY, {from: SOMEBODY}));

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 0);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 800);
    })

    it('should not be possible to switchToStable with 0 risePrice', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      await uriseToken.mint(SOMEBODY, 1000);

      await uriseToken.doCreateBlocks(672);
      await uriseToken.setCurrentTime(144001);
      await uriseToken.doRise(672);

      await assertReverts(uriseToken.switchToStable(900, SOMEBODY, {from: SOMEBODY}));

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 0);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 1000);
    })
  });

  describe('burnQuarantined()', async () => {
    const quarantineAddress = ANYBODY;

    beforeEach('set up stable contract', async () => {
      stableToken = await StableToken.new(OWNER, OWNER);
      uriseToken = await Urise.new(OWNER, OWNER, stableToken.address);
      await stableToken.setUriseContract(uriseToken.address);
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);
      await uriseToken.doRise(672);
      await uriseToken.mint(SOMEBODY, 100000);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 1', async () => {
      await uriseToken.switchToStable(90000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '90000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '90000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(10000)).toString(), 9);
      const result = await uriseToken.burnQuarantinedMock(10000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '89991');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '89991');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 9);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 2', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '50000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(100000)).toString(), 50);
      const result = await uriseToken.burnQuarantinedMock(100000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '49950');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '49950');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 50);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 3', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '50000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(30530)).toString(), 16);
      const result = await uriseToken.burnQuarantinedMock(30530);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '49984');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '49984');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 16);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 4', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '50000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(78000)).toString(), 39);
      const result = await uriseToken.burnQuarantinedMock(78000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '49961');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '49961');


      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 39);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 5', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '50000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(12000)).toString(), 6);
      const result = await uriseToken.burnQuarantinedMock(12000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '49994');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '49994');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 6);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 6', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '50000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(1200000)).toString(), 593);
      const result = await uriseToken.burnQuarantinedMock(1200000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '49407');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '49407');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 593);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 7', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '50000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(800000)).toString(), 397);
      const result = await uriseToken.burnQuarantinedMock(800000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '49603');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '49603');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 397);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 8', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '50000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(916000)).toString(), 454);
      const result = await uriseToken.burnQuarantinedMock(916000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '49546');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '49546');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 454);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 9', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '50000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(1983000)).toString(), 973);
      const result = await uriseToken.burnQuarantinedMock(1983000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '49027');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '49027');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 973);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 10', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '50000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(20000000000)).toString(), 49752);
      const result = await uriseToken.burnQuarantinedMock(20000000000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '248');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '248');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 49752);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and evarage change case 11', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '50000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(8500000)).toString(), 3918);
      const result = await uriseToken.burnQuarantinedMock(8500000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '46082');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '46082');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 3918);
    });

    it('should be possible to burnQuarantined with quarantine wallet empty and evarage change', async () => {
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '0');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '0');

      assert.equal((await uriseToken.burnQuarantinedMock.call(34000)).toString(), 0);
      const result = await uriseToken.burnQuarantinedMock(10000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '0');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '0');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 0);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance and huge change', async () => {
      await uriseToken.switchToStable(50000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '50000');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await uriseToken.burnQuarantinedMock.call(10000000000000)).toString(), '50000');
      const result = await uriseToken.burnQuarantinedMock(10000000000000);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), '0');
      assert.equal((await uriseToken.quarantineBalance()).toString(), '0');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantinBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 50000);
    });
  });

  describe('switchToRise()', async () => {
    beforeEach('set up stable contract', async () => {
      stableToken = await StableToken.new(OWNER, OWNER);
      uriseToken = await Urise.new(OWNER, OWNER, stableToken.address);
      await stableToken.setUriseContract(uriseToken.address);
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
    });

    it('should be possible to switchToRise with sufficient funds', async () => {
      await uriseToken.mint(SOMEBODY, 2000);
      await uriseToken.doCreateBlocks(672);
      await uriseToken.setCurrentTime(72001);
      await uriseToken.doRise(672);
      await uriseToken.switchToStable(1000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 1000);
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 1000);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 1000);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 1006);

      const result = await uriseToken.switchToRise(1006, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 2000);
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 0);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 0);

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[1].event, 'BurnStable');
      assert.equal(result.logs[3].event, 'ConvertToRise');
    })
  });

  describe('doRise()', async () => {
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
      await uriseToken.setCurrentTime(7201);

      const result = await uriseToken.doRise(720);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoRise');
      assert.equal(result.logs[2].args.time, 7201);
      assert.equal(result.logs[2].args.blockNumber, 2);
      assert.equal(result.logs[2].args.riseAmountBurnt, 15);
      assert.equal(result.logs[2].args.change, 29991);
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
