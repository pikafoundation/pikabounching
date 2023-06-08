// SPDX-License-Identifier: MIT
/*
 * ** author  : floorprice.lab
 * ** package : @contracts/ERC721/PikaBounching.sol
 */
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "../interfaces/IFODescriptor.sol";

contract PikaBounchingNft is ERC721Enumerable, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private supply;

    event SeedUpdated(uint256 indexed tokenId, uint256 seed);
    mapping(uint256 => uint256) internal seeds;
    mapping(address => uint256) public mintCount;

    IFODescriptor public descriptor;
    uint256 public mintCost;
    uint256 public immutable maxSupply;
    uint256 public maxMintAmountPerTx;
    uint256 mintLimit;
    bool public mintingStatus;
    bool public updatableSeed;
    address public beneficiaryAddr;

    constructor(
        bool _minting,
        bool _updatableSeed,
        uint256 _mintCost,
        uint256 _maxSupply,
        uint256 _maxMintAmountPerTx,
        uint256 _mintLimit,
        IFODescriptor newDescriptor
    ) ERC721("Pika Bounching Nft", "o.O") {
        mintingStatus = _minting;
        updatableSeed = _updatableSeed;
        mintCost = _mintCost;
        maxSupply = _maxSupply;
        maxMintAmountPerTx = _maxMintAmountPerTx;
        mintLimit = _mintLimit;
        beneficiaryAddr = owner();
        descriptor = newDescriptor;
    }

    modifier mintRequire(uint256 _mintAmount) {
        require(
            _mintAmount > 0 && _mintAmount <= maxMintAmountPerTx,
            "Invalid mint amount!"
        );
        require(
            supply.current() + _mintAmount <= maxSupply,
            "Will exceed maximum supply!"
        );
        _;
    }

    function mint(uint256 _mintAmount) public payable mintRequire(_mintAmount) {
        require(mintingStatus, "Minting function is disabled.");
        require(msg.value >= mintCost * _mintAmount, "Insufficient funds!");
        require(
            mintCount[msg.sender] + _mintAmount <= mintLimit,
            "Public mint limit exceeded"
        );

        _mintLoop(msg.sender, _mintAmount);
        mintCount[msg.sender] += _mintAmount;
    }

    function _mintLoop(address _receiver, uint256 _mintAmount) internal {
        for (uint256 i; i < _mintAmount; i++) {
            uint256 nextTokenId = totalSupply() + 1;
            seeds[nextTokenId] = generateSeed(nextTokenId);
            _mint(_receiver, nextTokenId);
            supply.increment();
        }
        if (address(this).balance > 0) {
            payable(beneficiaryAddr).transfer(address(this).balance);
        }
    }

    function getmintCount() public view returns (uint256) {
        return mintCount[msg.sender];
    }

    function setMinting(bool value) external onlyOwner {
        mintingStatus = value;
    }

    function setDescriptor(IFODescriptor newDescriptor) external onlyOwner {
        descriptor = newDescriptor;
    }

    function updateSeed(uint256 tokenId, uint256 seed) external onlyOwner {
        require(updatableSeed, "Cannot set the seed");
        seeds[tokenId] = seed;
        emit SeedUpdated(tokenId, seed);
    }

    function disableSeedUpdate() external onlyOwner {
        updatableSeed = false;
    }

    function burn(uint256 tokenId) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "Not approved to burn."
        );
        delete seeds[tokenId];
        _burn(tokenId);
    }

    function getSeed(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token ID does not exist.");
        return seeds[tokenId];
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_exists(tokenId), "Token ID does not exist.");
        uint256 seed = seeds[tokenId];
        return descriptor.tokenURI(tokenId, seed);
    }

    function totalSupply() public view override returns (uint256) {
        return supply.current();
    }

    function generateSeed(uint256 tokenId) private view returns (uint256) {
        uint256 r = random(tokenId);
        uint256 headSeed = 100 * ((r % 7) + 10) + (((r >> 48) % 20) + 10);
        uint256 faceSeed = 100 *
            (((r >> 96) % 6) + 10) +
            (((r >> 96) % 20) + 10);
        uint256 bodySeed = 100 *
            (((r >> 144) % 7) + 10) +
            (((r >> 144) % 20) + 10);
        uint256 legsSeed = 100 *
            (((r >> 192) % 2) + 10) +
            (((r >> 192) % 20) + 10);
        return
            10000 *
            (10000 * (10000 * headSeed + faceSeed) + bodySeed) +
            legsSeed;
    }

    function random(
        uint256 tokenId
    ) private view returns (uint256 pseudoRandomness) {
        pseudoRandomness = uint256(
            keccak256(abi.encodePacked(blockhash(block.number - 1), tokenId))
        );

        return pseudoRandomness;
    }
}
