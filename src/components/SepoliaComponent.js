import React, { useState } from "react";
import { ethers } from "ethers";

const fakeUSDAddress = "0xYourFakeUSDContractAddress"; // Replace with the actual address of your fakeUSD contract

const fakeUSDABI = [
    "function mint(address to, uint256 amount) public",
    "function balanceOf(address account) public view returns (uint256)",
];

const SepoliaComponent = ({ signer }) => {
    const [minting, setMinting] = useState(false);
    const [fakeUSDBalance, setFakeUSDBalance] = useState(null);

    const mintFakeUSD = async (address, amount) => {
        setMinting(true);
        try {
            const contract = new ethers.Contract(
                fakeUSDAddress,
                fakeUSDABI,
                signer
            );
            const tx = await contract.mint(
                address,
                ethers.parseUnits(amount, 18)
            );
            await tx.wait();
            alert(`Minted ${amount} fakeUSD to ${address}`);
            const balance = await contract.balanceOf(address);
            setFakeUSDBalance(ethers.formatUnits(balance, 18));
        } catch (error) {
            console.error("Failed to mint fakeUSD:", error);
            alert("Failed to mint fakeUSD.");
        } finally {
            setMinting(false);
        }
    };

    const checkFakeUSDBalance = async () => {
        try {
            const contract = new ethers.Contract(
                fakeUSDAddress,
                fakeUSDABI,
                signer
            );
            const balance = await contract.balanceOf(await signer.getAddress());
            setFakeUSDBalance(ethers.formatUnits(balance, 18));
        } catch (error) {
            console.error("Failed to check fakeUSD balance:", error);
        }
    };

    return (
        <div>
            <h2>Sepolia Network</h2>
            <button
                onClick={() => mintFakeUSD(signer.getAddress(), "100")}
                disabled={minting}
            >
                {minting ? "Minting..." : "Mint 100 fakeUSD"}
            </button>
            <button onClick={checkFakeUSDBalance}>Check fakeUSD Balance</button>
            {fakeUSDBalance !== null && (
                <p>Your fakeUSD balance: {fakeUSDBalance}</p>
            )}
            {fakeUSDBalance !== null && fakeUSDBalance > 1000000 && (
                <p>You are fake rich!</p>
            )}
            <p>
                <a
                    href="https://faucets.chain.link/sepolia"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Get Sepolia ETH from Faucet
                </a>
            </p>
        </div>
    );
};

export default SepoliaComponent;
