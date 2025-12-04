import { useState, useEffect, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { validatorBondABI, VALIDATOR_BOND_CONTRACT_ADDRESS } from "../abis/validatorBondABI";
import { erc20abi } from "../abis/erc20ABI";
import { parseUnits } from "viem";

// USDC contract address on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

export interface Validator {
    address: string;
    moniker: string;
    dns: string;
    status: "active" | "inactive" | "jailed" | "unbonding";
    stakedAmount: string;
    sslEnabled: boolean;
    uptime: number;
    createdAt?: string;
}

interface UseValidatorsReturn {
    validators: Validator[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Hook to fetch validators from the Cosmos staking module
 */
export function useValidators(): UseValidatorsReturn {
    const [validators, setValidators] = useState<Validator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchValidators = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch from Cosmos staking module REST API
            const rpcUrl = import.meta.env.VITE_COSMOS_REST_URL || "https://rest.pokerchain.io";
            const response = await fetch(`${rpcUrl}/cosmos/staking/v1beta1/validators`);

            if (!response.ok) {
                throw new Error(`Failed to fetch validators: ${response.statusText}`);
            }

            const data = await response.json();

            // Transform Cosmos validator data to our format
            const transformedValidators: Validator[] = (data.validators || []).map((v: any) => ({
                address: v.operator_address || v.address,
                moniker: v.description?.moniker || "Unknown",
                dns: v.description?.website || "",
                status: mapCosmosStatus(v.status),
                stakedAmount: formatStakedAmount(v.tokens),
                sslEnabled: v.description?.website?.startsWith("https") || false,
                uptime: calculateUptime(v),
                createdAt: v.unbonding_time,
            }));

            setValidators(transformedValidators);
        } catch (err: any) {
            console.error("Error fetching validators:", err);
            setError(err.message || "Failed to fetch validators");

            // Set mock data for development
            if (import.meta.env.DEV) {
                setValidators(getMockValidators());
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchValidators();
    }, [fetchValidators]);

    return {
        validators,
        isLoading,
        error,
        refetch: fetchValidators,
    };
}

interface DeployValidatorParams {
    dns: string;
    sslEnabled: boolean;
    deployExecutionLayer: boolean;
    bondAmount: number;
    moniker?: string;
    walletAddress: string;
}

interface UseDeployValidatorReturn {
    deployValidator: (params: DeployValidatorParams) => Promise<string>;
    isDeploying: boolean;
    error: string | null;
}

/**
 * Hook to deploy a new validator with USDC bonding
 */
export function useDeployValidator(): UseDeployValidatorReturn {
    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { writeContractAsync: writeApprove } = useWriteContract();
    const { writeContractAsync: writeBond } = useWriteContract();

    const deployValidator = async (params: DeployValidatorParams): Promise<string> => {
        setIsDeploying(true);
        setError(null);

        try {
            const bondAmountWei = parseUnits(params.bondAmount.toString(), USDC_DECIMALS);

            // Step 1: Approve USDC spending
            console.log("Approving USDC spending...");
            const approveTx = await writeApprove({
                address: USDC_ADDRESS,
                abi: erc20abi,
                functionName: "approve",
                args: [VALIDATOR_BOND_CONTRACT_ADDRESS, bondAmountWei],
            });

            console.log("Approval tx:", approveTx);

            // Step 2: Bond USDC to validator contract
            console.log("Bonding USDC to validator contract...");
            const bondTx = await writeBond({
                address: VALIDATOR_BOND_CONTRACT_ADDRESS,
                abi: validatorBondABI,
                functionName: "bond",
                args: [
                    bondAmountWei,
                    params.dns,
                    params.moniker || "",
                    params.sslEnabled,
                    params.deployExecutionLayer,
                ],
            });

            console.log("Bond tx:", bondTx);

            return bondTx;
        } catch (err: any) {
            console.error("Error deploying validator:", err);
            const errorMessage = err.shortMessage || err.message || "Failed to deploy validator";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsDeploying(false);
        }
    };

    return {
        deployValidator,
        isDeploying,
        error,
    };
}

// Helper functions

function mapCosmosStatus(status: string): Validator["status"] {
    switch (status) {
        case "BOND_STATUS_BONDED":
            return "active";
        case "BOND_STATUS_UNBONDING":
            return "unbonding";
        case "BOND_STATUS_UNBONDED":
            return "inactive";
        default:
            return "inactive";
    }
}

function formatStakedAmount(tokens: string): string {
    if (!tokens) return "0";
    // Assuming tokens are in micro units (6 decimals)
    const amount = parseFloat(tokens) / 1_000_000;
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateUptime(validator: any): number {
    // In a real implementation, this would be calculated from missed blocks
    // For now, return a placeholder based on status
    if (validator.jailed) return 0;
    if (validator.status === "BOND_STATUS_BONDED") return 99.5;
    return 95;
}

function getMockValidators(): Validator[] {
    return [
        {
            address: "pokervaloper1abc123...",
            moniker: "Block52 Validator",
            dns: "validator1.pokerchain.io",
            status: "active",
            stakedAmount: "10,000.00",
            sslEnabled: true,
            uptime: 99.9,
        },
        {
            address: "pokervaloper1def456...",
            moniker: "PokerNode Alpha",
            dns: "alpha.pokernodes.com",
            status: "active",
            stakedAmount: "5,000.00",
            sslEnabled: true,
            uptime: 98.5,
        },
        {
            address: "pokervaloper1ghi789...",
            moniker: "Staking Hub",
            dns: "stakinghub.io",
            status: "unbonding",
            stakedAmount: "2,500.00",
            sslEnabled: false,
            uptime: 85.2,
        },
    ];
}
