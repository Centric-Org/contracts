const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

function shouldBehaveLikeTRC20(initialSupply, initialHolder, recipient, anotherAccount) {
  describe('total supply', async () => {
    it('returns the total amount of tokens', async () => {
      assert.equal(await this.token.totalSupply(), initialSupply);
    });
  });

  describe('total burnt', async () => {
    it('returns the total amount of burnt tokens', async () => {
      await this.token.burn(initialHolder, initialSupply / 2);
      await this.token.burn(initialHolder, initialSupply / 2);
      assert.equal(await this.token.totalBurnt(), initialSupply);
    });
  });

  describe('balanceOf', async () => {
    describe('when the requested account has no tokens', async () => {
      it('returns zero', async () => {
        assert.equal(await this.token.balanceOf(anotherAccount), '0');
      });
    });

    describe('when the requested account has some tokens', async () => {
      it('returns the total amount of tokens', async () => {
        assert.equal(await this.token.balanceOf(initialHolder), initialSupply);
      });
    });
  });

  describe('transfer', async () => {
    shouldBehaveLikeTRC20Transfer.bind(this)(
      initialHolder,
      recipient,
      initialSupply,
      (from, to, value) => {
        return this.token.transfer(to, value, { from });
      },
    );
  });

  describe('transfer from', async () => {
    const spender = recipient;

    describe('when the token owner is not the zero address', async () => {
      const tokenOwner = initialHolder;

      describe('when the recipient is not the zero address', async () => {
        const to = anotherAccount;

        describe('when the spender has enough approved balance', async () => {
          beforeEach(async () => {
            await this.token.approve(spender, initialSupply, { from: initialHolder });
          });

          describe('when the token owner has enough balance', async () => {
            const amount = initialSupply;

            it('transfers the requested amount', async () => {
              await this.token.transferFrom(tokenOwner, to, amount, { from: spender });

              assert.equal(await this.token.balanceOf(tokenOwner), '0');

              assert.equal(await this.token.balanceOf(to), amount);
            });

            it('decreases the spender allowance', async () => {
              await this.token.transferFrom(tokenOwner, to, amount, { from: spender });

              assert.equal(await this.token.allowance(tokenOwner, spender), '0');
            });

            it('emits a transfer event', async () => {
              const { logs } = await this.token.transferFrom(tokenOwner, to, amount, {
                from: spender,
              });

              expectEvent.inLogs(logs, 'Transfer', {
                from: tokenOwner,
                to: to,
                value: amount.toString(),
              });
            });

            it('emits an approval event', async () => {
              const { logs } = await this.token.transferFrom(tokenOwner, to, amount, {
                from: spender,
              });

              expectEvent.inLogs(logs, 'Approval', {
                owner: tokenOwner,
                spender: spender,
                value: await this.token.allowance(tokenOwner, spender),
              });
            });
          });

          describe('when the token owner does not have enough balance', async () => {
            const amount = initialSupply + 1;

            it('reverts', async () => {
              await expectRevert(
                this.token.transferFrom(tokenOwner, to, amount, { from: spender }),
                `SUB_ERROR`,
              );
            });
          });
        });

        describe('when the spender does not have enough approved balance', async () => {
          beforeEach(async () => {
            await this.token.approve(spender, initialSupply - 1, { from: tokenOwner });
          });

          describe('when the token owner has enough balance', async () => {
            const amount = initialSupply;

            it('reverts', async () => {
              await expectRevert(
                this.token.transferFrom(tokenOwner, to, amount, { from: spender }),
                'SUB_ERROR',
              );
            });
          });

          describe('when the token owner does not have enough balance', async () => {
            const amount = initialSupply + 1;

            it('reverts', async () => {
              await expectRevert(
                this.token.transferFrom(tokenOwner, to, amount, { from: spender }),
                'SUB_ERROR',
              );
            });
          });
        });
      });

      describe('when the recipient is the zero address', async () => {
        const amount = initialSupply;
        const to = ZERO_ADDRESS;

        beforeEach(async () => {
          await this.token.approve(spender, amount, { from: tokenOwner });
        });

        it('reverts', async () => {
          await expectRevert(
            this.token.transferFrom(tokenOwner, to, amount, { from: spender }),
            'to cannot be address(0)',
          );
        });
      });
    });

    describe('when the token owner is the zero address', async () => {
      const amount = 0;
      const tokenOwner = ZERO_ADDRESS;
      const to = recipient;

      it('reverts', async () => {
        await expectRevert(
          this.token.transferFrom(tokenOwner, to, amount, { from: spender }),
          'from cannot be address(0)',
        );
      });
    });
  });

  describe('approve', async () => {
    shouldBehaveLikeTRC20Approve.bind(this)(initialHolder, recipient, initialSupply, function(
      owner,
      spender,
      amount,
    ) {
      return this.token.approve(spender, amount, { from: owner });
    });
  });
}

function shouldBehaveLikeTRC20Transfer(from, to, balance, transfer) {
  describe('when the recipient is not the zero address', async () => {
    describe('when the sender does not have enough balance', async () => {
      const amount = balance + 1;

      it('reverts', async () => {
        await expectRevert(transfer.call(this, from, to, amount), 'SUB_ERROR');
      });
    });

    describe('when the sender transfers all balance', async () => {
      const amount = balance;

      it('transfers the requested amount', async () => {
        await transfer.call(this, from, to, amount);

        assert.equal(await this.token.balanceOf(from), 0);

        assert.equal(await this.token.balanceOf(to), amount);
      });

      it('emits a transfer event', async () => {
        const { logs } = await transfer.call(this, from, to, amount);

        expectEvent.inLogs(logs, 'Transfer', {
          from,
          to,
          value: amount.toString(),
        });
      });
    });

    describe('when the sender transfers zero tokens', async () => {
      const amount = 0;

      it('transfers the requested amount', async () => {
        await transfer.call(this, from, to, amount);

        assert.equal(await this.token.balanceOf(from), balance);

        assert.equal(await this.token.balanceOf(to), 0);
      });

      it('emits a transfer event', async () => {
        const { logs } = await transfer.call(this, from, to, amount);

        expectEvent.inLogs(logs, 'Transfer', {
          from,
          to,
          value: amount.toString(),
        });
      });
    });
  });

  describe('when the recipient is the zero address', async () => {
    it('reverts', async () => {
      await expectRevert(
        transfer.call(this, from, ZERO_ADDRESS, balance),
        'to cannot be address(0)',
      );
    });
  });
}

function shouldBehaveLikeTRC20Approve(owner, spender, supply, approve) {
  describe('when the spender is not the zero address', async () => {
    describe('when the sender has enough balance', async () => {
      const amount = supply;

      it('emits an approval event', async () => {
        const { logs } = await approve.call(this, owner, spender, amount);

        expectEvent.inLogs(logs, 'Approval', {
          owner: owner,
          spender: spender,
          value: amount.toString(),
        });
      });

      describe('when there was no approved amount before', async () => {
        it('approves the requested amount', async () => {
          await approve.call(this, owner, spender, amount);

          assert.equal(await this.token.allowance(owner, spender), amount);
        });
      });

      describe('when the spender had an approved amount', async () => {
        beforeEach(async () => {
          await approve.call(this, owner, spender, 1);
        });

        it('approves the requested amount and replaces the previous one', async () => {
          await approve.call(this, owner, spender, amount);

          assert.equal(await this.token.allowance(owner, spender), amount);
        });
      });
    });

    describe('when the sender does not have enough balance', async () => {
      const amount = supply - 1;

      it('emits an approval event', async () => {
        const { logs } = await approve.call(this, owner, spender, amount);

        expectEvent.inLogs(logs, 'Approval', {
          owner: owner,
          spender: spender,
          value: amount.toString(),
        });
      });

      describe('when there was no approved amount before', async () => {
        it('approves the requested amount', async () => {
          await approve.call(this, owner, spender, amount);

          assert.equal(await this.token.allowance(owner, spender), amount);
        });
      });

      describe('when the spender had an approved amount', async () => {
        beforeEach(async () => {
          await approve.call(this, owner, spender, 1);
        });

        it('approves the requested amount and replaces the previous one', async () => {
          await approve.call(this, owner, spender, amount);

          assert.equal(await this.token.allowance(owner, spender), amount);
        });
      });
    });
  });

  describe('when the spender is the zero address', async () => {
    it('reverts', async () => {
      await expectRevert(
        approve.call(this, owner, ZERO_ADDRESS, supply),
        'spender cannot be address(0)',
      );
    });
  });
}

module.exports = {
  shouldBehaveLikeTRC20,
  shouldBehaveLikeTRC20Transfer,
  shouldBehaveLikeTRC20Approve,
};
