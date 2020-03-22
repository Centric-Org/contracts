const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const {
  shouldBehaveLikeTRC20,
  shouldBehaveLikeTRC20Transfer,
  shouldBehaveLikeTRC20Approve,
} = require('./TRC20.behavior');

const TRC20 = artifacts.require('TRC20Mock');

contract('TRC20', async accounts => {
  const [initialHolder, recipient, anotherAccount] = accounts;

  const initialSupply = 100;

  beforeEach('set', async () => {
    this.token = await TRC20.new(initialHolder, initialSupply);
  });

  shouldBehaveLikeTRC20.bind(this)(initialSupply, initialHolder, recipient, anotherAccount);

  describe('decrease allowance', async () => {
    describe('when the spender is not the zero address', async () => {
      const spender = recipient;

      function shouldDecreaseApproval(amount) {
        describe('when there was no approved amount before', async () => {
          it('reverts', async () => {
            await expectRevert(
              this.token.decreaseAllowance(spender, amount, { from: initialHolder }),
              'SUB_ERROR',
            );
          });
        });

        describe('when the spender had an approved amount', async () => {
          const approvedAmount = amount;

          beforeEach(async () => {
            ({ logs: this.logs } = await this.token.approve(spender, approvedAmount, {
              from: initialHolder,
            }));
          });

          it('emits an approval event', async () => {
            const { logs } = await this.token.decreaseAllowance(spender, approvedAmount, {
              from: initialHolder,
            });

            expectEvent.inLogs(logs, 'Approval', {
              owner: initialHolder,
              spender: spender,
              value: '0',
            });
          });

          it('decreases the spender allowance subtracting the requested amount', async () => {
            await this.token.decreaseAllowance(spender, approvedAmount - 1, {
              from: initialHolder,
            });

            assert.equal(await this.token.allowance(initialHolder, spender), 1);
          });

          it('sets the allowance to zero when all allowance is removed', async () => {
            await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });
            assert.equal(await this.token.allowance(initialHolder, spender), '0');
          });

          it('reverts when more than the full allowance is removed', async () => {
            await expectRevert(
              this.token.decreaseAllowance(spender, approvedAmount + 1, {
                from: initialHolder,
              }),
              'SUB_ERROR',
            );
          });
        });
      }

      describe('when the sender has enough balance', async () => {
        const amount = initialSupply;

        shouldDecreaseApproval.bind(this)(amount);
      });

      describe('when the sender does not have enough balance', async () => {
        const amount = initialSupply - 1;

        shouldDecreaseApproval.bind(this)(amount);
      });
    });

    describe('when the spender is the zero address', async () => {
      const amount = initialSupply;
      const spender = ZERO_ADDRESS;

      it('reverts', async () => {
        await expectRevert(
          this.token.decreaseAllowance(spender, amount, { from: initialHolder }),
          'spender cannot be address(0)',
        );
      });
    });
  });

  describe('increase allowance', async () => {
    const amount = initialSupply;

    describe('when the spender is not the zero address', async () => {
      const spender = recipient;

      describe('when the sender has enough balance', async () => {
        it('emits an approval event', async () => {
          const { logs } = await this.token.increaseAllowance(spender, amount, {
            from: initialHolder,
          });

          expectEvent.inLogs(logs, 'Approval', {
            owner: initialHolder,
            spender: spender,
            value: amount.toString(),
          });
        });

        describe('when there was no approved amount before', async () => {
          it('approves the requested amount', async () => {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            assert.equal(await this.token.allowance(initialHolder, spender), amount);
          });
        });

        describe('when the spender had an approved amount', async () => {
          beforeEach(async () => {
            await this.token.approve(spender, 1, { from: initialHolder });
          });

          it('increases the spender allowance adding the requested amount', async () => {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            assert.equal(await this.token.allowance(initialHolder, spender), amount + 1);
          });
        });
      });

      describe('when the sender does not have enough balance', async () => {
        const amount = initialSupply - 1;

        it('emits an approval event', async () => {
          const { logs } = await this.token.increaseAllowance(spender, amount, {
            from: initialHolder,
          });

          expectEvent.inLogs(logs, 'Approval', {
            owner: initialHolder,
            spender: spender,
            value: amount.toString(),
          });
        });

        describe('when there was no approved amount before', async () => {
          it('approves the requested amount', async () => {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            assert.equal(await this.token.allowance(initialHolder, spender), amount);
          });
        });

        describe('when the spender had an approved amount', async () => {
          beforeEach(async () => {
            await this.token.approve(spender, 1, { from: initialHolder });
          });

          it('increases the spender allowance adding the requested amount', async () => {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            assert.equal(await this.token.allowance(initialHolder, spender), amount + 1);
          });
        });
      });
    });

    describe('when the spender is the zero address', async () => {
      const spender = ZERO_ADDRESS;

      it('reverts', async () => {
        await expectRevert(
          this.token.increaseAllowance(spender, amount, { from: initialHolder }),
          'spender cannot be address(0)',
        );
      });
    });
  });

  describe('_mint', async () => {
    const amount = 50;
    it('rejects a null account', async () => {
      await expectRevert(this.token.mint(ZERO_ADDRESS, amount), 'account cannot be address(0)');
    });

    describe('for a non zero account', async () => {
      beforeEach('minting', async () => {
        const { logs } = await this.token.mint(recipient, amount);
        this.logs = logs;
      });

      it('increments totalSupply', async () => {
        const expectedSupply = initialSupply + amount;
        assert.equal(await this.token.totalSupply(), expectedSupply);
      });

      it('increments recipient balance', async () => {
        assert.equal(await this.token.balanceOf(recipient), amount);
      });

      it('emits Transfer event', async () => {
        const event = expectEvent.inLogs(this.logs, 'Transfer', {
          from: ZERO_ADDRESS,
          to: recipient,
        });

        assert.equal(event.args.value, amount);
      });
    });
  });

  describe('_burn', async () => {
    it('rejects a null account', async () => {
      await expectRevert(this.token.burn(ZERO_ADDRESS, 1), 'account cannot be address(0)');
    });

    describe('for a non zero account', async () => {
      it('rejects burning more than balance', async () => {
        await expectRevert(this.token.burn(initialHolder, initialSupply + 1), 'SUB_ERROR');
      });

      const describeBurn = async (description, amount) => {
        describe(description, async () => {
          beforeEach('burning', async () => {
            const { logs } = await this.token.burn(initialHolder, amount);
            this.logs = logs;
          });

          it('decrements totalSupply', async () => {
            const expectedSupply = initialSupply - amount;
            assert.equal(await this.token.totalSupply(), expectedSupply);
          });

          it('decrements initialHolder balance', async () => {
            const expectedBalance = initialSupply - amount;
            assert.equal(await this.token.balanceOf(initialHolder), expectedBalance);
          });

          it('emits Transfer event', async () => {
            const event = expectEvent.inLogs(this.logs, 'Transfer', {
              from: initialHolder,
              to: ZERO_ADDRESS,
            });

            assert.equal(event.args.value, amount);
          });
        });
      };

      describeBurn('for entire balance', initialSupply);
      describeBurn('for less amount than balance', initialSupply - 1);
    });
  });

  describe('_burnFrom', async () => {
    it('rejects not apporved amount', async () => {
      await expectRevert(
        this.token.burnFrom(initialHolder, 1, { from: anotherAccount }),
        'SUB_ERROR',
      );
    });

    it('rejects a null account', async () => {
      await expectRevert(
        this.token.approve(anotherAccount, 1, { from: ZERO_ADDRESS }),
        'sender account not recognized',
      );
      await expectRevert(
        this.token.burnFrom(ZERO_ADDRESS, 1, { from: anotherAccount }),
        'SUB_ERROR',
      );
    });

    it('rejects burning more than balance', async () => {
      await this.token.approve(anotherAccount, initialSupply + 1);
      await expectRevert(
        this.token.burnFrom(initialHolder, initialSupply + 1, { from: anotherAccount }),
        'SUB_ERROR',
      );
    });

    it('burning', async () => {
      await this.token.approve(anotherAccount, 1);
      const { logs } = await this.token.burnFrom(initialHolder, 1, { from: anotherAccount });

      expectEvent.inLogs(logs, 'Transfer', {
        from: initialHolder,
        to: ZERO_ADDRESS,
        value: '1',
      });

      assert.equal(await this.token.balanceOf(initialHolder), initialSupply - 1);
    });
  });

  describe('_transfer', async () => {
    shouldBehaveLikeTRC20Transfer.bind(this)(
      initialHolder,
      recipient,
      initialSupply,
      async (from, to, amount) => {
        return this.token.transferInternal(from, to, amount);
      },
    );

    describe('when the sender is the zero address', async () => {
      it('reverts', async () => {
        await expectRevert(
          this.token.transferInternal(ZERO_ADDRESS, recipient, initialSupply),
          'from cannot be address(0)',
        );
      });
    });
  });

  describe('approve', async () => {
    shouldBehaveLikeTRC20Approve.bind(this)(
      initialHolder,
      recipient,
      initialSupply,
      async (owner, spender, amount) => {
        return this.token.approve(spender, amount, { from: owner });
      },
    );
  });
});
