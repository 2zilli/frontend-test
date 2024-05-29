import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import SepoliaComponent from "./SepoliaComponent";
import MainnetComponent from "./MainnetComponent";

const Home = () => {
    const [provider, setProvider] = useState(null);
    const [account, setAccount] = useState("");
    const [userAddress, setUserAddress] = useState("");
    const [signer, setSigner] = useState(null);
    const [networkId, setNetworkId] = useState(null);
    const [networkName, setNetworkName] = useState("");
    const [blockNumber, setBlockNumber] = useState(null);
    const [balance, setBalance] = useState(null);
    const [connecting, setConnecting] = useState(false);
    const [networkSwitchInProgress, setNetworkSwitchInProgress] =
        useState(false);

    useEffect(() => {
        if (typeof window.ethereum !== "undefined") {
            console.log("Ethereum provider detected");
            const initialProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(initialProvider);
            checkConnection(initialProvider);

            // Add event listener for network changes
            window.ethereum.on("chainChanged", handleNetworkChange);

            // Add event listener for account changes
            window.ethereum.on("accountsChanged", handleAccountsChanged);
        } else {
            console.log("No Ethereum provider detected");
            alert(
                "MetaMask is not installed. Please install MetaMask to use this feature."
            );
        }

        return () => {
            // Cleanup event listeners on component unmount
            if (window.ethereum) {
                window.ethereum.removeListener(
                    "chainChanged",
                    handleNetworkChange
                );
                window.ethereum.removeListener(
                    "accountsChanged",
                    handleAccountsChanged
                );
            }
        };
    }, []);

    const handleNetworkChange = () => {
        console.log("Network changed, re-creating provider...");
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(newProvider);
        checkConnection(newProvider);
    };

    const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
            console.log("Account changed, updating information...");
            checkConnection(provider);
        } else {
            console.log("No accounts found");
            setUserAddress("");
            setSigner(null);
            setBalance(null);
        }
    };

    const checkConnection = async (provider) => {
        try {
            console.log("Checking connection...");
            const accounts = await provider.send("eth_accounts", []);
            console.log("Accounts:", accounts);
            if (accounts.length > 0) {
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                const network = await provider.getNetwork();
                const blockNumber = await provider.getBlockNumber();
                const balance = await provider.getBalance(address);

                setSigner(signer);
                setUserAddress(address);
                setNetworkId(network.chainId.toString());
                setNetworkName(network.name);
                setBlockNumber(blockNumber);
                setBalance(ethers.formatEther(balance));

                console.log("Signer:", signer);
                console.log("User Address:", address);
                console.log("Network ID:", network.chainId);
                console.log("Network Name:", network.name);
                console.log("Block Number:", blockNumber);
                console.log("Balance:", ethers.formatEther(balance));
            } else {
                console.log("No accounts found");
            }
        } catch (error) {
            console.error(
                "An error occurred while checking the connection:",
                error
            );
        }
    };

    const connectWallet = async () => {
        if (!provider) {
            console.log("No provider available");
            alert("Please install MetaMask!");
            return;
        }

        if (connecting) {
            console.log("Already connecting");
            return;
        }

        setConnecting(true);
        try {
            console.log("Requesting account access...");
            await provider.send("eth_requestAccounts", []);
            console.log("Account access granted");
            checkConnection(provider);
        } catch (error) {
            console.error(
                "An error occurred while connecting the wallet:",
                error
            );
        } finally {
            setConnecting(false);
        }
    };

    const switchNetwork = async (chainId) => {
        setNetworkSwitchInProgress(true);
        try {
            let hexChainId;
            if (chainId === 1) {
                hexChainId = "0x1"; // Mainnet
            } else if (chainId === 11155111) {
                hexChainId = "0xaa36a7"; // Sepolia
            }
            console.log("Switching network to:", hexChainId);
            await provider.send("wallet_switchEthereumChain", [
                { chainId: hexChainId },
            ]);
            console.log("Switched network");
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(newProvider);
            checkConnection(newProvider);
            setNetworkSwitchInProgress(false);
        } catch (switchError) {
            console.error("Failed to switch network:", switchError);
            setNetworkSwitchInProgress(false);
        }
    };

    const buttonStyle = {
        margin: "10px",
        padding: "10px 20px",
        fontSize: "16px",
        cursor: "pointer",
    };

    const containerStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        height: "100vh",
        padding: "20px",
    };

    return (
        <div style={containerStyle}>
            <h1>dex-api-test</h1>
            {!userAddress ? (
                <button
                    style={buttonStyle}
                    onClick={connectWallet}
                    disabled={connecting}
                >
                    {connecting ? "Connecting..." : "Connect Wallet"}
                </button>
            ) : (
                <>
                    <p>Connected Address: {userAddress}</p>
                    <p>Network ID: {networkId}</p>
                    <p>Network Name: {networkName}</p>
                    <p>Block Number: {blockNumber}</p>
                    <p>Balance: {balance} ETH</p>
                    <div>
                        <button
                            style={buttonStyle}
                            onClick={() => switchNetwork(1)}
                            disabled={
                                networkSwitchInProgress || networkId === "1"
                            }
                        >
                            Switch to Mainnet
                        </button>
                        <button
                            style={buttonStyle}
                            onClick={() => switchNetwork(11155111)}
                            disabled={
                                networkSwitchInProgress ||
                                networkId === "11155111"
                            }
                        >
                            Switch to Sepolia
                        </button>
                    </div>
                    {networkId === "1" ? (
                        <MainnetComponent provider={provider} />
                    ) : networkId === "11155111" ? (
                        <SepoliaComponent signer={signer} />
                    ) : (
                        <p>Please switch to Mainnet or Sepolia.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default Home;
