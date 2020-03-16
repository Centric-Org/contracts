const MonthLib = artifacts.require('MonthLibMock.sol');

describe('MonthLib', async () => {
  let mLib;

  before('setup contract', async () => {
    mLib = await MonthLib.new();
  });

  describe('getDaysInMonth::', function() {
    it('Should successfully getDaysInMonth', async () => {
      assert.equal(await mLib.getDaysInMonth(1, 2020), 31);
      assert.equal(await mLib.getDaysInMonth(2, 2020), 29);
    });
  });

  describe('getHoursInMonth::', function() {
    it('Should successfully getHoursInMonth', async () => {
      assert.equal(await mLib.getHoursInMonth(1584257000000), 31 * 24);
      assert.equal(await mLib.getHoursInMonth(1581000000000), 29 * 24);
      assert.equal(await mLib.getHoursInMonth(1 * 60 * 60 * 1000), 31 * 24);
      assert.equal(await mLib.getHoursInMonth(2 * 60 * 60 * 1000), 31 * 24);
      assert.equal(await mLib.getHoursInMonth(31 * 24 * 60 * 60 * 1000), 28 * 24);
    });
  });
});
