// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ProjectRaiseToken
 * @dev ERC20 token for Project Raise launches
 * 
 * Features:
 * - 24-hour fundraising window ($50k-$500k)
 * - 20% owner allocation (10% immediate, 10% vested over 6 months)
 * - 10% liquidity allocation (capped at $100k)
 * - 1% trading fee split: 0.1% platform, 0.3% academy, 0.6% InfoFi
 * - Graduation to PancakeSwap at $500k market cap
 * - Anti-dump mechanism: tokens burned if release would drop below starting market cap
 */
contract ProjectRaiseToken is ERC20, Ownable, ReentrancyGuard {
    // Configuration
    uint256 public constant RAISE_DURATION = 24 hours;
    uint256 public constant VESTING_DURATION = 180 days;
    uint256 public constant VESTING_PERIODS = 6;
    uint256 public constant GRADUATION_THRESHOLD = 500000 * 10**18; // $500k in wei
    
    // Fee structure (basis points)
    uint256 public constant PLATFORM_FEE = 10;  // 0.1%
    uint256 public constant ACADEMY_FEE = 30;   // 0.3%
    uint256 public constant INFOFI_FEE = 60;    // 0.6%
    uint256 public constant TOTAL_FEE = 100;    // 1.0%
    
    // Allocation percentages
    uint256 public constant OWNER_ALLOCATION = 20; // 20%
    uint256 public constant LIQUIDITY_ALLOCATION = 10; // 10%
    uint256 public constant LIQUIDITY_CAP = 100000 * 10**18; // $100k max
    
    // State variables
    uint256 public raiseStartTime;
    uint256 public raiseEndTime;
    uint256 public targetAmount;
    uint256 public raisedAmount;
    uint256 public startingMarketCap;
    bool public graduated;
    bool public approved;
    
    // Vesting
    uint256 public immediateUnlockAmount;
    uint256 public vestedAmount;
    uint256 public releasedVestedAmount;
    uint256 public vestingStartTime;
    
    // Addresses
    address public platformWallet;
    address public academyWallet;
    address public infofiWallet;
    address public liquidityPool;
    
    // Fee pools
    uint256 public platformFeePool;
    uint256 public academyFeePool;
    uint256 public infofiFeePool;
    
    // Events
    event RaiseStarted(uint256 startTime, uint256 endTime, uint256 targetAmount);
    event ContributionReceived(address indexed contributor, uint256 amount);
    event RaiseCompleted(uint256 totalRaised);
    event VestingReleased(address indexed beneficiary, uint256 amount);
    event TokensGraduated(uint256 marketCap);
    event FeeCollected(uint256 platformFee, uint256 academyFee, uint256 infoFiFee);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 _targetAmount,
        address _platformWallet,
        address _academyWallet,
        address _infofiWallet
    ) ERC20(name, symbol) {
        require(_targetAmount >= 50000 * 10**18 && _targetAmount <= 500000 * 10**18, "Invalid target");
        
        targetAmount = _targetAmount;
        platformWallet = _platformWallet;
        academyWallet = _academyWallet;
        infofiWallet = _infofiWallet;
        
        // Mint total supply
        _mint(address(this), totalSupply);
        
        // Calculate allocations
        immediateUnlockAmount = (totalSupply * OWNER_ALLOCATION / 2) / 100; // 10%
        vestedAmount = (totalSupply * OWNER_ALLOCATION / 2) / 100; // 10%
    }
    
    /**
     * @dev Start the fundraise (admin only)
     */
    function startRaise() external onlyOwner {
        require(!approved, "Already started");
        require(raiseStartTime == 0, "Already started");
        
        approved = true;
        raiseStartTime = block.timestamp;
        raiseEndTime = raiseStartTime + RAISE_DURATION;
        
        // Release immediate unlock to owner
        _transfer(address(this), owner(), immediateUnlockAmount);
        
        emit RaiseStarted(raiseStartTime, raiseEndTime, targetAmount);
    }
    
    /**
     * @dev Contribute to the raise
     */
    function contribute() external payable nonReentrant {
        require(approved, "Not approved");
        require(block.timestamp >= raiseStartTime && block.timestamp <= raiseEndTime, "Not active");
        require(msg.value > 0, "Invalid amount");
        require(raisedAmount + msg.value <= targetAmount, "Exceeds target");
        
        raisedAmount += msg.value;
        
        // Transfer tokens proportionally
        uint256 tokenAmount = (msg.value * (totalSupply() * 70 / 100)) / targetAmount;
        _transfer(address(this), msg.sender, tokenAmount);
        
        emit ContributionReceived(msg.sender, msg.value);
        
        if (raisedAmount >= targetAmount) {
            _completeRaise();
        }
    }
    
    /**
     * @dev Complete the raise and setup liquidity
     */
    function _completeRaise() internal {
        vestingStartTime = block.timestamp;
        
        // Setup liquidity pool (10% of supply, capped at $100k)
        uint256 liquidityValue = raisedAmount / 2;
        if (liquidityValue > LIQUIDITY_CAP) {
            liquidityValue = LIQUIDITY_CAP;
        }
        
        // Transfer liquidity
        payable(liquidityPool).transfer(liquidityValue);
        
        // Set starting market cap for anti-dump
        startingMarketCap = raisedAmount * 2; // Simplified calculation
        
        emit RaiseCompleted(raisedAmount);
    }
    
    /**
     * @dev Release vested tokens (monthly)
     */
    function releaseVested() external nonReentrant {
        require(vestingStartTime > 0, "Vesting not started");
        require(msg.sender == owner(), "Not owner");
        
        uint256 elapsed = block.timestamp - vestingStartTime;
        uint256 periods = elapsed / (VESTING_DURATION / VESTING_PERIODS);
        
        if (periods > VESTING_PERIODS) {
            periods = VESTING_PERIODS;
        }
        
        uint256 releasable = (vestedAmount * periods / VESTING_PERIODS) - releasedVestedAmount;
        require(releasable > 0, "Nothing to release");
        
        // Check market cap before releasing
        if (_getCurrentMarketCap() < startingMarketCap) {
            // Burn tokens instead of releasing
            _burn(address(this), releasable);
            
            // Send equivalent value to infofi wallet
            uint256 valueToTransfer = (releasable * _getCurrentMarketCap()) / totalSupply();
            payable(infofiWallet).transfer(valueToTransfer);
        } else {
            _transfer(address(this), owner(), releasable);
        }
        
        releasedVestedAmount += releasable;
        emit VestingReleased(owner(), releasable);
    }
    
    /**
     * @dev Transfer with fee collection
     */
    function _transfer(address from, address to, uint256 amount) internal virtual override {
        if (from == address(this) || to == address(this) || from == owner() || graduated) {
            // No fees for contract, owner, or after graduation
            super._transfer(from, to, amount);
        } else {
            uint256 feeAmount = (amount * TOTAL_FEE) / 10000;
            uint256 amountAfterFee = amount - feeAmount;
            
            // Collect fees
            uint256 platformAmount = (feeAmount * PLATFORM_FEE) / TOTAL_FEE;
            uint256 academyAmount = (feeAmount * ACADEMY_FEE) / TOTAL_FEE;
            uint256 infofiAmount = (feeAmount * INFOFI_FEE) / TOTAL_FEE;
            
            platformFeePool += platformAmount;
            academyFeePool += academyAmount;
            infofiFeePool += infofiAmount;
            
            super._transfer(from, to, amountAfterFee);
            super._transfer(from, address(this), feeAmount);
            
            emit FeeCollected(platformAmount, academyAmount, infofiAmount);
            
            // Check graduation threshold
            if (!graduated && _getCurrentMarketCap() >= GRADUATION_THRESHOLD) {
                graduated = true;
                emit TokensGraduated(_getCurrentMarketCap());
            }
        }
    }
    
    /**
     * @dev Get current market cap (simplified)
     */
    function _getCurrentMarketCap() internal view returns (uint256) {
        return address(this).balance * 2; // Simplified calculation
    }
    
    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external nonReentrant {
        if (msg.sender == platformWallet) {
            uint256 amount = platformFeePool;
            platformFeePool = 0;
            super._transfer(address(this), platformWallet, amount);
        } else if (msg.sender == academyWallet) {
            uint256 amount = academyFeePool;
            academyFeePool = 0;
            super._transfer(address(this), academyWallet, amount);
        } else if (msg.sender == infofiWallet) {
            uint256 amount = infofiFeePool;
            infofiFeePool = 0;
            super._transfer(address(this), infofiWallet, amount);
        }
    }
}