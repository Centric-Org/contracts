const Administrable = artifacts.require('Administrable');
const Reverter = require('./helpers/reverter');
const { assertReverts } = require('./helpers/assertThrows');
const truffleAssert = require('truffle-assertions');

contract('Administrable', async accounts => {
  const reverter = new Reverter(web3);

  let administrable;

  const OWNER = accounts[0];
  const SOMEBODY = accounts[1];
  const ANYBODY = accounts[2];

  before('setup', async () => {
    administrable = await Administrable.new();

    await reverter.snapshot();
  });

  afterEach('revert', reverter.revert);

  describe('creating', async () => {
    it('should initialize and set an owner as admin', async () => {
      const txHash = administrable.transactionHash;
      const result = await truffleAssert.createTransactionResult(administrable, txHash);

      assert.equal(await administrable.owner.call(), OWNER);

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'AdminAppointed');
      assert.equal(result.logs[1].args.admin, OWNER);
    });
  });

  describe('appointAdmin()', async () => {
    it('should be possible to appoint admin by owner', async () => {
      assert.isFalse(await administrable.isAdmin(SOMEBODY));

      const result = await administrable.appointAdmin(SOMEBODY);

      assert.isTrue(await administrable.isAdmin(SOMEBODY));

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'AdminAppointed');
      assert.equal(result.logs[0].args.admin, SOMEBODY);
    });

    it('should be possible to set admin to address whitch is already admin by owner', async () => {
      assert.isFalse(await administrable.isAdmin(SOMEBODY));

      await administrable.appointAdmin(SOMEBODY);
      const result = await administrable.appointAdmin(SOMEBODY);

      assert.isTrue(await administrable.isAdmin(SOMEBODY));

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'AdminAppointed');
      assert.equal(result.logs[0].args.admin, SOMEBODY);
    });

    it('should not be possible to set admin by not owner', async () => {
      assert.isFalse(await administrable.isAdmin(SOMEBODY));

      await assertReverts(administrable.appointAdmin(SOMEBODY, { from: ANYBODY }));

      assert.isFalse(await administrable.isAdmin(SOMEBODY));
    });

    it('should not be possible to set admin by admin but not owner', async () => {
      assert.isFalse(await administrable.isAdmin(SOMEBODY));

      await administrable.appointAdmin(ANYBODY);

      await assertReverts(administrable.appointAdmin(SOMEBODY, { from: ANYBODY }));

      assert.isFalse(await administrable.isAdmin(SOMEBODY));
    });
  });

  describe('dismissAdmin()', async () => {
    it('should be possible to dismiss admin by owner', async () => {
      assert.isFalse(await administrable.isAdmin(SOMEBODY));

      await administrable.appointAdmin(SOMEBODY);

      assert.isTrue(await administrable.isAdmin(SOMEBODY));

      const result = await administrable.dismissAdmin(SOMEBODY);

      assert.isFalse(await administrable.isAdmin(SOMEBODY));

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'AdminDismissed');
      assert.equal(result.logs[0].args.admin, SOMEBODY);
    });

    it('should be possible to dismiss admin from address whitch is not admin by owner', async () => {
      assert.isFalse(await administrable.isAdmin(SOMEBODY));

      const result = await administrable.dismissAdmin(SOMEBODY);

      assert.isFalse(await administrable.isAdmin(SOMEBODY));

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'AdminDismissed');
      assert.equal(result.logs[0].args.admin, SOMEBODY);
    });

    it('should not be possible to dismiss admin by not owner', async () => {
      await administrable.appointAdmin(SOMEBODY);

      await assertReverts(administrable.dismissAdmin(SOMEBODY, { from: ANYBODY }));

      assert.isTrue(await administrable.isAdmin(SOMEBODY));
    });

    it('should not be possible to dismiss admin by admin but not owner', async () => {
      await administrable.appointAdmin(SOMEBODY);

      await administrable.appointAdmin(ANYBODY);

      await assertReverts(administrable.dismissAdmin(SOMEBODY, { from: ANYBODY }));

      assert.isTrue(await administrable.isAdmin(SOMEBODY));
    });
  });
});
