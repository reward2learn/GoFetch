// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TrustMule USDC Escrow
/// @notice Minimal single-arbiter USDC escrow for the TrustMule P2P crowdshipping app.
///         Buyer deposits (item price + service fee); funds release to the traveler on
///         confirmed handoff, or refund to the buyer via the arbiter on dispute.
/// @dev    Audit before holding real funds. Add timeouts, dual-deposit staking, and
///         dispute policy for production.
contract USDCescrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public immutable arbiter;

    struct Deal {
        address depositor;
        address beneficiary;
        uint256 amount; // USDC base units (6 decimals)
        bool deposited;
        bool released;
        bool refunded;
    }

    mapping(bytes32 => Deal) public deals;

    event Deposited(bytes32 indexed id, address indexed depositor, address indexed beneficiary, uint256 amount);
    event Released(bytes32 indexed id, address indexed beneficiary, uint256 amount);
    event Refunded(bytes32 indexed id, address indexed depositor, uint256 amount);

    modifier exists(bytes32 id) {
        require(deals[id].depositor != address(0), "unknown deal");
        _;
    }

    constructor(address usdc_, address arbiter_) {
        require(usdc_ != address(0) && arbiter_ != address(0), "zero address");
        usdc = IERC20(usdc_);
        arbiter = arbiter_;
    }

    function createDeal(bytes32 id, address beneficiary, uint256 amount) external {
        require(id != bytes32(0) && beneficiary != address(0), "invalid deal");
        require(amount > 0 && deals[id].depositor == address(0), "invalid amount/id");
        deals[id] = Deal(msg.sender, beneficiary, amount, false, false, false);
    }

    function deposit(bytes32 id) external nonReentrant exists(id) {
        Deal storage d = deals[id];
        require(msg.sender == d.depositor && !d.deposited, "not depositor/state");
        d.deposited = true;
        usdc.safeTransferFrom(msg.sender, address(this), d.amount);
        emit Deposited(id, msg.sender, d.beneficiary, d.amount);
    }

    function release(bytes32 id) external nonReentrant exists(id) {
        Deal storage d = deals[id];
        require(msg.sender == d.depositor || msg.sender == arbiter, "not authorized");
        require(d.deposited && !d.released && !d.refunded, "invalid state");
        d.released = true;
        usdc.safeTransfer(d.beneficiary, d.amount);
        emit Released(id, d.beneficiary, d.amount);
    }

    function refund(bytes32 id) external nonReentrant exists(id) {
        Deal storage d = deals[id];
        require(msg.sender == arbiter, "not arbiter");
        require(d.deposited && !d.released && !d.refunded, "invalid state");
        d.refunded = true;
        usdc.safeTransfer(d.depositor, d.amount);
        emit Refunded(id, d.depositor, d.amount);
    }

    function getDeal(bytes32 id) external view returns (Deal memory) {
        return deals[id];
    }
}
