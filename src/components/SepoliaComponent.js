import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

const fakeUSDTokenAddress = "0xA3EcE94281a1B97b2cc06eA2Ad1ed3Bf48b50721";

const fakeUSDTokenABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function mint(address to, uint256 amount) external",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
];

const SepoliaComponent = ({ signer }) => {
    const [userAddress, setUserAddress] = useState("");
    const [balance, setBalance] = useState(null);
    const [decimals, setDecimals] = useState(18);
    const [symbol, setSymbol] = useState("FUSD");
    const [minting, setMinting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const address = await signer.getAddress();
            setUserAddress(address);

            const contract = new ethers.Contract(
                fakeUSDTokenAddress,
                fakeUSDTokenABI,
                signer
            );

            const balance = await contract.balanceOf(address);
            const decimals = await contract.decimals();
            const symbol = await contract.symbol();

            setBalance(ethers.formatUnits(balance, decimals));
            setDecimals(decimals);
            setSymbol(symbol);
        };

        fetchData();
    }, [signer]);

    const mintTokens = async () => {
        setMinting(true);
        try {
            const contract = new ethers.Contract(
                fakeUSDTokenAddress,
                fakeUSDTokenABI,
                signer
            );
            const mintAmount = ethers.parseUnits("1000", decimals);
            const tx = await contract.mint(userAddress, mintAmount);
            await tx.wait();

            const newBalance = await contract.balanceOf(userAddress);
            setBalance(ethers.formatUnits(newBalance, decimals));
        } catch (error) {
            console.error("Failed to mint tokens:", error);
        } finally {
            setMinting(false);
        }
    };

    return (
        <div>
            <h2>Sepolia Network</h2>
            <p>Connected Address: {userAddress}</p>
            <p>
                Balance: {balance} {symbol} (Fake USD Tokens)
            </p>
            <button onClick={mintTokens} disabled={minting}>
                {minting ? "Minting..." : "Mint 1000 Fake USD Tokens"}
            </button>
            <p>
                Fake USD Token Contract Address:{" "}
                <a
                    href={`https://sepolia.etherscan.io/address/${fakeUSDTokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {fakeUSDTokenAddress}
                </a>
            </p>
            <p>
                You can import the Fake USD Token to your MetaMask to see it
                there.
            </p>
            <p>
                Get Sepolia ETH from Faucet:{" "}
                <a
                    href="https://faucets.chain.link/sepolia"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Sepolia Faucet
                </a>
            </p>
            <p>
                Note: Remember to tick the "0.25 test ETH" option to get testnet
                ETH for the gas.
            </p>
        </div>
    );
};

export default SepoliaComponent;
