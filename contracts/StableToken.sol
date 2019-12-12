pragma solidity 0.4.24;

import './SafeMath.sol';
import './TRC20.sol';

contract StableToken is TRC20Burnable, TRC20Detailed, TRC20Mintable {

    address public uriseContract;

    constructor(address _mintSaver, address _burnableStorage)
        public
        TRC20Detailed('TEST STABLE Token', 'TEST STBL', 8)
        TRC20Burnable(_burnableStorage)
    {
        mint(_mintSaver, 0);
    }

    modifier onlyUrise() {
        require(msg.sender == uriseContract, 'CALLER_MUST_BE_URISE_CONTRACT_ONLY');
        _;
    }

    function setUriseContract(address _uriseContractAddress) external onlyContractOwner() {
        require(uriseContract == address(0), 'URISE_CONTRACT_ADDRESS_IS_ALREADY_SET');
        uriseContract = _uriseContractAddress;
    }

    function getOwner() external onlyUrise() view returns(address _owner) {
        return owner;
    }

    function mintFromUrise(address to, uint256 value) external onlyUrise returns (bool) {
        _mint(to, value);
        return true;
    }

    function burnFromUrise(address tokensOwner, uint256 value) external onlyUrise returns (bool) {
        _burn(tokensOwner, value);
        return true;
    }
}
