// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract Escrow {
    IERC20 public immutable usdc;

    enum DealStatus { None, Created, Funded, Staked, Released, Refunded, Disputed }

    struct Deal {
        address buyer;
        address traveler;
        uint256 itemPrice;
        uint256 reward;
        uint256 stake;
        DealStatus status;
    }

    mapping(bytes32 => Deal) public deals;
    address public owner;

    event DealCreated(bytes32 indexed dealId, address buyer, uint256 itemPrice, uint256 reward);
    event DealFunded(bytes32 indexed dealId, uint256 amount);
    event DealStaked(bytes32 indexed dealId, address traveler, uint256 amount);
    event DealReleased(bytes32 indexed dealId, uint256 totalPayout);
    event DealRefunded(bytes32 indexed dealId, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }

    function createDeal(bytes32 dealId, uint256 itemPrice, uint256 reward) external {
        require(deals[dealId].status == DealStatus.None, "Deal already exists");
        require(msg.sender != address(0), "Invalid buyer");

        deals[dealId] = Deal({
            buyer: msg.sender,
            traveler: address(0),
            itemPrice: itemPrice,
            reward: reward,
            stake: 0,
            status: DealStatus.Created
        });

        emit DealCreated(dealId, msg.sender, itemPrice, reward);
    }

    function deposit(bytes32 dealId) external {
        Deal storage deal = deals[dealId];
        require(deal.status == DealStatus.Created, "Deal not in Created status");
        require(msg.sender == deal.buyer, "Only buyer can deposit");

        uint256 totalAmount = deal.itemPrice + deal.reward;
        require(
            usdc.allowance(msg.sender, address(this)) >= totalAmount,
            "Insufficient USDC allowance"
        );

        deal.status = DealStatus.Funded;
        usdc.transferFrom(deal.buyer, address(this), totalAmount);

        emit DealFunded(dealId, totalAmount);
    }

    function release(bytes32 dealId) external {
        Deal storage deal = deals[dealId];
        require(
            deal.status == DealStatus.Funded || deal.status == DealStatus.Staked,
            "Deal not ready for release"
        );
        require(msg.sender == deal.buyer || msg.sender == owner, "Not authorized");

        deal.status = DealStatus.Released;

        // Pay traveler: itemPrice + reward
        uint256 travelerPayout = deal.itemPrice + deal.reward;
        usdc.transfer(deal.traveler != address(0) ? deal.traveler : msg.sender, travelerPayout);

        // Refund stake back to traveler if they staked
        if (deal.stake > 0 && deal.traveler != address(0)) {
            usdc.transfer(deal.traveler, deal.stake);
        }

        emit DealReleased(dealId, travelerPayout);
    }

    function refund(bytes32 dealId) external {
        Deal storage deal = deals[dealId];
        require(
            deal.status == DealStatus.Funded || deal.status == DealStatus.Staked || deal.status == DealStatus.Disputed,
            "Deal not refundable"
        );
        require(
            msg.sender == deal.buyer || msg.sender == owner,
            "Not authorized"
        );

        deal.status = DealStatus.Refunded;

        uint256 refundAmount = deal.itemPrice + deal.reward;
        usdc.transfer(deal.buyer, refundAmount);

        // Return stake to traveler
        if (deal.stake > 0 && deal.traveler != address(0)) {
            usdc.transfer(deal.traveler, deal.stake);
        }

        emit DealRefunded(dealId, refundAmount);
    }

    function setTraveler(bytes32 dealId, address traveler) external {
        Deal storage deal = deals[dealId];
        require(deal.status == DealStatus.Created || deal.status == DealStatus.Funded, "Invalid status");
        require(msg.sender == deal.buyer || msg.sender == owner, "Not authorized");

        deal.traveler = traveler;
    }

    function getDeal(bytes32 dealId) external view returns (
        address buyer,
        address traveler,
        uint256 itemPrice,
        uint256 reward,
        uint256 stake,
        uint8 status
    ) {
        Deal storage deal = deals[dealId];
        return (
            deal.buyer,
            deal.traveler,
            deal.itemPrice,
            deal.reward,
            deal.stake,
            uint8(deal.status)
        );
    }

    function getDealStatus(bytes32 dealId) external view returns (uint8) {
        return uint8(deals[dealId].status);
    }
}
