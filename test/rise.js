const Rise = artifacts.require('RiseMock');
const Cash = artifacts.require('Cash');
const Reverter = require('./helpers/reverter');
const { assertReverts } = require('./helpers/assertThrows');

contract('Rise', async accounts => {
  const reverter = new Reverter(web3);

  let riseToken;
  let cashToken;

  const OWNER = accounts[0];
  const SOMEBODY = accounts[1];
  const ANYBODY = accounts[2];

  before('setup rise contract', async () => {
    riseToken = await Rise.new(OWNER, OWNER);
    await riseToken.setCurrentTime(3600);
  });

  beforeEach('setup', reverter.snapshot);

  afterEach('revert', reverter.revert);

  describe('creation', async () => {
    it('should set up all correctly while creation', async () => {
      const riseTokenLocal = await Rise.new(OWNER, ANYBODY);

      assert.equal((await riseTokenLocal.balanceOf(OWNER)).toString(), '100000000000000000');
      assert.equal(await riseTokenLocal.cashContract(), ANYBODY);
      assert.equal((await riseTokenLocal.lastBlockNumber()).toString(), '0');
    });
  });

  describe('getter functions', async () => {
    it('getCurrentPrice() should return a valid value', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      await riseToken.createBlockMock(672, 2);
      await riseToken.setCurrentTime(7201);

      assert.equal((await riseToken.getCurrentPrice()).toString(), 888914843);
    });

    it('getPrice() should return a valid value', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      await riseToken.createBlockMock(672, 2);

      assert.equal((await riseToken.getPrice(2)).toString(), 888914843);
    });

    it('getCurrentTime() should return a valid value', async () => {
      assert.equal((await riseToken.getCurrentTime.call()).toString(), 3600);
    });
  });

  describe('updateFutureGrowthRate()', async () => {
    it('should be possible to update with valid arguments from owner', async () => {
      assert.isTrue(await riseToken.updateFutureGrowthRate.call(101, [1495449, 1443881, 1395751, 1350727]));

      const result = await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'FutureGrowthRateUpdated');
      assert.equal(result.logs[0].args._oldValue, 0);
      assert.equal(result.logs[0].args._newValue, 101);
      assert.equal(result.logs[0].args._newPriceFactors[0].toNumber(), 1495449);
      assert.equal(result.logs[0].args._newPriceFactors[1].toNumber(), 1443881);
      assert.equal(result.logs[0].args._newPriceFactors[2].toNumber(), 1395751);
      assert.equal(result.logs[0].args._newPriceFactors[3].toNumber(), 1350727);
    });

    it('should be possible to update with current rate from owner', async () => {
      assert.isTrue(await riseToken.updateFutureGrowthRate.call(101, [1495449, 1443881, 1395751, 1350727]));

      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      const result = await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'FutureGrowthRateUpdated');
      assert.equal(result.logs[0].args._oldValue, 101);
      assert.equal(result.logs[0].args._newValue, 101);
      assert.equal(result.logs[0].args._newPriceFactors[0].toNumber(), 1495449);
      assert.equal(result.logs[0].args._newPriceFactors[1].toNumber(), 1443881);
      assert.equal(result.logs[0].args._newPriceFactors[2].toNumber(), 1395751);
      assert.equal(result.logs[0].args._newPriceFactors[3].toNumber(), 1350727);
    });

    it('should not be possible to update with zero rate from owner', async () => {
      assert.isTrue(await riseToken.updateFutureGrowthRate.call(101, [1495449, 1443881, 1395751, 1350727]));

      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      await assertReverts(riseToken.updateFutureGrowthRate(0, [1495449, 1443881, 1395751, 1350727]));

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);
    });

    it('should not be possible to update with rate greater than base from owner', async () => {
      assert.isTrue(await riseToken.updateFutureGrowthRate.call(101, [1495449, 1443881, 1395751, 1350727]));

      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      await assertReverts(riseToken.updateFutureGrowthRate(10001, [1495449, 1443881, 1395751, 1350727]));

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);
    });

    it('should not be possible to update with at least one 0 value in priceFactors from owner', async () => {
      assert.isTrue(await riseToken.updateFutureGrowthRate.call(101, [1495449, 1443881, 1395751, 1350727]));

      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      await assertReverts(riseToken.updateFutureGrowthRate(201, [0, 37703, 36446, 35270]));

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);
    });

    it('should not be possible to update with at least one 0 value in priceFactors from owner', async () => {
      assert.isTrue(await riseToken.updateFutureGrowthRate.call(101, [1495449, 1443881, 1395751, 1350727]));

      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      await assertReverts(riseToken.updateFutureGrowthRate(201, [39050, 37703, 0, 35270]));

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);
    });

    it('should not be possible to update with all 0 values in priceFactors from owner', async () => {
      assert.isTrue(await riseToken.updateFutureGrowthRate.call(101, [1495449, 1443881, 1395751, 1350727]));

      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      await assertReverts(riseToken.updateFutureGrowthRate(201, [0, 0, 0, 0]));

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);
    });

    it('should not be possible to update with value less than next one in priceFactors case 1 from owner', async () => {
      assert.isTrue(await riseToken.updateFutureGrowthRate.call(101, [1495449, 1443881, 1395751, 1350727]));

      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      await assertReverts(riseToken.updateFutureGrowthRate(201, [10000, 37703, 36446, 35270]));

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);
    });

    it('should not be possible to update with value less than next one in priceFactors case 2 from owner', async () => {
      assert.isTrue(await riseToken.updateFutureGrowthRate.call(101, [1495449, 1443881, 1395751, 1350727]));

      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      await assertReverts(riseToken.updateFutureGrowthRate(201, [39050, 10000, 36446, 35270]));

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);
    });

    it('should not be possible to update with value less than next one in priceFactors case 3 from owner', async () => {
      assert.isTrue(await riseToken.updateFutureGrowthRate.call(101, [1495449, 1443881, 1395751, 1350727]));

      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      await assertReverts(riseToken.updateFutureGrowthRate(201, [39050, 37703, 10000, 35270]));

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);
    });

    it('should not be possible to update with valid values not from owner', async () => {
      assert.isTrue(await riseToken.updateFutureGrowthRate.call(101, [1495449, 1443881, 1395751, 1350727]));

      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);

      await assertReverts(
        riseToken.updateFutureGrowthRate(201, [1495449, 1443881, 1395751, 1350727], { from: ANYBODY })
      );

      assert.equal((await riseToken.futureGrowthRate()).toString(), '101');
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 0)).toNumber(), 1495449);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 1)).toNumber(), 1443881);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 2)).toNumber(), 1395751);
      assert.equal((await riseToken.futureGrowthRateToPriceFactors(101, 3)).toNumber(), 1350727);
    });
  });

  describe('createBlock()', async () => {
    it('should be possible to create first block with valid future growth rate values and price factors case 1', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      const result = await riseToken.createBlockMock(672, 2);

      assert.equal((await riseToken.hoursToBlock(2)).risePrice.toString(), '888914843');
      assert.equal((await riseToken.hoursToBlock(2)).growthRate.toString(), '101');
      assert.equal((await riseToken.hoursToBlock(2)).change.toString(), '1495');
      assert.equal((await riseToken.hoursToBlock(2)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '888914843');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '1495');
      assert.equal(result.logs[0].args.created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 2', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      const result = await riseToken.createBlockMock(696, 2);

      assert.equal((await riseToken.hoursToBlock(2)).risePrice.toString(), '888914385');
      assert.equal((await riseToken.hoursToBlock(2)).growthRate.toString(), '101');
      assert.equal((await riseToken.hoursToBlock(2)).change.toString(), '1444');
      assert.equal((await riseToken.hoursToBlock(2)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '888914385');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '1444');
      assert.equal(result.logs[0].args.created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 3', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      const result = await riseToken.createBlockMock(720, 2);

      assert.equal((await riseToken.hoursToBlock(2)).risePrice.toString(), '888913957');
      assert.equal((await riseToken.hoursToBlock(2)).growthRate.toString(), '101');
      assert.equal((await riseToken.hoursToBlock(2)).change.toString(), '1396');
      assert.equal((await riseToken.hoursToBlock(2)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '888913957');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '1396');
      assert.equal(result.logs[0].args.created.toString(), '1');
    });

    it('should be possible to create first block with valid future growth rate values and price factors case 4', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      const result = await riseToken.createBlockMock(744, 2);

      assert.equal((await riseToken.hoursToBlock(2)).risePrice.toString(), '888913557');
      assert.equal((await riseToken.hoursToBlock(2)).growthRate.toString(), '101');
      assert.equal((await riseToken.hoursToBlock(2)).change.toString(), '1351');
      assert.equal((await riseToken.hoursToBlock(2)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '888913557');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '1351');
      assert.equal(result.logs[0].args.created.toString(), '1');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 1', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      const result = await riseToken.createBlockMock(672, 2);

      assert.equal((await riseToken.hoursToBlock(2)).risePrice.toString(), '888914843');
      assert.equal((await riseToken.hoursToBlock(2)).growthRate.toString(), '101');
      assert.equal((await riseToken.hoursToBlock(2)).change.toString(), '1495');
      assert.equal((await riseToken.hoursToBlock(2)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '888914843');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '1495');
      assert.equal(result.logs[0].args.created.toString(), '1');

      await riseToken.setCurrentTime(7201);

      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);

      const result1 = await riseToken.createBlockMock(672, 3);

      assert.equal((await riseToken.hoursToBlock(3)).risePrice.toString(), '888928137');
      assert.equal((await riseToken.hoursToBlock(3)).growthRate.toString(), '1001');
      assert.equal((await riseToken.hoursToBlock(3)).change.toString(), '1496');
      assert.equal((await riseToken.hoursToBlock(3)).created.toString(), '2');

      assert.equal(result1.logs[0].args.risePrice.toString(), '888928137');
      assert.equal(result1.logs[0].args.futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args.change.toString(), '1496');
      assert.equal(result1.logs[0].args.created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 2', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      const result = await riseToken.createBlockMock(672, 2);

      assert.equal((await riseToken.hoursToBlock(2)).risePrice.toString(), '888914843');
      assert.equal((await riseToken.hoursToBlock(2)).growthRate.toString(), '101');
      assert.equal((await riseToken.hoursToBlock(2)).change.toString(), '1495');
      assert.equal((await riseToken.hoursToBlock(2)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '888914843');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '1495');
      assert.equal(result.logs[0].args.created.toString(), '1');

      await riseToken.setCurrentTime(7201);

      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);

      const result1 = await riseToken.createBlockMock(696, 3);

      assert.equal((await riseToken.hoursToBlock(3)).risePrice.toString(), '888927678');
      assert.equal((await riseToken.hoursToBlock(3)).growthRate.toString(), '1001');
      assert.equal((await riseToken.hoursToBlock(3)).change.toString(), '1444');
      assert.equal((await riseToken.hoursToBlock(3)).created.toString(), '2');

      assert.equal(result1.logs[0].args.risePrice.toString(), '888927678');
      assert.equal(result1.logs[0].args.futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args.change.toString(), '1444');
      assert.equal(result1.logs[0].args.created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 3', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      const result = await riseToken.createBlockMock(672, 2);

      assert.equal((await riseToken.hoursToBlock(2)).risePrice.toString(), '888914843');
      assert.equal((await riseToken.hoursToBlock(2)).growthRate.toString(), '101');
      assert.equal((await riseToken.hoursToBlock(2)).change.toString(), '1495');
      assert.equal((await riseToken.hoursToBlock(2)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '888914843');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '1495');
      assert.equal(result.logs[0].args.created.toString(), '1');

      await riseToken.setCurrentTime(7201);

      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);

      const result1 = await riseToken.createBlockMock(720, 3);

      assert.equal((await riseToken.hoursToBlock(3)).risePrice.toString(), '888927250');
      assert.equal((await riseToken.hoursToBlock(3)).growthRate.toString(), '1001');
      assert.equal((await riseToken.hoursToBlock(3)).change.toString(), '1396');
      assert.equal((await riseToken.hoursToBlock(3)).created.toString(), '2');

      assert.equal(result1.logs[0].args.risePrice.toString(), '888927250');
      assert.equal(result1.logs[0].args.futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args.change.toString(), '1396');
      assert.equal(result1.logs[0].args.created.toString(), '2');
    });

    it('should be possible to create second block with valid future growth rate values and price factors case 4', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      const result = await riseToken.createBlockMock(744, 2);

      assert.equal((await riseToken.hoursToBlock(2)).risePrice.toString(), '888913557');
      assert.equal((await riseToken.hoursToBlock(2)).growthRate.toString(), '101');
      assert.equal((await riseToken.hoursToBlock(2)).change.toString(), '1351');
      assert.equal((await riseToken.hoursToBlock(2)).created.toString(), '1');

      assert.equal(result.logs[0].args.risePrice.toString(), '888913557');
      assert.equal(result.logs[0].args.futureGrowthRate.toString(), '101');
      assert.equal(result.logs[0].args.change.toString(), '1351');
      assert.equal(result.logs[0].args.created.toString(), '1');

      await riseToken.setCurrentTime(7201);

      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);

      const result1 = await riseToken.createBlockMock(744, 3);

      assert.equal((await riseToken.hoursToBlock(3)).risePrice.toString(), '888925564');
      assert.equal((await riseToken.hoursToBlock(3)).growthRate.toString(), '1001');
      assert.equal((await riseToken.hoursToBlock(3)).change.toString(), '1351');
      assert.equal((await riseToken.hoursToBlock(3)).created.toString(), '2');

      assert.equal(result1.logs[0].args.risePrice.toString(), '888925564');
      assert.equal(result1.logs[0].args.futureGrowthRate.toString(), '1001');
      assert.equal(result1.logs[0].args.change.toString(), '1351');
      assert.equal(result1.logs[0].args.created.toString(), '2');
    });

    it('should not be possible to create block with wrong monthBlock', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      await assertReverts(riseToken.createBlockMock(673, 2));

      assert.equal((await riseToken.hoursToBlock(1)).risePrice.toString(), '0');
      assert.equal((await riseToken.hoursToBlock(1)).growthRate.toString(), '0');
      assert.equal((await riseToken.hoursToBlock(1)).change.toString(), '0');
      assert.equal((await riseToken.hoursToBlock(1)).created.toString(), '0');
    });

    it('should not be possible to create block with wrong expectedBlockNumber', async () => {
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);

      await riseToken.createBlockMock(744, 2);
      await assertReverts(riseToken.createBlockMock(744, 4));

      assert.equal((await riseToken.hoursToBlock(1)).risePrice.toString(), '0');
      assert.equal((await riseToken.hoursToBlock(1)).growthRate.toString(), '0');
      assert.equal((await riseToken.hoursToBlock(1)).change.toString(), '0');
      assert.equal((await riseToken.hoursToBlock(1)).created.toString(), '0');
    });
  });

  describe('convertToCash()', async () => {
    beforeEach('set up stable contract', async () => {
      cashToken = await Cash.new(OWNER);
      riseToken = await Rise.new(OWNER, cashToken.address);
      await cashToken.setRiseContract(riseToken.address);
    });

    it('should be possible to convertToCash with suficient balance case 1', async () => {
      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);

      await riseToken.mint(SOMEBODY, 1000);

      await riseToken.doCreateBlock(672, 2);
      await riseToken.setCurrentTime(7200);
      await riseToken.doBalance();

      const result = await riseToken.convertToCash(900, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 900);
      assert.equal((await riseToken.quarantineBalance()).toString(), 900);
      assert.equal((await cashToken.balanceOf(SOMEBODY)).toString(), 8000);
      assert.equal((await riseToken.balanceOf(SOMEBODY)).toString(), 100);

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[3].event, 'ConvertToCash');
      assert.equal(result.logs[3].args.converter, SOMEBODY);
      assert.equal(result.logs[3].args.riseAmountSent, 900);
      assert.equal(result.logs[3].args.cashAmountReceived, 8000);
      assert.equal(result.logs[2].event, 'MintCash');
      assert.equal(result.logs[2].args.receiver, SOMEBODY);
      assert.equal(result.logs[2].args.amount, 8000);
    });

    it('should be possible to convertToCash with suficient balance case 2', async () => {
      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);

      await riseToken.mint(SOMEBODY, 1000);

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 2);
      }
      await riseToken.setCurrentTime(72001);
      await riseToken.doBalance();

      const result = await riseToken.convertToCash(900, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 900);
      assert.equal((await riseToken.quarantineBalance()).toString(), 900);
      assert.equal((await cashToken.balanceOf(SOMEBODY)).toString(), 8002);
      assert.equal((await riseToken.balanceOf(SOMEBODY)).toString(), 100);

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[3].event, 'ConvertToCash');
      assert.equal(result.logs[3].args.converter, SOMEBODY);
      assert.equal(result.logs[3].args.riseAmountSent, 900);
      assert.equal(result.logs[3].args.cashAmountReceived, 8002);
      assert.equal(result.logs[2].event, 'MintCash');
      assert.equal(result.logs[2].args.receiver, SOMEBODY);
      assert.equal(result.logs[2].args.amount, 8002);
    });

    it('should be possible to convertToCash with suficient balance case 3', async () => {
      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);

      await riseToken.mint(SOMEBODY, 1000);

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 2);
      }
      await riseToken.setCurrentTime(72001);
      await riseToken.doBalance();

      const result = await riseToken.convertToCash(0, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 0);
      assert.equal((await riseToken.quarantineBalance()).toString(), 0);
      assert.equal((await cashToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await riseToken.balanceOf(SOMEBODY)).toString(), 1000);

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[3].event, 'ConvertToCash');
      assert.equal(result.logs[3].args.converter, SOMEBODY);
      assert.equal(result.logs[3].args.riseAmountSent, 0);
      assert.equal(result.logs[3].args.cashAmountReceived, 0);
      assert.equal(result.logs[2].event, 'MintCash');
      assert.equal(result.logs[2].args.receiver, SOMEBODY);
      assert.equal(result.logs[2].args.amount, 0);
    });

    it('should not be possible to convertToCash with insufficient balance', async () => {
      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);

      await riseToken.mint(SOMEBODY, 800);

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 2);
      }
      await riseToken.setCurrentTime(72001);
      await riseToken.doBalance();

      await assertReverts(riseToken.convertToCash(900, { from: SOMEBODY }));

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 0);
      assert.equal((await riseToken.quarantineBalance()).toString(), 0);
      assert.equal((await cashToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await riseToken.balanceOf(SOMEBODY)).toString(), 800);
    });

    it('should not be possible to convertToCash with 0 risePrice', async () => {
      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);

      await riseToken.mint(SOMEBODY, 1000);

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 2);
      }
      await riseToken.setCurrentTime(144001);

      await assertReverts(riseToken.convertToCash(900, { from: SOMEBODY }));

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 0);
      assert.equal((await riseToken.quarantineBalance()).toString(), 0);
      assert.equal((await cashToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await riseToken.balanceOf(SOMEBODY)).toString(), 1000);
    });
  });

  describe('burnQuarantined()', async () => {
    beforeEach('set up stable contract', async () => {
      cashToken = await Cash.new(OWNER);
      riseToken = await Rise.new(OWNER, cashToken.address);
      await cashToken.setRiseContract(riseToken.address);
      await riseToken.updateFutureGrowthRate(101, [1495449, 1443881, 1395751, 1350727]);
      await riseToken.doCreateBlock(672, 2);
      await riseToken.setCurrentTime(7200);
      await riseToken.mint(SOMEBODY, 100000);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance case 1', async () => {
      await riseToken.convertToCash(26000, { from: SOMEBODY });

      for (let i = 0; i < 60; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }
      await riseToken.setCurrentTime(180001);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '26000');
      assert.equal((await riseToken.quarantineBalance()).toString(), '26000');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 18);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '25982');
      assert.equal((await riseToken.quarantineBalance()).toString(), '25982');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 18);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance case 2', async () => {
      await riseToken.convertToCash(50000, { from: SOMEBODY });

      for (let i = 0; i < 21; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }
      await riseToken.setCurrentTime(72001);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '50000');
      assert.equal((await riseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 13);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '49987');
      assert.equal((await riseToken.quarantineBalance()).toString(), '49987');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 13);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance case 3', async () => {
      await riseToken.convertToCash(50000, { from: SOMEBODY });

      for (let i = 0; i < 30; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }
      await riseToken.setCurrentTime(108001);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '50000');
      assert.equal((await riseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 20);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '49980');
      assert.equal((await riseToken.quarantineBalance()).toString(), '49980');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 20);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance case 4', async () => {
      await riseToken.convertToCash(50000, { from: SOMEBODY });

      for (let i = 0; i < 10; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }
      await riseToken.setCurrentTime(36001);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '50000');
      assert.equal((await riseToken.quarantineBalance()).toString(), '50000');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 5);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '49995');
      assert.equal((await riseToken.quarantineBalance()).toString(), '49995');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 5);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance case 5', async () => {
      await riseToken.convertToCash(1800, { from: SOMEBODY });

      for (let i = 0; i < 60; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }
      await riseToken.setCurrentTime(180001);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '1800');
      assert.equal((await riseToken.quarantineBalance()).toString(), '1800');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 1);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '1799');
      assert.equal((await riseToken.quarantineBalance()).toString(), '1799');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 1);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance case 6', async () => {
      await riseToken.mint(SOMEBODY, 5000000000);
      await riseToken.convertToCash(5000000000, { from: SOMEBODY });

      for (let i = 0; i < 20; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }
      await riseToken.setCurrentTime(72001);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '5000000000');
      assert.equal((await riseToken.quarantineBalance()).toString(), '5000000000');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 1345750);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '4998654250');
      assert.equal((await riseToken.quarantineBalance()).toString(), '4998654250');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 1345750);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance case 7', async () => {
      await riseToken.mint(SOMEBODY, 5000000000);
      await riseToken.convertToCash(5000000000, { from: SOMEBODY });

      for (let i = 0; i < 50; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }
      await riseToken.setCurrentTime(184001);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '5000000000');
      assert.equal((await riseToken.quarantineBalance()).toString(), '5000000000');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 3662581);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '4996337419');
      assert.equal((await riseToken.quarantineBalance()).toString(), '4996337419');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 3662581);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance case 8', async () => {
      await riseToken.mint(SOMEBODY, 9000000000000);
      await riseToken.convertToCash(9000000000000, { from: SOMEBODY });

      for (let i = 0; i < 10; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }
      await riseToken.setCurrentTime(18000);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '9000000000000');
      assert.equal((await riseToken.quarantineBalance()).toString(), '9000000000000');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 403775344);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '8999596224656');
      assert.equal((await riseToken.quarantineBalance()).toString(), '8999596224656');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 403775344);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance case 9', async () => {
      await riseToken.mint(SOMEBODY, 140086);
      await riseToken.convertToCash(140086, { from: SOMEBODY });

      for (let i = 0; i < 10; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }
      await riseToken.setCurrentTime(18000);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '140086');
      assert.equal((await riseToken.quarantineBalance()).toString(), '140086');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 6);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '140080');
      assert.equal((await riseToken.quarantineBalance()).toString(), '140080');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 6);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance case 10', async () => {
      await riseToken.mint(SOMEBODY, 140086);
      await riseToken.convertToCash(140086, { from: SOMEBODY });

      for (let i = 0; i < 100; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }
      await riseToken.setCurrentTime(360000);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '140086');
      assert.equal((await riseToken.quarantineBalance()).toString(), '140086');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 205);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '139881');
      assert.equal((await riseToken.quarantineBalance()).toString(), '139881');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 205);
    });

    it('should be possible to burnQuarantined with sufficient wallet balance case 11', async () => {
      await riseToken.convertToCash(1, { from: SOMEBODY });

      for (let i = 0; i < 100; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }
      await riseToken.setCurrentTime(360000);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '1');
      assert.equal((await riseToken.quarantineBalance()).toString(), '1');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 0);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '1');
      assert.equal((await riseToken.quarantineBalance()).toString(), '1');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 0);
    });

    it('should be possible to burnQuarantined with quarantine wallet empty', async () => {
      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '0');
      assert.equal((await riseToken.quarantineBalance()).toString(), '0');

      assert.equal((await riseToken.burnQuarantinedMock.call()).toString(), 0);
      const result = await riseToken.burnQuarantinedMock();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), '0');
      assert.equal((await riseToken.quarantineBalance()).toString(), '0');

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'QuarantineBalanceBurnt');
      assert.equal(result.logs[1].args.amount, 0);
    });
  });

  describe('convertToRise()', async () => {
    beforeEach('set up stable contract', async () => {
      cashToken = await Cash.new(OWNER);
      await riseToken.setCurrentTime(72001);
      riseToken = await Rise.new(OWNER, cashToken.address);
      await cashToken.setRiseContract(riseToken.address);
      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);
    });

    it('should be possible to convertToRise with sufficient funds', async () => {
      await riseToken.mint(SOMEBODY, 2000);

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 2);
      }
      await riseToken.setCurrentTime(72001);

      await riseToken.convertToCash(1000, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(SOMEBODY)).toString(), 1000);
      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 1000);
      assert.equal((await riseToken.quarantineBalance()).toString(), 1000);
      assert.equal((await cashToken.balanceOf(SOMEBODY)).toString(), 8891);

      const result = await riseToken.convertToRise(8891, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(SOMEBODY)).toString(), 1999);
      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 1);
      assert.equal((await riseToken.quarantineBalance()).toString(), 1);
      assert.equal((await cashToken.balanceOf(SOMEBODY)).toString(), 0);

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[1].event, 'BurnCash');
      assert.equal(result.logs[3].event, 'ConvertToRise');
      assert.equal(result.logs[1].args.amountBurnt, 8891);
      assert.equal(result.logs[3].args.converter, SOMEBODY);
      assert.equal(result.logs[3].args.cashAmountSent, 8891);
      assert.equal(result.logs[3].args.riseAmountReceived, 999);
    });

    it('should not be possible to convertToRise with insufficient funds', async () => {
      await riseToken.mint(SOMEBODY, 900);

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 2);
      }
      await riseToken.setCurrentTime(72001);

      await riseToken.convertToCash(900, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 900);
      assert.equal((await riseToken.quarantineBalance()).toString(), 900);
      assert.equal((await cashToken.balanceOf(SOMEBODY)).toString(), 8002);

      await assertReverts(riseToken.convertToRise(8002 + 1, { from: SOMEBODY }));

      assert.equal((await riseToken.balanceOf(SOMEBODY)).toString(), 0);
      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 900);
      assert.equal((await riseToken.quarantineBalance()).toString(), 900);
      assert.equal((await cashToken.balanceOf(SOMEBODY)).toString(), 8002);
    });

    it('should not be possible to convertToRise with no block for current hour', async () => {
      await riseToken.mint(SOMEBODY, 2000);

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 2);
      }
      await riseToken.setCurrentTime(72001);

      await riseToken.convertToCash(1000, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(SOMEBODY)).toString(), 1000);
      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 1000);
      assert.equal((await riseToken.quarantineBalance()).toString(), 1000);
      assert.equal((await cashToken.balanceOf(SOMEBODY)).toString(), 8891);

      await riseToken.setCurrentTime(172001);

      await assertReverts(riseToken.convertToRise(1007, { from: SOMEBODY }));

      assert.equal((await riseToken.balanceOf(SOMEBODY)).toString(), 1000);
      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 1000);
      assert.equal((await riseToken.quarantineBalance()).toString(), 1000);
      assert.equal((await cashToken.balanceOf(SOMEBODY)).toString(), 8891);
    });
  });

  describe('doBalance()', async () => {
    beforeEach('set up stable contract', async () => {
      cashToken = await Cash.new(OWNER);
      riseToken = await Rise.new(OWNER, cashToken.address);
      await cashToken.setRiseContract(riseToken.address);
      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);
      await riseToken.doCreateBlock(672, 2);
      await riseToken.setCurrentTime(7200);
    });

    it('should be possible to doBalance from somebody', async () => {
      await riseToken.mint(ANYBODY, 1000000);

      await riseToken.convertToCash(900000, { from: ANYBODY });

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }

      await riseToken.setCurrentTime(72001);

      assert.equal((await riseToken.quarantineBalance()).toString(), 900000);

      assert.equal(await riseToken.doBalance.call(), true);
      const result = await riseToken.doBalance({ from: SOMEBODY });

      assert.equal((await riseToken.quarantineBalance()).toString(), 899758);
      assert.equal((await riseToken.lastCalledHour()).toString(), 20);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoBalance');
      assert.equal(result.logs[2].args.currentHour, 20);
      assert.equal(result.logs[2].args.riseAmountBurnt, 242);
    });

    it('should be possible to doBalance from owner', async () => {
      await riseToken.mint(ANYBODY, 1000000);

      await riseToken.convertToCash(900000, { from: ANYBODY });

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }

      await riseToken.setCurrentTime(72001);

      assert.equal((await riseToken.quarantineBalance()).toString(), 900000);

      assert.equal(await riseToken.doBalance.call(), true);
      const result = await riseToken.doBalance();

      assert.equal((await riseToken.quarantineBalance()).toString(), 899758);
      assert.equal((await riseToken.lastCalledHour()).toString(), 20);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoBalance');
      assert.equal(result.logs[2].args.currentHour, 20);
      assert.equal(result.logs[2].args.riseAmountBurnt, 242);
    });

    it('should be possible to doBalance if quarantine balance is 0', async () => {
      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }

      await riseToken.setCurrentTime(72001);

      assert.equal((await riseToken.quarantineBalance()).toString(), 0);

      assert.equal(await riseToken.doBalance.call(), true);
      const result = await riseToken.doBalance();

      assert.equal((await riseToken.quarantineBalance()).toString(), 0);
      assert.equal((await riseToken.lastCalledHour()).toString(), 20);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoBalance');
      assert.equal(result.logs[2].args.currentHour, 20);
      assert.equal(result.logs[2].args.riseAmountBurnt, 0);
    });

    it('should be possible to doBalance second time in the next hour', async () => {
      await riseToken.mint(ANYBODY, 1000000);

      await riseToken.convertToCash(900000, { from: ANYBODY });

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }

      await riseToken.setCurrentTime(72001);

      assert.equal((await riseToken.quarantineBalance()).toString(), 900000);

      assert.equal(await riseToken.doBalance.call(), true);
      const result = await riseToken.doBalance();

      assert.equal((await riseToken.quarantineBalance()).toString(), 899758);
      assert.equal((await riseToken.lastCalledHour()).toString(), 20);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoBalance');
      assert.equal(result.logs[2].args.currentHour, 20);
      assert.equal(result.logs[2].args.riseAmountBurnt, 242);

      await riseToken.setCurrentTime(75601);
      assert.equal(await riseToken.doBalance.call(), true);
      const result1 = await riseToken.doBalance();

      assert.equal((await riseToken.quarantineBalance()).toString(), 899745);
      assert.equal((await riseToken.lastCalledHour()).toString(), 21);

      assert.equal(result1.logs.length, 3);
      assert.equal(result1.logs[2].event, 'DoBalance');
      assert.equal(result1.logs[2].args.currentHour, 21);
      assert.equal(result1.logs[2].args.riseAmountBurnt, 13);
    });

    it('should not be possible to doBalance if current block is empty', async () => {
      await riseToken.mint(ANYBODY, 1000000);

      await riseToken.convertToCash(900000, { from: ANYBODY });

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }

      await riseToken.setCurrentTime(72001);

      assert.equal((await riseToken.quarantineBalance()).toString(), 900000);

      await riseToken.setCurrentTime(1000000000);
      await assertReverts(riseToken.doBalance());

      assert.equal((await riseToken.quarantineBalance()).toString(), 900000);
      assert.equal((await riseToken.lastCalledHour()).toString(), 0);
    });

    it('should not be possible to doBalance second time in the same hour', async () => {
      await riseToken.mint(ANYBODY, 1000000);

      await riseToken.convertToCash(900000, { from: ANYBODY });

      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 3);
      }

      await riseToken.setCurrentTime(72001);

      assert.equal((await riseToken.quarantineBalance()).toString(), 900000);

      assert.equal(await riseToken.doBalance.call(), true);
      const result = await riseToken.doBalance({ from: SOMEBODY });

      assert.equal((await riseToken.quarantineBalance()).toString(), 899758);
      assert.equal((await riseToken.lastCalledHour()).toString(), 20);

      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'DoBalance');
      assert.equal(result.logs[2].args.currentHour, 20);
      assert.equal(result.logs[2].args.riseAmountBurnt, 242);

      await assertReverts(riseToken.doBalance());

      assert.equal((await riseToken.quarantineBalance()).toString(), 899758);
      assert.equal((await riseToken.lastCalledHour()).toString(), 20);
    });
  });

  describe('doCreateBlock()', async () => {
    beforeEach('set up stable contract', async () => {
      cashToken = await Cash.new(OWNER);
      riseToken = await Rise.new(OWNER, cashToken.address);
      await cashToken.setRiseContract(riseToken.address);
      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);
    });

    it('should be possible to doCreateBlock first block from owner', async () => {
      assert.equal((await riseToken.getBlockData(2))._risePrice, 0);

      await riseToken.doCreateBlock(672, 2);

      assert.equal((await riseToken.getBlockData(2))._risePrice, 888914843);
    });

    it('should be possible to doCreateBlock first block from admin', async () => {
      assert.equal((await riseToken.getBlockData(2))._risePrice, 0);

      await riseToken.appointAdmin(SOMEBODY);
      await riseToken.doCreateBlock(672, 2, { from: SOMEBODY });

      assert.equal((await riseToken.getBlockData(2))._risePrice, 888914843);
    });

    it('should be possible to doCreateBlock not a first block from admin', async () => {
      for (let i = 0; i < 28; i++) {
        await riseToken.doCreateBlock(672, i + 2);
      }

      assert.equal((await riseToken.getBlockData(30))._risePrice, 0);

      await riseToken.appointAdmin(SOMEBODY);
      await riseToken.doCreateBlock(672, 30, { from: SOMEBODY });

      assert.equal((await riseToken.getBlockData(30))._risePrice, 889287140);
    });

    it('should not be possible to doCreateBlock from not owner or admin', async () => {
      assert.equal((await riseToken.getBlockData(2))._risePrice, 0);

      await assertReverts(riseToken.doCreateBlock(672, 2, { from: ANYBODY }));

      assert.equal((await riseToken.getBlockData(2))._risePrice, 0);
    });
  });

  describe('burnLostTokens()', async () => {
    beforeEach('set up stable contract', async () => {
      cashToken = await Cash.new(OWNER);
      riseToken = await Rise.new(OWNER, cashToken.address);
      await cashToken.setRiseContract(riseToken.address);
      await riseToken.updateFutureGrowthRate(1001, [1495449, 1443881, 1395751, 1350727]);
    });

    it('should be possible to burn lost tokens by owner', async () => {
      await riseToken.mint(SOMEBODY, 10000);
      await riseToken.doCreateBlock(672, 2);
      await riseToken.setCurrentTime(7201);
      await riseToken.convertToCash(9000, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 9000);
      assert.equal((await riseToken.quarantineBalance()).toString(), 9000);

      await riseToken.transfer(riseToken.address, 100, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 9100);
      assert.equal((await riseToken.quarantineBalance()).toString(), 9000);

      await riseToken.burnLostTokens();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 9000);
      assert.equal((await riseToken.quarantineBalance()).toString(), 9000);
    });

    it('should be possible to burn lost tokens by owner if quarantine balance is 0', async () => {
      await riseToken.mint(SOMEBODY, 100);
      await riseToken.doCreateBlock(672, 2);
      await riseToken.setCurrentTime(7201);

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 0);
      assert.equal((await riseToken.quarantineBalance()).toString(), 0);

      await riseToken.transfer(riseToken.address, 100, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 100);
      assert.equal((await riseToken.quarantineBalance()).toString(), 0);

      await riseToken.burnLostTokens();

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 0);
      assert.equal((await riseToken.quarantineBalance()).toString(), 0);
    });

    it('should not be possible to burn lost tokens by not owner', async () => {
      await riseToken.mint(SOMEBODY, 10000);
      await riseToken.doCreateBlock(672, 2);
      await riseToken.setCurrentTime(7201);
      await riseToken.convertToCash(9000, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 9000);
      assert.equal((await riseToken.quarantineBalance()).toString(), 9000);

      await riseToken.transfer(riseToken.address, 100, { from: SOMEBODY });

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 9100);
      assert.equal((await riseToken.quarantineBalance()).toString(), 9000);

      await assertReverts(riseToken.burnLostTokens({ from: ANYBODY }));

      assert.equal((await riseToken.balanceOf(riseToken.address)).toString(), 9100);
      assert.equal((await riseToken.quarantineBalance()).toString(), 9000);
    });
  });
});
