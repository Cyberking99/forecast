// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SessionKeyModule
/// @notice On-chain registry for ERC-7715 session key scopes (MetaMask Smart Accounts Kit).
/// Spend permissions are enforced off-chain by the smart account; this contract documents
/// allowed targets for indexers and relayers.
contract SessionKeyModule {
    struct SpendPermission {
        address token;
        uint256 allowance;
        uint256 validUntil;
        address targetContract;
        bytes4 targetSelector;
    }

    mapping(address => mapping(bytes32 => SpendPermission)) public permissions;

    event PermissionRegistered(
        address indexed account,
        bytes32 indexed permissionId,
        address token,
        uint256 allowance,
        uint256 validUntil,
        address targetContract,
        bytes4 targetSelector
    );

    /// @dev selector for stake(bytes32,uint8,uint256)
    bytes4 public constant STAKE_SELECTOR = bytes4(keccak256("stake(bytes32,uint8,uint256)"));

    function registerPermission(
        bytes32 permissionId,
        address token,
        uint256 allowance,
        uint256 validUntil,
        address targetContract,
        bytes4 targetSelector
    ) external {
        require(token != address(0), "SessionKeyModule: zero token");
        require(targetContract != address(0), "SessionKeyModule: zero target");
        require(validUntil > block.timestamp, "SessionKeyModule: expired");

        permissions[msg.sender][permissionId] = SpendPermission({
            token: token,
            allowance: allowance,
            validUntil: validUntil,
            targetContract: targetContract,
            targetSelector: targetSelector
        });

        emit PermissionRegistered(
            msg.sender, permissionId, token, allowance, validUntil, targetContract, targetSelector
        );
    }
}
