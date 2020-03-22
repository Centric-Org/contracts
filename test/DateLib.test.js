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
      assert.equal(await dLib.getHoursInMonth(1584257000000), 31 * 24);
      assert.equal(await dLib.getHoursInMonth(1 * 60 * 60 * 1000), 31 * 24);
      assert.equal(await dLib.getHoursInMonth(2 * 60 * 60 * 1000), 31 * 24);
      assert.equal(await dLib.getHoursInMonth(31 * 24 * 60 * 60 * 1000), 28 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(2020, 1))), 29 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(2021, 1))), 28 * 24);
      assert.equal(Number(await dLib.getHoursInMonth(Date.UTC(2022, 1))), 28 * 24);
    });
  });
});
