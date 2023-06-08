const hre = require("hardhat");
const {
  getAmountInWei,
  developmentChains,
} = require("../utils/helper-scripts");

async function main() {
  const deployNetwork = hre.network.name;
  // Deploy FlappyOwl NFT contract
  const maxSupply = 69069;
  const mintCost = getAmountInWei(0.5);
  const maxMintAmountPerTx = 10;
  const mintLimit = 10;
  const mintingStatus = true;
  const updatableSeed = true;
  const descriptorContract = "0xe047ac1FEe933F7A3f2773838a17e38328548E4F";

  const NFTContract = await ethers.getContractFactory("FlappyOwlNft");
  const nftContract = await NFTContract.deploy(
    mintingStatus,
    updatableSeed,
    mintCost,
    maxSupply,
    maxMintAmountPerTx,
    mintLimit,
    descriptorContract
  );
  await nftContract.deployed();

  console.log("FlappyOwl NFT contract deployed at:\n", nftContract.address);
  console.log("Network deployed to :\n", deployNetwork);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
