pragma solidity 0.4.24;

import '../Rise.sol';

contract RiseMock is Rise {
    uint256 currentTime;

    constructor (address _mintSaver, address _burnableStorage, address _cashContract)
    public
    Rise(_mintSaver, _burnableStorage, _cashContract) {}

    function getCurrentTime () public view returns(uint256) {
        if(currentTime == 0) {
            return 3600;
        } else {
            return currentTime;
        }
    }

    function setCurrentTime(uint256 _currentTime) public {
        currentTime = _currentTime;
    }

    function createBlockMock(uint _monthBlocks) public returns(bool _isSuccess) {
        return createBlock(_monthBlocks);
    }

    function burnQuarantinedMock(uint _change) public returns(uint _riseBurnt) {
        return burnQuarantined(_change);
    }
}