import React, { useState, useEffect } from "react";
import "../assets/styles.css";
import image1 from "../assets/img/min-page-rabit.svg";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { useSelector } from "react-redux";
import { ethers } from "ethers";
import axios from "axios";
import { Table } from "react-bootstrap";
import { CircularProgress } from "@mui/material";

import stakingContract from "../artifacts/utils/RabbitBounchingStakingVault.sol/RabbitBounchingStakingVault.json";
import nftContract from "../artifacts/ERC721/RabbitBounching.sol/RabbitBounching.json";
import {
  stakingContractAddress,
  nftContractAddress,
  ownerAddress,
  networkDeployedTo,
} from "../utils/contracts-config";
import networksMap from "../utils/networksMap.json";

function MintPage() {
  const data = useSelector((state) => state.blockchain.value);

  const [mintAmount, setMintAmount] = useState(1);
  const [userNfts, setUserNfts] = useState([]);
  const [info, setInfo] = useState({
    currentSupply: 0,
    maxSupply: 0,
    maxMintAmountPerTx: 0,
    nftUserBalance: 0,
    mintCost: 0,
    paused: false,
    userNftIds: [],
    stakedNftIds: [],
    totalReward: 0,
  });
  const [loading, setLoading] = useState(false);

  const getInfo = async () => {
    // console.log("getInfo");
    if (data.network === networksMap[networkDeployedTo]) {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );

      const nft_contract = new ethers.Contract(
        nftContractAddress,
        nftContract.abi,
        provider
      );

      const staking_contract = new ethers.Contract(
        stakingContractAddress,
        stakingContract.abi,
        provider
      );

      const signer = provider.getSigner();
      const user = await signer.getAddress();

      const stakedTokens = await staking_contract.tokensOfOwner(user);
      const reward = await staking_contract.getTotalRewardEarned(user);
      const paused = await nft_contract.mintingStatus();

      var userTokens = [];
      const maxMintAmountPerTx = await nft_contract.maxMintAmountPerTx();
      const cost = await nft_contract.mintCost();
      const nftUserBalance = await nft_contract.balanceOf(user);
      for (var i = 0; i < nftUserBalance; i++) {
        userTokens[i] = await nft_contract.tokenOfOwnerByIndex(user, i);
      }
      // const tokenURI = await contract.methods.tokenURI(tokenId);
      // const baseExtension = "";
      // //   const baseExtension = await nft_contract.baseExtension();
      const totalSupply = await nft_contract.totalSupply();
      const mintCount = await nft_contract.getmintCount();
      const maxSupply = await nft_contract.maxSupply();
      userTokens = userTokens.concat(stakedTokens).sort();
      console.log("nftUser:" + userTokens);

      setInfo({
        nftName: "Rabbit Bounching Nft",
        nftSymbol: "(x.x)",
        nftUserBalance: nftUserBalance,
        currentSupply: Number(totalSupply),
        maxSupply: Number(maxSupply),
        maxMintAmountPerTx: Number(maxMintAmountPerTx),
        mintCost: Number(ethers.utils.formatUnits(cost, "ether")),
        paused: paused,
        userNftIds: userTokens,
        stakedNftIds: stakedTokens,
        totalReward: Number(ethers.utils.formatUnits(reward, "ether")),
      });

      const _userNfts = await Promise.all(
        userTokens.map(async (nft) => {
          const dataURI = await nft_contract.tokenURI(nft);
          const metadata = atob(dataURI.substring(29));
          const typeOF = typeof metadata;
          // const jsonMetadata = JSON.stringify(metadata);
          const jsonMetadata = JSON.parse(metadata);
          const imgURI = jsonMetadata.image;
          return {
            id: nft,
            uri: imgURI,
            nftName: jsonMetadata.name,
          };
          // return jsonMetadata;
        })
      );

      setUserNfts(_userNfts);
    }
  };

  const mint = async () => {
    console.log("mint");
    if (
      data.network === networksMap[networkDeployedTo] &&
      info.paused == true
    ) {
      try {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        const signer = provider.getSigner();
        const nft_contract = new ethers.Contract(
          nftContractAddress,
          nftContract.abi,
          signer
        );
        if (data.account === ownerAddress) {
          const mint_tx = await nft_contract.mint(mintAmount);
          await mint_tx.wait();
        } else {
          const totalMintCost = ethers.utils.parseEther(
            String(info.mintCost * mintAmount),
            "ether"
          );
          const mint_tx = await nft_contract.mint(mintAmount, {
            value: totalMintCost,
          });
          await mint_tx.wait();
        }
        setLoading(false);
        getInfo();
      } catch (error) {
        setLoading(false);
        window.alert("An error has occured, Please Try Again");
        console.log(error);
      }
    }
  };

  const stakeItem = async (id) => {
    console.log("stakeItem");
    if (data.network === networksMap[networkDeployedTo]) {
      console.log([id]);
      try {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        const signer = provider.getSigner();
        const nft_contract = new ethers.Contract(
          nftContractAddress,
          nftContract.abi,
          signer
        );
        const staking_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );

        const approve_tx = await nft_contract.approve(
          stakingContractAddress,
          id
        );
        await approve_tx.wait();

        console.log([id]);
        const stake_tx = await staking_contract.stake([id]);
        await stake_tx.wait();

        setLoading(false);
        getInfo();
      } catch (error) {
        setLoading(false);
        window.alert("An error has occured, Please Try Again");
        console.log(error);
      }
    }
  };

  const unstakeItem = async (id) => {
    console.log("unstakeItem");
    if (data.network === networksMap[networkDeployedTo]) {
      try {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        const signer = provider.getSigner();
        const staking_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );

        const unstake_tx = await staking_contract.unstake([id]);
        await unstake_tx.wait();

        setLoading(false);
        getInfo();
      } catch (error) {
        setLoading(false);
        window.alert("An error has occured, Please Try Again");
        console.log(error);
      }
    }
  };

  const unstakeAll = async () => {
    console.log("unstakeAll");
    if (data.network === networksMap[networkDeployedTo]) {
      try {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        const signer = provider.getSigner();
        const staking_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );

        const unstake_tx = await staking_contract.unstake(info.stakedNftIds);
        await unstake_tx.wait();

        setLoading(false);
        getInfo();
      } catch (error) {
        setLoading(false);
        window.alert("An error has occured, Please Try Again");
        console.log(error);
      }
    }
  };

  const claim = async () => {
    if (data.network === networksMap[networkDeployedTo]) {
      try {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        const signer = provider.getSigner();
        const staking_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );

        const claim_tx = await staking_contract.claim(info.stakedNftIds);
        await claim_tx.wait();

        setLoading(false);
        getInfo();
      } catch (error) {
        setLoading(false);
        window.alert("An error has occured, Please Try Again");
        console.log(error);
      }
    }
    console.log("claim");
  };

  useEffect(() => {
    getInfo();
    console.log(data);
  }, [data.account]);

  return (
    <section>
      <NavBar />
      <br />
      <section className="claim" id="claim">
        <div className="roadmap-container">
          <div className="info-container">
            <h3 className="text-center p-2">Minting Info</h3>
            <Table responsive>
              <tbody>
                {/* <tr>
                  <td className="p-2">Nft</td>
                  <td>{info.nftName}</td>
                </tr>
                <tr>
                  <td className="p-2">Symbol</td>
                  <td>{info.nftSymbol}</td>
                </tr> */}
                <tr>
                  <td className="p-2">Minted / Max Supply</td>
                  <td>
                    {info.currentSupply}/{info.maxSupply}
                  </td>
                </tr>
                <tr>
                  <td className="p-2">Minted NFT Count</td>
                  <td>{info.currentSupply}</td>
                </tr>
                <tr>
                  <td className="p-2">Mint Cost</td>
                  <td>{info.mintCost} ETH</td>
                </tr>
                <tr>
                  <td className="p-2">Max Mint Amount Per TX </td>
                  <td>{info.maxMintAmountPerTx} </td>
                </tr>
              </tbody>
            </Table>
          </div>
          <div className="info-container">
            <h3 className="text-center p-2">Staking Info</h3>
            <Table responsive>
              <tbody>
                <tr>
                  <td className="p-2">Your {info.nftName}s </td>
                  <td>[{info.userNftIds.join(" ")}]</td>
                </tr>
                <tr>
                  <td className="p-2">Items Count</td>
                  <td>{info.userNftIds.length}</td>
                </tr>
                <tr>
                  <td className="p-2">Items Staked</td>
                  <td>[{info.stakedNftIds.join(" ")}]</td>
                </tr>
                <tr>
                  <td className="p-2">Earned Reward</td>
                  <td>
                    {info.totalReward !== 0
                      ? parseFloat(info.totalReward).toFixed(6)
                      : 0}{" "}
                    $RBT
                  </td>
                </tr>
              </tbody>
            </Table>
            <div style={{ textAlign: "center" }}>
              <button className="btn btn-info m-3" src="" onClick={claim}>
                {loading ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  "Claim"
                )}
              </button>
              <button className="btn btn-info m-3" src="" onClick={unstakeAll}>
                {loading ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  "Unstake All"
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="roadmap-container">
          <div className="mint-container">
            <div className="row" style={{ justifyContent: "center" }}>
              <div className="col-md-7">
                <div className="text-center">
                  <h2 className="minttitle title">Claim Your {info.nftName}</h2>
                  <img src={image1} className="mint-img" alt="" />
                  <p className="lead" style={{ marginBottom: "30px" }}>
                    A {info.nftName} is fully onchain NTFs, no IPFS or any
                    external storage. Olny code (x.x).
                  </p>
                  <div className="form-group">
                    <div className="d-flex justify-content-center">
                      <button
                        type="button"
                        className="minus btn btn-info rounded-circle"
                        disabled={mintAmount === 1}
                        onClick={() => {
                          setMintAmount(mintAmount - 1);
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="mintnum text-center"
                        readOnly
                        value={mintAmount}
                      />
                      <button
                        type="button"
                        className="plus btn btn-info rounded-circle"
                        disabled={
                          mintAmount ===
                          info.maxMintAmountPerTx - info.nftUserBalance
                        }
                        onClick={() => {
                          setMintAmount(mintAmount + 1);
                        }}
                      >
                        +
                      </button>
                    </div>
                    <div>
                      <button className="btn btn-info mt-3" onClick={mint}>
                        {loading ? (
                          <CircularProgress color="inherit" size={18} />
                        ) : (
                          "MINT"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="my-items">
        {userNfts.length !== 0 ? (
          <>
            <h2 className="minttitle title text-center">My {info.nftName}s</h2>
            <div className="items container">
              {userNfts.map((nft, index) => {
                return (
                  <div className="item-box" key={index}>
                    <img src={nft.uri} className="item-img" />
                    <div className="text-center">
                      <div>
                        <h5>{nft.nftName}</h5> <span></span>
                      </div>
                      {info.stakedNftIds.includes(nft.id) ? (
                        <button
                          className="btn btn-info m-3"
                          role="button"
                          onClick={() => {
                            unstakeItem(nft.id);
                          }}
                        >
                          {loading ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : (
                            "UNSTAKE"
                          )}
                        </button>
                      ) : (
                        <button
                          className="btn btn-info m-3"
                          role="button"
                          onClick={() => {
                            stakeItem(nft.id);
                          }}
                        >
                          {loading ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : (
                            "STAKE"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </section>
      <Footer />
    </section>
  );
}

export default MintPage;
