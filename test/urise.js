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

      assert.equal(result.logs[0].args.risePrice.toString(), '10003');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '30000');
      assert.equal(result.logs[0].args.created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 2', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(696);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '10003');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '30000');
      assert.equal(result.logs[0].args.created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 3', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(720);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '10003');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '30000');
      assert.equal(result.logs[0].args.created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 4', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(744);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '10003');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '30000');
      assert.equal(result.logs[0].args.created.toString(), '1');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 1', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '10003');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '30000');
      assert.equal(result.logs[0].args.created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args.risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args.futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args.change.toString(), '29991');
      assert.equal(result1.logs[0].args.created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 2', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '10003');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '30000');
      assert.equal(result.logs[0].args.created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(696);

      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args.risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args.futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args.change.toString(), '29991');
      assert.equal(result1.logs[0].args.created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 3', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(672);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '10003');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '30000');
      assert.equal(result.logs[0].args.created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(720);

      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args.risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args.futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args.change.toString(), '29991');
      assert.equal(result1.logs[0].args.created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 4', async () => {
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);

      const result = await uriseToken.createBlockMock(744);

      assert.equal((await uriseToken.hoursToBlock(1)).risePrice.toString(), '10003');
      assert.equal((await uriseToken.hoursToBlock(1)).growthRate.toString(), '101');
      assert.equal((await uriseToken.hoursToBlock(1)).change.toString(), '30000');
      assert.equal((await uriseToken.hoursToBlock(1)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '10003');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '30000');
      assert.equal(result.logs[0].args.created.toString(), '1');

      await uriseToken.setCurrentTime(7201);

      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      const result1 = await uriseToken.createBlockMock(744);

      assert.equal((await uriseToken.hoursToBlock(2)).risePrice.toString(), '10006');
      assert.equal((await uriseToken.hoursToBlock(2)).growthRate.toString(), '1001');
      assert.equal((await uriseToken.hoursToBlock(2)).change.toString(), '29991');
      assert.equal((await uriseToken.hoursToBlock(2)).created.toString(), '2');

      assert.equal(result1.logs[0].args.risePrice.toString(), '10006');
      assert.equal(result1.logs[0].args.futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args.change.toString(), '29991');
      assert.equal(result1.logs[0].args.created.toString(), '2');
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

      await uriseToken.doCreateBlock(672);
      await uriseToken.doRise();

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
    });

    it('should be possible to switchToStable with suficient balance case 2', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      await uriseToken.mint(SOMEBODY, 1000);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.setCurrentTime(72001);
      await uriseToken.doRise();

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
    });

    it('should be possible to switchToStable with suficient balance case 3', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      await uriseToken.mint(SOMEBODY, 1000);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.setCurrentTime(72001);
      await uriseToken.doRise();

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
    });

    it('should not be possible to switchToStable with insufficient balance', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      await uriseToken.mint(SOMEBODY, 800);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.setCurrentTime(72001);
      await uriseToken.doRise();

      await assertReverts(uriseToken.switchToStable(900, SOMEBODY, {from: SOMEBODY}));

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 0);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 800);
    });

    it('should not be possible to switchToStable with 0 risePrice', async () => {
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);

      await uriseToken.mint(SOMEBODY, 1000);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.setCurrentTime(144001);

      await assertReverts(uriseToken.switchToStable(900, SOMEBODY, {from: SOMEBODY}));

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 0);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 1000);
    });
  });

  describe('burnQuarantined()', async () => {
    beforeEach('set up stable contract', async () => {
      stableToken = await StableToken.new(OWNER, OWNER);
      uriseToken = await Urise.new(OWNER, OWNER, stableToken.address);
      await stableToken.setUriseContract(uriseToken.address);
      await uriseToken.updateFutureGrowthRate(101, [39050, 37703, 36446, 35270]);
      await uriseToken.doCreateBlock(672);
      await uriseToken.doRise();
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
      await uriseToken.setCurrentTime(72001);
      uriseToken = await Urise.new(OWNER, OWNER, stableToken.address);
      await stableToken.setUriseContract(uriseToken.address);
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
    });

    it('should be possible to switchToRise with sufficient funds', async () => {
      await uriseToken.mint(SOMEBODY, 2000);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.setCurrentTime(72001);

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
      assert.equal(result.logs[1].args.amountBurnt, 1006);
      assert.equal(result.logs[3].args.converter, SOMEBODY);
      assert.equal(result.logs[3].args.amountConverted, 1006);
    });

    it('should not be possible to switchToRise with insufficient funds', async () => {
      await uriseToken.mint(SOMEBODY, 900);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.setCurrentTime(72001);

      await uriseToken.switchToStable(900, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 900);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 900);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 905);

      await assertReverts(uriseToken.switchToRise(1006, SOMEBODY, {from: SOMEBODY}));

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 900);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 900);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 905);
    });

    it('should not be possible to switchToRise with no block for current hour', async () => {
      await uriseToken.mint(SOMEBODY, 2000);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.setCurrentTime(72001);

      await uriseToken.switchToStable(1000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 1000);
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 1000);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 1000);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 1006);

      await uriseToken.setCurrentTime(172001);

      await assertReverts(uriseToken.switchToRise(1006, SOMEBODY, {from: SOMEBODY}));

      assert.equal((await uriseToken.balanceOf(SOMEBODY)).toString(), 1000);
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 1000);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 1000);
      assert.equal((await stableToken.balanceOf(SOMEBODY)).toString(), 1006);
    });
  });

  describe('doRise()', async () => {
    beforeEach('set up stable contract', async () => {
      stableToken = await StableToken.new(OWNER, OWNER);
      await uriseToken.setCurrentTime(72001);
      uriseToken = await Urise.new(OWNER, OWNER, stableToken.address);
      await uriseToken.setCurrentTime(72001);
      await stableToken.setUriseContract(uriseToken.address);
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
    });

    it('should be possible to doRise from somebody', async () => {
      await uriseToken.mint(ANYBODY, 10000);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.switchToStable(9000, ANYBODY, {from: ANYBODY});

      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);

      assert.equal((await uriseToken.doRise.call()), true);
      const result = await uriseToken.doRise({from: SOMEBODY});

      assert.equal((await uriseToken.quarantineBalance()).toString(), 8997);
      assert.equal((await uriseToken.lastCalledHour()).toString(), 20);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoRise');
      assert.equal(result.logs[2].args.currentHour, 20);
      assert.equal(result.logs[2].args.riseAmountBurnt, 3);
      assert.equal(result.logs[2].args.change, 29829);
    });

    it('should be possible to doRise from owner', async () => {
      await uriseToken.mint(ANYBODY, 10000);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.switchToStable(9000, ANYBODY, {from: ANYBODY});

      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);

      assert.equal((await uriseToken.doRise.call()), true);
      const result = await uriseToken.doRise();

      assert.equal((await uriseToken.quarantineBalance()).toString(), 8997);
      assert.equal((await uriseToken.lastCalledHour()).toString(), 20);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoRise');
      assert.equal(result.logs[2].args.currentHour, 20);
      assert.equal(result.logs[2].args.riseAmountBurnt, 3);
      assert.equal(result.logs[2].args.change, 29829);
    });

    it('should be possible to doRise if quarantine balance is 0', async () => {
      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);

      assert.equal((await uriseToken.doRise.call()), true);
      const result = await uriseToken.doRise();

      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);
      assert.equal((await uriseToken.lastCalledHour()).toString(), 20);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoRise');
      assert.equal(result.logs[2].args.currentHour, 20);
      assert.equal(result.logs[2].args.riseAmountBurnt, 0);
      assert.equal(result.logs[2].args.change, 29829);
    });

    it('should be possible to doRise second time in the next hour', async () => {
      await uriseToken.mint(ANYBODY, 10000);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.switchToStable(9000, ANYBODY, {from: ANYBODY});

      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);

      assert.equal((await uriseToken.doRise.call()), true);
      const result = await uriseToken.doRise();

      assert.equal((await uriseToken.quarantineBalance()).toString(), 8997);
      assert.equal((await uriseToken.lastCalledHour()).toString(), 20);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoRise');
      assert.equal(result.logs[2].args.currentHour, 20);
      assert.equal(result.logs[2].args.riseAmountBurnt, 3);
      assert.equal(result.logs[2].args.change, 29829);

      await uriseToken.setCurrentTime(75601);
      assert.equal((await uriseToken.doRise.call()), true);
      const result1 = await uriseToken.doRise();

      assert.equal((await uriseToken.quarantineBalance()).toString(), 8994);
      assert.equal((await uriseToken.lastCalledHour()).toString(), 21);

      assert.equal(result1.logs.length, 3);
      assert.equal(result1.logs[2].event, 'DoRise');
      assert.equal(result1.logs[2].args.currentHour, 21);
      assert.equal(result1.logs[2].args.riseAmountBurnt, 3);
      assert.equal(result1.logs[2].args.change, 29821);
    });

    it('should not be possible to doRise if current block is empty', async () => {
      await uriseToken.mint(ANYBODY, 10000);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.switchToStable(9000, ANYBODY, {from: ANYBODY});

      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);

      await uriseToken.setCurrentTime(1000000000);
      await assertReverts(uriseToken.doRise());

      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);
      assert.equal((await uriseToken.lastCalledHour()).toString(), 0);
    });

    it('should not be possible to doRise second time in the same hour', async () => {
      await uriseToken.mint(ANYBODY, 10000);

      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }
      await uriseToken.switchToStable(9000, ANYBODY, {from: ANYBODY});

      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);

      assert.equal((await uriseToken.doRise.call()), true);
      const result = await uriseToken.doRise();

      assert.equal((await uriseToken.quarantineBalance()).toString(), 8997);
      assert.equal((await uriseToken.lastCalledHour()).toString(), 20);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoRise');
      assert.equal(result.logs[2].args.currentHour, 20);
      assert.equal(result.logs[2].args.riseAmountBurnt, 3);
      assert.equal(result.logs[2].args.change, 29829);

      await assertReverts(uriseToken.doRise());

      assert.equal((await uriseToken.quarantineBalance()).toString(), 8997);
      assert.equal((await uriseToken.lastCalledHour()).toString(), 20);
    });
  });

  describe('doCreateBlock()', async () => {
    beforeEach('set up stable contract', async () => {
      stableToken = await StableToken.new(OWNER, OWNER);
      uriseToken = await Urise.new(OWNER, OWNER, stableToken.address);
      await stableToken.setUriseContract(uriseToken.address);
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
    });

    it('should be possible to doCreateBlock first block from owner', async () => {
      assert.equal((await uriseToken.getBlockData(1))._risePrice, 0);

      await uriseToken.doCreateBlock(672);

      assert.equal((await uriseToken.getBlockData(1))._risePrice, 10003);
    });

    it('should be possible to doCreateBlock first block from admin', async () => {
      assert.equal((await uriseToken.getBlockData(1))._risePrice, 0);

      await uriseToken.appointAdmin(SOMEBODY);
      await uriseToken.doCreateBlock(672, {from: SOMEBODY});

      assert.equal((await uriseToken.getBlockData(1))._risePrice, 10003);
    });

    it('should be possible to doCreateBlock not a first block from admin', async () => {
      for (let i = 0; i < 28; i++) {
        await uriseToken.doCreateBlock(672);
      }

      assert.equal((await uriseToken.getBlockData(29))._risePrice, 0);

      await uriseToken.appointAdmin(SOMEBODY);
      await uriseToken.doCreateBlock(672, {from: SOMEBODY});

      assert.equal((await uriseToken.getBlockData(29))._risePrice, 10087);
    });

    it('should not be possible to doCreateBlock from not owner or admin', async () => {
      assert.equal((await uriseToken.getBlockData(1))._risePrice, 0);

      await assertReverts(uriseToken.doCreateBlock(672, {from: ANYBODY}));

      assert.equal((await uriseToken.getBlockData(1))._risePrice, 0);
    });
  });

  describe('withdrawLostTokens()', async () => {
    beforeEach('set up stable contract', async () => {
      stableToken = await StableToken.new(OWNER, OWNER);
      uriseToken = await Urise.new(OWNER, OWNER, stableToken.address);
      await stableToken.setUriseContract(uriseToken.address);
      await uriseToken.updateFutureGrowthRate(1001, [39050, 37703, 36446, 35270]);
    });

    it('should be possible to withdraw lost tokens by owner', async () => {
      await uriseToken.mint(SOMEBODY, 10000);
      await uriseToken.doCreateBlock(672);
      await uriseToken.switchToStable(9000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 9000);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);

      await uriseToken.transfer(uriseToken.address, 100, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 9100);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), 100000000000000000);

      await uriseToken.withdrawLostTokens(100);

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), 100000000000000100);
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 9000);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);
    });

    it('should be possible to withdraw lost tokens by owner if quarantine balance is 0', async () => {
      await uriseToken.mint(SOMEBODY, 100);
      await uriseToken.doCreateBlock(672);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 0);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);

      await uriseToken.transfer(uriseToken.address, 100, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 100);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), 100000000000000000);

      await uriseToken.withdrawLostTokens(100);

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), 100000000000000100);
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 0);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);
    });

    it('should not be possible to withdraw more lost tokens than possible by owner', async () => {
      await uriseToken.mint(SOMEBODY, 10000);
      await uriseToken.doCreateBlock(672);
      await uriseToken.switchToStable(9000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 9000);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);

      await uriseToken.transfer(uriseToken.address, 100, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 9100);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), 100000000000000000);

      await assertReverts(uriseToken.withdrawLostTokens(101));

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), 100000000000000000);
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 9100);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);
    });

    it('should not be possible to withdraw more lost tokens than possible by owner if quarantine balance is 0', async () => {
      await uriseToken.mint(SOMEBODY, 100);
      await uriseToken.doCreateBlock(672);

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 0);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);

      await uriseToken.transfer(uriseToken.address, 100, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 100);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), 100000000000000000);

      await assertReverts(uriseToken.withdrawLostTokens(101));

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), 100000000000000000);
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 100);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 0);
    });

    it('should not be possible to withdraw lost tokens by not owner', async () => {
      await uriseToken.mint(SOMEBODY, 10000);
      await uriseToken.doCreateBlock(672);
      await uriseToken.switchToStable(9000, SOMEBODY, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 9000);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);

      await uriseToken.transfer(uriseToken.address, 100, {from: SOMEBODY});

      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 9100);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), 100000000000000000);

      await assertReverts(uriseToken.withdrawLostTokens(100, {from: ANYBODY}));

      assert.equal((await uriseToken.balanceOf(OWNER)).toString(), 100000000000000000);
      assert.equal((await uriseToken.balanceOf(uriseToken.address)).toString(), 9100);
      assert.equal((await uriseToken.quarantineBalance()).toString(), 9000);
    });
  });
});
