import React, { useState } from "react";
import { ethers } from "ethers";

const priceDecimals = 4n;

const uniswapV3PoolABI = [
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function liquidity() external view returns (uint128)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
];

const erc20ABI = [
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
];

const uniswapPoolAddress = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"; // WETH/USDC UniV3 Pool

const MainnetComponent = ({ provider }) => {
    const [poolInfo, setPoolInfo] = useState(null);
    const [token0Symbol, setToken0Symbol] = useState("");
    const [token1Symbol, setToken1Symbol] = useState("");
    const [token0Decimals, setToken0Decimals] = useState(null);
    const [token1Decimals, setToken1Decimals] = useState(null);
    const [price, setPrice] = useState(null);
    const [querying, setQuerying] = useState(false);

    const queryUniswapPool = async () => {
        setQuerying(true);
        try {
            const poolContract = new ethers.Contract(
                uniswapPoolAddress,
                uniswapV3PoolABI,
                provider
            );

            const [slot0, liquidity, token0Address, token1Address] =
                await Promise.all([
                    poolContract.slot0(),
                    poolContract.liquidity(),
                    poolContract.token0(),
                    poolContract.token1(),
                ]);

            const token0Contract = new ethers.Contract(
                token0Address,
                erc20ABI,
                provider
            );
            const token1Contract = new ethers.Contract(
                token1Address,
                erc20ABI,
                provider
            );

            const [symbol0, symbol1, decimals0, decimals1] = await Promise.all([
                token0Contract.symbol(),
                token1Contract.symbol(),
                token0Contract.decimals(),
                token1Contract.decimals(),
            ]);

            setToken0Symbol(symbol0);
            setToken1Symbol(symbol1);
            setToken0Decimals(decimals0);
            setToken1Decimals(decimals1);

            // Ensure sqrtPriceX96 is properly converted to a BigInt
            // eslint-disable-next-line no-undef
            const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96.toString());

            // eslint-disable-next-line no-undef
            const priceX96 = (sqrtPriceX96 ** 2n * BigInt(1e18)) / 2n ** 192n;

            const adjustedPrice =
                priceX96 /
                // eslint-disable-next-line no-undef
                (10n ** BigInt(decimals1) / 10n ** BigInt(decimals0));

            const finalPrice =
                // eslint-disable-next-line no-undef
                BigInt(10n ** (18n + priceDecimals)) / adjustedPrice;
            setPrice(finalPrice);

            const poolData = {
                sqrtPriceX96: slot0.sqrtPriceX96.toString(),
                tick: slot0.tick.toString(),
                liquidity: liquidity.toString(),
            };

            setPoolInfo(poolData);
        } catch (error) {
            console.error("Failed to query Uniswap pool:", error);
        } finally {
            setQuerying(false);
        }
    };

    return (
        <div>
            <h2>Mainnet Network</h2>
            <p>Pool Address: {uniswapPoolAddress}</p>
            <button onClick={queryUniswapPool} disabled={querying}>
                {querying ? "Querying..." : "Query Uniswap Pool"}
            </button>
            {poolInfo && (
                <div>
                    <p>
                        Token 0: {token0Symbol} Decimals: {token0Decimals}
                    </p>
                    <p>
                        Token 1: {token1Symbol} Decimals: {token1Decimals}
                    </p>
                    <pre>{JSON.stringify(poolInfo, null, 2)}</pre>
                    {price && (
                        <p>
                            {token1Symbol} Price:{" "}
                            {ethers.formatUnits(price, priceDecimals)}{" "}
                            {token0Symbol}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default MainnetComponent;
