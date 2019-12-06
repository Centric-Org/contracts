pragma solidity 0.4.24;

import './SafeMath.sol';
import './TRC20.sol';

contract StableToken is TRC20Burnable, TRC20Detailed, TRC20Mintable {

    address public uriseContract;
    address private uriseContractOwner;

    constructor(address _mintSaver, address _burnableStorage)
        public
        TRC20Detailed('TEST STABLE Token', 'TEST STBL', 8)
        TRC20Burnable(_burnableStorage)
    {
        mint(_mintSaver, 0);
    }

    modifier onlyUrise() {
        require(uriseContract != address(0), 'URISE_NOT_SET');
        require(msg.sender == uriseContract, 'NOT_URISE');
        _;
    }

    function updateRiseContract(address _newUriseContract) 
    public 
    onlyContractOwner 
    returns(bool _isSuccess, address _uriseContract) {
        require(_newUriseContract != address(0), 'EMPTY_ADDRESS');
        require(_newUriseContract != uriseContract, 'SAME_ADDRESS');
        uriseContract = _newUriseContract;

        uriseContractOwner = Claimable(_newUriseContract).owner();
        return (true, uriseContract);
    }

    function transferForOwner(address _from, address _to, uint256 _value) 
    public onlyContractOwner returns (bool) {
        require(_from != address(0), 'EMPTY_FROM');
        require(_to != address(0), 'EMPTY_TO');
        _transfer(_from, _to, _value);
        return true;
    }

    function getOwner() external view returns(address _owner) {
        require(msg.sender == uriseContract, 'CALLER_NOT_AUTHORIZED');
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
