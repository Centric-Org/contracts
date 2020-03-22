const TRC20Detailed = artifacts.require('TRC20Detailed');

contract('TRC20Detailed', async () => {
  beforeEach('set', async () => {
    this.token = await TRC20Detailed.new('tokenA', 'TA', '8');
  });

  describe('name', async () => {
    it('returns name', async () => {
      assert.equal(await this.token.name(), 'tokenA');
    });
  });

  describe('symbol', async () => {
    it('returns symbol', async () => {
      assert.equal(await this.token.symbol(), 'TA');
    });
  });

  describe('decimals', async () => {
    it('returns decimals', async () => {
      assert.equal(await this.token.decimals(), 8);
    });
  });
});
