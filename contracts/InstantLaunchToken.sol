// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title InstantLaunchToken
 * @dev ERC20 token for Instant Launch
 * 
 * Features:
 * - Instant deployment and trading
 * - 2% trading fee split: 0.1% platform, 1.0% creator, 0.9% InfoFi
 * - Graduate to PancakeSwap when cumulative buys reach 15 BNB
 * - Creator can claim fees every 24h if market cap >= graduation market cap
 * - Fees accrue for 1 week before distributing to InfoFi if requirements not met
 */
contract InstantLaunchToken is ERC20, Ownable, ReentrancyGuard {
    // Configuration
    uint256 public constant GRADUATION_THRESHOLD = 15 * 10**18; // 15 BNB
    uint256 public constant CLAIM_COOLDOWN = 24 hours;
    uint256 public constant ACCRUAL_PERIOD = 7 days;
    
    // Fee structure (basis points)
    uint256 public constant PLATFORM_FEE = 10;  // 0.1%
    uint256 public constant CREATOR_FEE = 100;  // 1.0%
    uint256 public constant INFOFI_FEE = 90;    // 0.9%
    uint256 public constant TOTAL_FEE = 200;    // 2.0%
    
    // State variables
    uint256 public cumulativeBuys;
    uint256 public graduationMarketCap;
    bool public graduated;
    uint256 public lastClaimTime;
    uint256 public creatorClaimableAmount;
    
    // Addresses
    address public platformWallet;
    address public infofiWallet;
    
    // Fee pools
    uint256 public platformFeePool;
    uint256 public creatorFeePool;
    uint256 public infofiFeePool;
    
    // Events
    event TokenLaunched(address indexed creator, uint256 initialBuy);
    event BuyExecuted(address indexed buyer, uint256 amount, uint256 bnbAmount);
    event TokensGraduated(uint256 cumulativeBuys);
    event CreatorFeeClaimed(address indexed creator, uint256 amount);
    event FeeCollected(uint256 platformFee, uint256 creatorFee, uint256 infoFiFee);
    event FeesDistributedToInfoFi(uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address _platformWallet,
        address _infofiWallet
    ) ERC20(name, symbol) {
        platformWallet = _platformWallet;
        infofiWallet = _infofiWallet;
        
        // Mint entire supply to creator
        _mint(msg.sender, totalSupply);
    }
    
    /**
     * @dev Buy tokens with BNB
     */
    function buy() external payable nonReentrant {
        require(msg.value > 0, "Invalid amount");
        
        cumulativeBuys += msg.value;
        
        // Calculate token amount (simplified pricing)
        uint256 tokenAmount = msg.value * 10000; // Example rate
        
        // Collect fees
        uint256 feeAmount = (msg.value * TOTAL_FEE) / 10000;
        uint256 platformAmount = (feeAmount * PLATFORM_FEE) / TOTAL_FEE;
        uint256 creatorAmount = (feeAmount * CREATOR_FEE) / TOTAL_FEE;
        uint256 infofiAmount = (feeAmount * INFOFI_FEE) / TOTAL_FEE;
        
        platformFeePool += platformAmount;
        creatorFeePool += creatorAmount;
        infofiFeePool += infofiAmount;
        
        emit BuyExecuted(msg.sender, tokenAmount, msg.value);
        emit FeeCollected(platformAmount, creatorAmount, infofiAmount);
        
        // Check graduation
        if (!graduated && cumulativeBuys >= GRADUATION_THRESHOLD) {
            graduated = true;
            graduationMarketCap = _getCurrentMarketCap();
            emit TokensGraduated(cumulativeBuys);
        }
    }
    
    /**
     * @dev Creator claims accumulated fees
     */
    function claimCreatorFees() external nonReentrant {
        require(msg.sender == owner(), "Not creator");
        require(creatorFeePool > 0, "Nothing to claim");
        
        // Check claim conditions
        if (graduated) {
            // Must maintain graduation market cap
            if (_getCurrentMarketCap() >= graduationMarketCap) {
                // Check cooldown
                require(block.timestamp >= lastClaimTime + CLAIM_COOLDOWN, "Cooldown active");
                
                uint256 amount = creatorFeePool;
                creatorFeePool = 0;
                lastClaimTime = block.timestamp;
                
                payable(owner()).transfer(amount);
                emit CreatorFeeClaimed(owner(), amount);
            } else {
                // Market cap dropped, check accrual period
                if (block.timestamp >= lastClaimTime + ACCRUAL_PERIOD) {
                    // Distribute to InfoFi wallet
                    uint256 amount = creatorFeePool;
                    creatorFeePool = 0;
                    
                    payable(infofiWallet).transfer(amount);
                    emit FeesDistributedToInfoFi(amount);
                }
            }
        } else {
            revert("Not yet graduated");
        }
    }
    
    /**
     * @dev Transfer with fee collection
     */
    function _transfer(address from, address to, uint256 amount) internal virtual override {
        if (from == owner() || to == owner() || graduated) {
            // No fees for creator or after graduation
            super._transfer(from, to, amount);
        } else {
            uint256 feeAmount = (amount * TOTAL_FEE) / 10000;
            uint256 amountAfterFee = amount - feeAmount;
            
            // Collect fees
            uint256 platformAmount = (feeAmount * PLATFORM_FEE) / TOTAL_FEE;
            uint256 creatorAmount = (feeAmount * CREATOR_FEE) / TOTAL_FEE;
            uint256 infofiAmount = (feeAmount * INFOFI_FEE) / TOTAL_FEE;
            
            platformFeePool += platformAmount;
            creatorFeePool += creatorAmount;
            infofiFeePool += infofiAmount;
            
            super._transfer(from, to, amountAfterFee);
            super._transfer(from, address(this), feeAmount);
            
            emit FeeCollected(platformAmount, creatorAmount, infofiAmount);
        }
    }
    
    /**
     * @dev Get current market cap (simplified)
     */
    function _getCurrentMarketCap() internal view returns (uint256) {
        return address(this).balance * 2; // Simplified calculation
    }
    
    /**
     * @dev Withdraw platform fees
     */
    function withdrawPlatformFees() external nonReentrant {
        require(msg.sender == platformWallet, "Not platform");
        require(platformFeePool > 0, "Nothing to withdraw");
        
        uint256 amount = platformFeePool;
        platformFeePool = 0;
        
        payable(platformWallet).transfer(amount);
    }
    
    /**
     * @dev Withdraw InfoFi fees
     */
    function withdrawInfoFiFees() external nonReentrant {
        require(msg.sender == infofiWallet, "Not InfoFi");
        require(infofiFeePool > 0, "Nothing to withdraw");
        
        uint256 amount = infofiFeePool;
        infofiFeePool = 0;
        
        payable(infofiWallet).transfer(amount);
    }
    
    /**
     * @dev Get creator claimable amount
     */
    function getCreatorClaimable() external view returns (uint256) {
        if (!graduated || _getCurrentMarketCap() < graduationMarketCap) {
            return 0;
        }
        if (block.timestamp < lastClaimTime + CLAIM_COOLDOWN) {
            return 0;
        }
        return creatorFeePool;
    }
}