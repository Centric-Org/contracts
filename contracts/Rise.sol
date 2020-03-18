pragma solidity 0.4.25;

import './TRC20.sol';
import './RoundMath.sol';
import './MonthLib.sol';


contract CashInterface {
    function totalSupply() public view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function mintFromRise(address to, uint256 value) public returns (bool);

    function burnFromRise(address tokensOwner, uint256 value) external returns (bool);
}


contract Rise is TRC20Detailed {
    using RoundMath for uint256;
    using MonthLib for uint256;

    /**
     * STATE VARIABLES
     */
    address public cashContract;
    uint256 public quarantineBalance;
    uint256 public lastBlockNumber;
    uint256 public lastCalledHour;

    // Price of Rise in USD has base of PRICE_BASE
    uint256 public PRICE_BASE = 10**8;

    // Inital price of Rise in USD has base of PRICE_BASE
    uint256 public initialPrice = 888901550;

    // Structure of a Price Block
    struct Block {
        uint256 risePrice; // USD price of Rise for the block
        uint256 growthRate; // FutureGrowthRate value at the time of block creation
        //solium-disable-next-line max-len
        uint256 change; // percentage (base of PRICE_BASE), RisePrice change relative to prev. block
        uint256 created; // hours, Unix epoch time
    }

    mapping(uint256 => Block) public hoursToBlock;

    /**
     * Price factors for months with [28, 29, 30, 31] days,
     * price factors determine compounding hourly growth
     * from the headling monthly growthRate,
     * calculated as (1+r)^(1/t)-1
     * where:
     * r - growthRate,
     * t - number of hours in a given month
     * PRICE_FACTOR_BASE = 10**11
     * e.g.: for growthRate=2850=(2850/GROWTH_RATE_BASE)=0.285=28.5%
     * price factors are (considering PRICE_FACTOR_BASE): [37322249, 36035043, 34833666, 33709810]
     */
    mapping(uint256 => uint256[4]) public growthRateToPriceFactors;
    uint256 public GROWTH_RATE_BASE = 10000;
    uint256 public PRICE_FACTOR_BASE = 10**11;

    bool priceFactorsLocked = false;

    event DoBalance(uint256 indexed currentHour, uint256 riseAmountBurnt);

    event ConvertToCash(
        address indexed converter,
        uint256 riseAmountSent,
        uint256 cashAmountReceived
    );

    event ConvertToRise(
        address indexed converter,
        uint256 cashAmountSent,
        uint256 riseAmountReceived
    );

    event MintCash(address receiver, uint256 amount);

    event BurnCash(uint256 amountBurnt);

    event PriceFactorSet(uint256 growthRate, uint256[4] priceFactors);

    event BlockCreated(
        uint256 blockNumber,
        uint256 risePrice,
        uint256 growthRate,
        uint256 change,
        uint256 created
    );

    event QuarantineBalanceBurnt(uint256 amount);

    event LostTokensBurnt(uint256 amount);

    /**
     * Creates Rise contract. Also sets the Cash address
     * to the contract storage to be able to interact with it.
     * Mints 1 billion tokens to _mintSaver address.
     */
    constructor(address _mintSaver, address _cashContract)
        public
        TRC20Detailed('Centric RISE', 'CNR', 8)
    {
        _mint(_mintSaver, 100000000000000000); // 1 Billion
        cashContract = _cashContract;
    }

    // Returns price of Rise for the current hour
    function getCurrentPrice() external view returns (uint256) {
        require(hoursToBlock[getCurrentHour()].risePrice > 0, 'BLOCK_NOT_DEFINED');
        return hoursToBlock[getCurrentHour()].risePrice;
    }

    // Returns price of Rise at a specified hour
    function getPrice(uint256 _hour) external view returns (uint256) {
        require(hoursToBlock[_hour].risePrice > 0, 'BLOCK_NOT_DEFINED');
        return hoursToBlock[_hour].risePrice;
    }

    /**
     *  Returns Price Block data
     *  uint256 risePrice;     // USD price of Rise for the block
     *  uint256 growthRate;    // FutureGrowthRate value at the time of block creation
     *  uint256 change;        // percentage (base of PRICE_BASE), RisePrice change relative to prev. block
     *  uint256 created;       // hours, unix epoch time
     */
    function getBlockData(uint256 _hoursEpoch)
        external
        view
        returns (uint256 _risePrice, uint256 _growthRate, uint256 _change, uint256 _created)
    {
        require(_hoursEpoch > 0, 'EMPTY_HOURS_VALUE');
        require(hoursToBlock[_hoursEpoch].risePrice > 0, 'BLOCK_NOT_DEFINED');

        _risePrice = hoursToBlock[_hoursEpoch].risePrice;
        _growthRate = hoursToBlock[_hoursEpoch].growthRate;
        _change = hoursToBlock[_hoursEpoch].change;
        _created = hoursToBlock[_hoursEpoch].created;

        return (_risePrice, _growthRate, _change, _created);
    }

    /**
     * Single call creates ONE Price Block.
     * For creating a batch of blocks function needs to be run according amount of times.
     * Admin should always make sure that there is a block for the currentHour
     * and if not - create it. Otherwise users will not be able to switch tokens
     * until a new block is created.
     * _blockNumber - always has to be lastBlockNumber + 1 (works only as a security check)
     * _growthRate applied to Price Block creation
     * percentage (fraction of 1, e.g.: 0.3)
     * presented as integer with base of GROWTH_RATE_BASE (to be divided by GROWTH_RATE_BASE to get a fraction of 1)
     */
    function doCreateBlock(uint256 _blockNumber, uint256 _growthRate)
        external
        onlyAdmin()
        returns (bool _success)
    {
        require(priceFactorsLocked, 'PRICE_FACTORS_MUST_BE_LOCKED');

        require(_growthRate != 0, 'WRONG_GROWTH_RATE');
        require(_growthRate < GROWTH_RATE_BASE, 'WRONG_GROWTH_RATE');
        require(growthRateToPriceFactors[_growthRate][0] > 0, 'WRONG_GROWTH_RATE');

        require(createBlock(_blockNumber, _growthRate), 'FAILED_TO_CREATE_BLOCK');
        return true;
    }

    /**
     * set growthRateToPriceFactors
     * _priceFactors - see comments for mapping growthRateToPriceFactors
     */
    function setPriceFactors(uint256 _growthRate, uint256[4] _priceFactors)
        external
        onlyAdmin()
        returns (bool _success)
    {
        require(priceFactorsLocked == false, 'PRICE_FACTORS_ALREADY_LOCKED');
        require(_growthRate != 0, 'CANNOT_APPROVE_ZERO_RATE');
        require(_growthRate < GROWTH_RATE_BASE, 'WRONG_GROWTH_RATE');
        require(_priceFactors.length == 4, 'WRONG_NUMBER_OF_PRICE_FACTORS');

        for (uint8 i = 0; i < _priceFactors.length; i++) {
            require(_priceFactors[i] != 0, 'ZERO_PRICE_FACTOR');
        }

        require(_priceFactors[0] < 103200117, 'PRICE_FACTORS_ARE_NOT_VALID');
        require(_priceFactors[1] < 99639720, 'PRICE_FACTORS_ARE_NOT_VALID');
        require(_priceFactors[2] < 96316797, 'PRICE_FACTORS_ARE_NOT_VALID');
        require(_priceFactors[3] < 93208356, 'PRICE_FACTORS_ARE_NOT_VALID');

        require(
            _priceFactors[0] > _priceFactors[1] &&
                _priceFactors[1] > _priceFactors[2] &&
                _priceFactors[2] > _priceFactors[3],
            'PRICE_FACTORS_ARE_NOT_VALID'
        );

        growthRateToPriceFactors[_growthRate] = _priceFactors;

        emit PriceFactorSet(_growthRate, _priceFactors);
        return true;
    }

    function lockPriceFactors() external onlyAdmin() returns (bool _success) {
        priceFactorsLocked = true;
        return true;
    }

    /**
     * Public function that burns Rise from quarantine
     * according to the burnQuarantine() formula.
     * Needed for economic logic of Rise token.
     */
    function doBalance() external returns (bool _success) {
        require(hoursToBlock[getCurrentHour()].risePrice != 0, 'RISE_PRICE_MUST_BE_POSITIVE_VALUE');
        require(lastCalledHour < getCurrentHour(), 'CHANGE_IS_ALREADY_BURNT_IN_THIS_HOUR');

        lastCalledHour = getCurrentHour();

        uint256 _riseBurnt = burnQuarantined();

        emit DoBalance(getCurrentHour(), _riseBurnt);
        return true;
    }

    /**
     * Public function that allows users to convert Cash tokens to Rise ones.
     * Amount of received Rise tokens depends on the risePrice of the current block.
     */
    function convertToRise(uint256 _cashAmount) external returns (bool _success) {
        require(hoursToBlock[getCurrentHour()].risePrice != 0, 'RISE_PRICE_MUST_BE_POSITIVE_VALUE');

        require(
            CashInterface(cashContract).balanceOf(msg.sender) >= _cashAmount,
            'INSUFFICIENT_CASH_BALANCE'
        );

        require(
            CashInterface(cashContract).burnFromRise(msg.sender, _cashAmount),
            'BURNING_CASH_FAILED'
        );

        emit BurnCash(_cashAmount);

        uint256 _riseToDequarantine = (_cashAmount.mul(PRICE_BASE)).div(
            hoursToBlock[getCurrentHour()].risePrice
        );

        quarantineBalance = quarantineBalance.sub(_riseToDequarantine);
        require(this.transfer(msg.sender, _riseToDequarantine), 'CONVERT_TO_RISE_FAILED');

        emit ConvertToRise(msg.sender, _cashAmount, _riseToDequarantine);
        return true;
    }

    /**
     * Public function that allows users to convert Rise tokens to Cash ones.
     * Amount of received Cash tokens depends on the risePrice of a current block.
     */
    function convertToCash(uint256 _riseAmount) external returns (uint256) {
        require(balanceOf(msg.sender) >= _riseAmount, 'INSUFFICIENT_BALANCE');
        require(hoursToBlock[getCurrentHour()].risePrice != 0, 'RISE_PRICE_MUST_BE_POSITIVE_VALUE');

        quarantineBalance = quarantineBalance.add(_riseAmount);
        require(transfer(address(this), _riseAmount), 'RISE_TRANSFER_FAILED');

        uint256 _cashToIssue = (_riseAmount.mul(hoursToBlock[getCurrentHour()].risePrice)).div(
            PRICE_BASE
        );

        require(
            CashInterface(cashContract).mintFromRise(msg.sender, _cashToIssue),
            'CASH_MINT_FAILED'
        );

        emit MintCash(msg.sender, _cashToIssue);

        emit ConvertToCash(msg.sender, _riseAmount, _cashToIssue);
        return _cashToIssue;
    }

    /**
     * Function is needed to burn lost tokens that probably were sent
     * to the contract address by mistake.
     */
    function burnLostTokens() external onlyContractOwner() returns (bool _success) {
        uint256 _amount = balanceOf(address(this)).sub(quarantineBalance);

        _burn(this, _amount);

        emit LostTokensBurnt(_amount);
        return true;
    }

    /**
     * Internal function that implements logic to burn a part of Rise tokens on quarantine.
     * Formula is based on network capitalization rules -
     * Network capitalization of quarantined Rise must equal
     * network capitalization of Cash
     * calculated as (q * pRISE - c * pCASH) / pRISE
     * where:
     * q - quarantined Rise,
     * pRISE - current risePrice
     * c - current cash supply
     * pCash - Cash pegged price ($1 USD fixed conversion price)
     * PRICE_FACTOR_BASE = 10**8
     */
    function burnQuarantined() internal returns (uint256) {
        uint256 _quarantined = quarantineBalance;
        uint256 _currentPrice = hoursToBlock[getCurrentHour()].risePrice;
        uint256 _cashSupply = CashInterface(cashContract).totalSupply();

        uint256 _riseToBurn = (
            (((_quarantined.mul(_currentPrice)).div(PRICE_BASE)).sub(_cashSupply)).mul(PRICE_BASE)
        )
            .div(_currentPrice);

        quarantineBalance = quarantineBalance.sub(_riseToBurn);
        _burn(this, _riseToBurn);

        emit QuarantineBalanceBurnt(_riseToBurn);
        return _riseToBurn;
    }

    /**
     * Internal function for creating a new Price Block.
     */
    function createBlock(uint256 _expectedBlockNumber, uint256 _growthRate)
        internal
        returns (bool _success)
    {
        uint256 _lastPrice;
        uint256 _nextBlockNumber;

        if (lastBlockNumber == 0) {
            require(_expectedBlockNumber > getCurrentHour(), 'FIRST_BLOCK_MUST_BE_IN_THE_FUTURE');
            _lastPrice = initialPrice;
            _nextBlockNumber = _expectedBlockNumber;
        } else {
            _lastPrice = hoursToBlock[lastBlockNumber].risePrice;
            _nextBlockNumber = lastBlockNumber.add(1);
        }

        require(_nextBlockNumber == _expectedBlockNumber, 'WRONG_BLOCK_NUMBER');

        uint256 _monthBlocks = (_nextBlockNumber * 60 * 60 * 1000).getHoursInMonth();

        uint256 _risePriceFactor;
        if (_monthBlocks == 28 * 24) _risePriceFactor = growthRateToPriceFactors[_growthRate][0];
        else if (_monthBlocks == 29 * 24)
            _risePriceFactor = growthRateToPriceFactors[_growthRate][1];
        else if (_monthBlocks == 30 * 24)
            _risePriceFactor = growthRateToPriceFactors[_growthRate][2];
        else if (_monthBlocks == 31 * 24)
            _risePriceFactor = growthRateToPriceFactors[_growthRate][3];
        else require(false, 'WRONG_MONTH_BLOCKS');

        uint256 _risePrice = (
            (_risePriceFactor.mul(_lastPrice)).add(_lastPrice.mul(PRICE_FACTOR_BASE))
        )
            .ceilDiv(PRICE_FACTOR_BASE);

        uint256 _change = (_risePrice.sub(_lastPrice)).mul(PRICE_BASE).roundDiv(_lastPrice);
        uint256 _created = getCurrentHour();

        hoursToBlock[_nextBlockNumber] = Block({
            risePrice: _risePrice,
            growthRate: _growthRate,
            change: _change,
            created: _created
        });

        lastBlockNumber = _nextBlockNumber;

        emit BlockCreated(_nextBlockNumber, _risePrice, _growthRate, _change, _created);
        return true;
    }

    // For testing purposes
    function getCurrentTime() public view returns (uint256) {
        return now;
    }

    // Helper function only
    function getCurrentHour() public view returns (uint256) {
        return getCurrentTime().div(1 hours);
    }
}
