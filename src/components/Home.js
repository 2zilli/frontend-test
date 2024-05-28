import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

const Home = () => {
    const [provider, setProvider] = useState(null);
    const [account, setAccount] = useState("");
    const [userAddress, setUserAddress] = useState("");
    const [signer, setSigner] = useState(null);
    const [networkId, setNetworkId] = useState(null);
    const [networkName, setNetworkName] = useState("");
    const [blockNumber, setBlockNumber] = useState(null);
    const [contractData, setContractData] = useState(null);
    const [connecting, setConnecting] = useState(false);
    const [isEthereumMainnet, setIsEthereumMainnet] = useState(true);
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
        } else {
            console.log("No Ethereum provider detected");
            alert(
                "MetaMask is not installed. Please install MetaMask to use this feature."
            );
        }

        return () => {
            // Cleanup event listener on component unmount
            if (window.ethereum) {
                window.ethereum.removeListener(
                    "chainChanged",
                    handleNetworkChange
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

                setSigner(signer);
                setUserAddress(address);
                setNetworkId(network.chainId.toString()); // Convert to string
                setNetworkName(network.name);
                setBlockNumber(blockNumber);

                console.log("Signer:", signer);
                console.log("User Address:", address);
                console.log("Network ID:", network.chainId);
                console.log("Network Name:", network.name);
                console.log("Block Number:", blockNumber);

                if (network.chainId !== 1n) {
                    // 1 is the chain ID for Ethereum Mainnet
                    setIsEthereumMainnet(false);
                } else {
                    setIsEthereumMainnet(true);
                }
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

    const switchToEthereumMainnet = async () => {
        setNetworkSwitchInProgress(true);
        try {
            await provider.send("wallet_switchEthereumChain", [
                { chainId: "0x1" },
            ]); // 0x1 is the chain ID for Ethereum Mainnet
            console.log("Switched to Ethereum Mainnet");
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(newProvider);
            checkConnection(newProvider);
            setNetworkSwitchInProgress(false);
        } catch (switchError) {
            console.error("Failed to switch to Ethereum Mainnet:", switchError);
            setNetworkSwitchInProgress(false);
        }
    };

    const fetchContractData = async () => {
        if (!provider || !signer) {
            console.log("Provider or signer not available");
            alert("Please connect your wallet first.");
            return;
        }

        const contractAddress = "0xYourSmartContractAddress";
        const contractABI = [
            // Replace with your contract's ABI
        ];

        try {
            console.log("Fetching contract data...");
            const contract = new ethers.Contract(
                contractAddress,
                contractABI,
                signer
            );
            const data = await contract.yourMethodName(); // Replace 'yourMethodName' with the actual method
            console.log("Contract data:", data);
            setContractData(data);
        } catch (error) {
            console.error(
                "An error occurred while fetching the contract data:",
                error
            );
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
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
    };

    return (
        <div style={containerStyle}>
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
                    {isEthereumMainnet ? (
                        <>
                            <p>Connected Address: {userAddress}</p>
                            <p>Network ID: {networkId}</p>
                            <p>Network Name: {networkName}</p>
                            <p>Block Number: {blockNumber}</p>
                            <button
                                style={buttonStyle}
                                onClick={fetchContractData}
                            >
                                Fetch Contract Data
                            </button>
                        </>
                    ) : (
                        <>
                            <p>
                                You are connected to the wrong network. Please
                                switch to the Ethereum mainnet.
                            </p>
                            <button
                                style={buttonStyle}
                                onClick={switchToEthereumMainnet}
                                disabled={networkSwitchInProgress}
                            >
                                {networkSwitchInProgress
                                    ? "Switching..."
                                    : "Switch to Ethereum Mainnet"}
                            </button>
                        </>
                    )}
                </>
            )}
            {contractData && <pre>{JSON.stringify(contractData, null, 2)}</pre>}
        </div>
    );
};

export default Home;
