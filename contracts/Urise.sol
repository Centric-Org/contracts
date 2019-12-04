pragma solidity 0.4.24;

import './SafeMath.sol';
import './UriseToken.sol';

contract StableTokenInterface {
    function balanceOf(address who) external view returns (uint256);
    function getOwner() external returns(address _owner);
    function mintFromUrise(address to, uint256 value) public returns (bool);
    function burnFromUrise(uint256 value) public returns (bool);
}

contract Urise is UriseToken {
    /**
     * STATE VARIABLES
     */
    address public stableContract;
    address public quarantineWalletAddress;
    uint public lastBlockNumber;

    // percentage (fraction of 1, e.g.: 0.3)
    // presented as integer with base of GROWTH_RATE_BASE (to be divided by GROWTH_RATE_BASE to get a fraction of 1)
    uint public futureGrowthRate;
    uint public GROWTH_RATE_BASE = 10000;

    // price of URISE in USD
    // base of PRICE_BASE
    uint public PRICE_BASE = 10000;

    struct Block {
        uint blockNumber;   // hours, unix epoch time
        uint risePrice;     // USD price of URISE for the block
        uint growthRate;    // FutureGrowthRate value at the time of block creation
        uint change;        // percentage (base of PRICE_BASE), UrisePrice change relative to prev. block
        uint created;       // hours, unix epoch time
    }

    uint public CHANGE_BASE = 10**8;

    mapping (uint => Block) public hoursToBlock;
    
    /**
     * price factors for months with [28, 29, 30, 31] days,
     * calculated as (1+r)^(1/t)-1
     * where:
     * r - futureGrowthRate,
     * t - number of hours in a given month
     * PRICE_FACTOR_BASE = 10**8
     * e.g.: for futureGrowthRate=0.3 price factors are (considering PRICE_FACTOR_BASE): [39050, 37703, 36446, 35270]
     */
    mapping (uint => uint[4]) public futureGrowthRateToPriceFactors;
    uint public PRICE_FACTOR_BASE = 10**8;

    event DoRise(
        uint time,
        uint indexed blockNumber,
        uint riseAmountBurnt,
        uint change
        );

    event ConvertToStable(
        address converter,
        uint amountConverted,
        uint activeBlockNumber
        );

    event ConvertToRise(
        address converter,
        uint amountConverted,
        uint activeBlockNumber
        );

    event MintStable(address receiver);

    event BurnStable(uint amountBurnt);

    event QuarantineWalletUpdated(address _oldWallet, address _newWallet);

    event StableTokenAddressUpdated(address _oldAddress, address _newAddress);

    event FutureGrowthRateUpdated(uint256 _oldValue, uint256 _newValue,
        uint256[4] _newPriceFactors);

    event BlockCreated(uint256 _blockNumber, uint256 _risePrice,
        uint256 _futureGrowthRate, uint256 _change, uint256 _created);


    constructor(address _mintSaver, address _burnableStorage, address _stableContract)
        public
        TRC20Detailed('TEST URISE Token', 'TRS', 8)
        TRC20Burnable(_burnableStorage)
    {
        mint(_mintSaver, 100000000000000000);   // 1 Billion
        stableContract = _stableContract;
        quarantineWalletAddress = msg.sender;
        lastBlockNumber = getCurrentTime() / 1 hours - 1;    // set so to have the first created block as active
    }


    /**
     * EXTERNAL FUNCTIONS
     */

    function getPrice() external returns(uint _currentPrice) {
        uint _currentHour = (getCurrentTime() / 1 hours);
        return hoursToBlock[_currentHour].risePrice;
    }

    function updateQuarantineWalletAddress(address _newWallet) external onlyContractOwner returns(bool _isSuccess) {
        require (_newWallet != quarantineWalletAddress, 'CANNOT_APPROVE_CURRENT_WALLET');
        require (_newWallet != address(0), 'QUARANTINE_WALLET_CANNOT_BE_SET_TO_ZERO');
        address _oldWallet = quarantineWalletAddress;
    	  quarantineWalletAddress = _newWallet;

        emit QuarantineWalletUpdated(_oldWallet, _newWallet);
        return true;
    }

    function updateStableTokenAddress(address _newAddress) external onlyContractOwner returns(bool _isSuccess) {
        require (_newAddress != quarantineWalletAddress, 'CANNOT_APPROVE_CURRENT_ADDRESS');
        require (_newAddress != address(0), 'STABLE_TOKEN_CANNOT_BE_SET_TO_ZERO');
        address _oldAddress = stableContract;
    	  stableContract = _newAddress;

        emit StableTokenAddressUpdated(_oldAddress, _newAddress);
        return true;
    }


/** 
 *  uint blockNumber;   // hours, unix epoch time
 *  uint risePrice;     // USD price of URISE for the block
 *  uint growthRate;    // FutureGrowthRate value at the time of block creation
 *  uint change;        // percentage (base of PRICE_BASE), UrisePrice change relative to prev. block
 *  uint created;       // hours, unix epoch time
 */

    function getBlockData(uint _hoursEpoch) 
        external view
        returns(uint _blockNumber, uint _risePrice, uint _growthRate, uint _change, uint _created) 
        {
        require (_hoursEpoch > 0, 'EMPTY_HOURS_VALUE');
        require (_hoursEpoch <= (getCurrentTime() / 1 hours), 'HOURS_IN_FUTURE');
        require (hoursToBlock[_hoursEpoch].blockNumber > 0, 'EMPTY_BLOCK');
        
        _blockNumber = hoursToBlock[_hoursEpoch].blockNumber;
        _risePrice = hoursToBlock[_hoursEpoch].risePrice;
        _growthRate = hoursToBlock[_hoursEpoch].growthRate;
        _change = hoursToBlock[_hoursEpoch].change;
        _created = hoursToBlock[_hoursEpoch].created;

        return (_blockNumber, _risePrice, _growthRate, _change, _created);
    }

    /** 
     * Inititally need to create blocks for the 1st year: single call creates blocks for 1 DAY (24 hours) of a given month
     * Then one block each hour - to always have blocks for year ahead, using doRise method
     * _monthBlocks - hours in month, should be between 28*24 and 31*24
     */
    function doCreateBlocks(uint _monthBlocks) external onlyContractOwner returns(bool _isSuccess) {
        require(futureGrowthRate != 0, 'WRONG_FUTURE_GROWTH_RATE');
        require(_monthBlocks >= 28*24 && _monthBlocks <= 31*24, 'WRONG_MONTH_BLOCKS');
        for (uint _blockOfMonth = 1; _blockOfMonth <= 24; _blockOfMonth++) {
            require (createBlock(_monthBlocks), 'FAILED_TO_CREATE_BLOCK');
        }
        return true;
    }

    // _priceFactors - see comments for mapping futureGrowthRateToPriceFactors
    function updateFutureGrowthRate(uint _newGrowthRate, uint[4] _priceFactors) external onlyContractOwner returns(bool _isSuccess) {
        require (_newGrowthRate != 0, 'CANNOT_APPROVE_ZERO_RATE');
        require (_newGrowthRate != futureGrowthRate, 'CANNOT_APPROVE_CURRENT_RATE');
        require (_newGrowthRate < GROWTH_RATE_BASE, 'WRONG_GROWTH_RATE');

        uint256 _oldRate = futureGrowthRate;
        futureGrowthRate = _newGrowthRate;

        for (uint8 i = 0; i < _priceFactors.length; i++) {
            require(_priceFactors[i] != 0, 'ZERO_PRICE_FACTOR');
        }
        require(_priceFactors[0] > _priceFactors[1] && _priceFactors[1] > _priceFactors[2] &&
        _priceFactors[2] > _priceFactors[3], 'PRICE_FACTORS_ARE_NOT_VALID');

        futureGrowthRateToPriceFactors[_newGrowthRate] = _priceFactors;

        emit FutureGrowthRateUpdated(_oldRate, _newGrowthRate, _priceFactors);
        return true;
    }

    function getActiveBlockNumber() public view returns(uint _activeBlockNumber) {
        uint _currentHour = (getCurrentTime() / 1 hours);
        _activeBlockNumber = hoursToBlock[_currentHour].blockNumber;
        return _activeBlockNumber;
    }

    /**
     * INTERNAL FUNCTIONS
     */

    // _monthBlocks - hours in a given month, can be 28*24, 29*24, 30*24 or 31*24
    function doRise(uint _monthBlocks) external onlyContractOwner returns(bool _isSuccess) {
        require(futureGrowthRate != 0, 'WRONG_FUTURE_GROWTH_RATE');
        require(_monthBlocks == 28*24 || _monthBlocks == 29*24 || _monthBlocks == 30*24 ||
            _monthBlocks == 31*24, 'WRONG_MONTH_BLOCKS');

        uint _currentHour = (getCurrentTime() / 1 hours);
        Block memory _nextBlock = hoursToBlock[_currentHour];

        require(createBlock(_monthBlocks), 'FAILED_TO_CREATE_BLOCK');

        uint _change = _nextBlock.change;
        uint _riseBurnt = burnQuarantined(_change);

        require(_riseBurnt != 0, 'BURN_QUARANTINED_FAILED');

        emit DoRise(getCurrentTime(), _nextBlock.blockNumber, _riseBurnt, _change);
        return true;
    }

    function createBlock(uint _monthBlocks) internal returns(bool _isSuccess) {
        uint _lastPrice = hoursToBlock[lastBlockNumber].risePrice;
        if (_lastPrice == 0) _lastPrice = PRICE_BASE;
        uint _nextBlockNumber = lastBlockNumber.add(1);
        require(hoursToBlock[_nextBlockNumber].blockNumber == 0, 'CANT_REPLACE_BLOCK');
        
        uint _risePriceFactor;
        if (_monthBlocks == 28*24) _risePriceFactor = futureGrowthRateToPriceFactors[futureGrowthRate][0];
        else if (_monthBlocks == 29*24) _risePriceFactor = futureGrowthRateToPriceFactors[futureGrowthRate][1];
        else if (_monthBlocks == 30*24) _risePriceFactor = futureGrowthRateToPriceFactors[futureGrowthRate][2];
        else if (_monthBlocks == 31*24) _risePriceFactor = futureGrowthRateToPriceFactors[futureGrowthRate][3];
        else require(false, 'WRONG_MONTH_BLOCKS');
        
        uint _risePrice = ((_risePriceFactor.mul(_lastPrice)).add(_lastPrice.mul(PRICE_FACTOR_BASE))).div(PRICE_FACTOR_BASE);

        uint256 _change = (_risePrice.sub(_lastPrice)).mul(CHANGE_BASE).div(_lastPrice);
        uint256 _created = getCurrentTime() / 1 hours;

        hoursToBlock[_nextBlockNumber] = Block({
            blockNumber: _nextBlockNumber,
            risePrice: _risePrice,
            growthRate: futureGrowthRate,
            change: _change,
            created: _created
        });

        lastBlockNumber = _nextBlockNumber;
        
        emit BlockCreated(_nextBlockNumber, _risePrice, futureGrowthRate, _change, _created);
        return true;
    }


    /**
    * INTERNAL FUNCTIONS
    */

    function switchToRise(uint _stableAmount, address _riseRecipient) external returns(bool _isSuccess) {
        require(msg.sender == StableTokenInterface(stableContract).getOwner(), 'STABLE_OWNER_ONLY');
        require(StableTokenInterface(stableContract).balanceOf(msg.sender) >= _stableAmount,
            'INSUFFICIENT_STABLE_BALANCE');
        require(StableTokenInterface(stableContract).burnFromUrise(_stableAmount), 'BURNING_STABLE_FAILED');

        emit BurnStable(_stableAmount);
      
        uint _currentHour = (getCurrentTime() / 1 hours);
        uint _riseToDequarantine = (_stableAmount.mul(PRICE_BASE)).div(hoursToBlock[_currentHour].risePrice);

        require(transferFrom(quarantineWalletAddress, _riseRecipient, _riseToDequarantine), 'SWITCH_TO_URISE_FAILED');

        uint _activeBlockNumber = getActiveBlockNumber();

        emit ConvertToRise(msg.sender, _stableAmount, _activeBlockNumber);
        return true;
    }

    function switchToStable(uint _riseAmount, address _stableRecipient) external returns(uint _stables) {
        require(balanceOf(msg.sender) >= _riseAmount, 'INSUFFICIENT_BALANCE');
        require(transferFrom(msg.sender, quarantineWalletAddress, _riseAmount), 'URISE_TRANSFER_FAILED');

        uint _currentHour = (getCurrentTime() / 1 hours);
        uint _stableToIssue = (_riseAmount.mul(hoursToBlock[_currentHour].risePrice)).div(PRICE_BASE);

        require(StableTokenInterface(stableContract).mintFromUrise(_stableRecipient, _stableToIssue), 'STABLE_MINT_FAILED');

        emit MintStable(_stableRecipient);
        
        uint _activeBlockNumber = getActiveBlockNumber();

        emit ConvertToStable(msg.sender, _riseAmount, _activeBlockNumber);
        return _stableToIssue;
    }

    function burnQuarantined(uint _change) internal returns(uint _riseBurnt) {
        uint _quarantined = balanceOf(quarantineWalletAddress);
        uint _riseToBurn = _quarantined.sub(_quarantined.mul(CHANGE_BASE).div(
            uint(1).mul(CHANGE_BASE).add(_change)));
        burnFrom(quarantineWalletAddress, _riseToBurn);
        
        return _riseToBurn;
    }

    // for testing purposes
    function getCurrentTime() public view returns(uint256 currentTime) {
      return now;
    }
}