const DateLib = artifacts.require('DateLibMock.sol');

describe('DateLib', async () => {
  let dLib;

  before('setup contract', async () => {
    dLib = await DateLib.new();
  });

  // describe('getDaysInMonth::', function() {
  //   it('Should successfully getDaysInMonth', async () => {
  //     assert.equal(await dLib.getDaysInMonth(1, 2020), 31);
  //     assert.equal(await dLib.getDaysInMonth(2, 2020), 29);
  //   });
  // });

  describe('getHoursInMonth::', function() {
    it('Should successfully getHoursInMonth', async () => {
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(2000, 2, 15))), 31 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(1970, 0, 1, 1))), 31 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(1970, 0, 1, 2))), 31 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(1970, 1))), 28 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(1970, 3))), 30 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(2000, 1))), 29 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(2020, 1))), 29 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(2020, 11, 31))), 31 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(2021, 11, 31))), 31 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(2021, 1))), 28 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(2022, 1))), 28 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(2100, 1))), 28 * 24);
    });
  });
});
