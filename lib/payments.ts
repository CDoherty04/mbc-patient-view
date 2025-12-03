import axios from "axios";
import Constants from 'expo-constants';
import { createPublicClient, createWalletClient, encodeFunctionData, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji, sepolia } from "viem/chains";

// Helper function to get environment variable
export function getEnvVar(key: string): string | undefined {
  if (Constants.expoConfig?.extra?.[key]) {
    return Constants.expoConfig.extra[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) {
      return process.env[key];
    }
    const expoPublicKey = `EXPO_PUBLIC_${key}`;
    if (process.env[expoPublicKey]) {
      return process.env[expoPublicKey];
    }
  }
  return undefined;
}

// Contract Addresses (Testnet)
const ETHEREUM_SEPOLIA_USDC = "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238";
const ETHEREUM_SEPOLIA_TOKEN_MESSENGER =
  "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa";
const AVALANCHE_FUJI_MESSAGE_TRANSMITTER =
  "0xe737e5cebeeba77efe34d4aa090756590b1ce275";

// Chain-specific Parameters
const ETHEREUM_SEPOLIA_DOMAIN = 0; // Source domain ID for Ethereum Sepolia testnet
const AVALANCHE_FUJI_DOMAIN = 1; // Destination domain ID for Avalanche Fuji testnet

// CCTP API endpoint
const CCTP_API_URL = "https://iris-api-sandbox.circle.com/v2/messages";

// ============ Types ============

export interface PaymentRequest {
  tokenId: number;
  patientAddress: string;
  pharmacistAddress: string;
  amount: number;
  amountInSubunits: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  id?: string; // Unique identifier for the request
}

export interface USDCTransferParams {
  privateKey: string;
  destinationAddress: string;
  amount: bigint; // Amount in 10^6 subunits (e.g., 1_000_000n = 1 USDC)
  maxFee?: bigint; // Max fee in 10^6 subunits (default: 500n = 0.0005 USDC)
  sourceChain?: "ethereum-sepolia";
  destinationChain?: "avalanche-fuji";
  minFinalityThreshold?: number; // Default: 1000 for Fast Transfer
}

export interface TransferResult {
  approvalTx?: string;
  burnTx: string;
  attestation?: any;
  mintTx?: string;
  success: boolean;
  error?: string;
}

// ============ Helper Functions ============

function formatAddressToBytes32(address: string): string {
  // Remove '0x' prefix if present and pad to 32 bytes
  const addressWithoutPrefix = address.startsWith("0x") ? address.slice(2) : address;
  return `0x000000000000000000000000${addressWithoutPrefix}`;
}

/**
 * Helper function to convert USDC amount to bigint (6 decimals)
 */
export function usdcToBigInt(usdcAmount: number): bigint {
  return BigInt(Math.floor(usdcAmount * 1_000_000));
}

/**
 * Helper function to convert bigint amount to USDC (6 decimals)
 */
export function bigIntToUSDC(amount: bigint): number {
  return Number(amount) / 1_000_000;
}

// ============ Payment Request Storage ============

// Simple in-memory storage (in production, use AsyncStorage or a database)
let paymentRequestsStorage: PaymentRequest[] = [];

/**
 * Store a payment request
 */
export function storePaymentRequest(request: PaymentRequest): void {
  const requestWithId: PaymentRequest = {
    ...request,
    id: request.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  paymentRequestsStorage.push(requestWithId);
  
  // Also try to store in localStorage if available (for web)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('paymentRequests');
      const requests = stored ? JSON.parse(stored) : [];
      requests.push(requestWithId);
      localStorage.setItem('paymentRequests', JSON.stringify(requests));
    } catch (error) {
      console.error('Failed to store payment request in localStorage:', error);
    }
  }
}

/**
 * Get all payment requests for a patient address
 */
export function getPaymentRequests(patientAddress: string): PaymentRequest[] {
  // Try to load from localStorage first (for web)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('paymentRequests');
      if (stored) {
        const requests = JSON.parse(stored) as PaymentRequest[];
        paymentRequestsStorage = requests;
      }
    } catch (error) {
      console.error('Failed to load payment requests from localStorage:', error);
    }
  }
  
  return paymentRequestsStorage.filter(
    (req) => req.patientAddress.toLowerCase() === patientAddress.toLowerCase()
  );
}

/**
 * Update payment request status
 */
export function updatePaymentRequestStatus(
  requestId: string,
  status: "pending" | "completed" | "failed"
): void {
  const request = paymentRequestsStorage.find((r) => r.id === requestId);
  if (request) {
    request.status = status;
    
    // Update localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('paymentRequests');
        if (stored) {
          const requests = JSON.parse(stored) as PaymentRequest[];
          const updated = requests.map((r) =>
            r.id === requestId ? { ...r, status } : r
          );
          localStorage.setItem('paymentRequests', JSON.stringify(updated));
        }
      } catch (error) {
        console.error('Failed to update payment request in localStorage:', error);
      }
    }
  }
}

/**
 * Approves USDC spending for the TokenMessenger contract
 */
async function approveUSDC(
  client: ReturnType<typeof createWalletClient>,
  amount: bigint
): Promise<`0x${string}`> {
  console.log("Approving USDC transfer...");
  // @ts-ignore - Wallet client account is guaranteed to exist when created with account parameter
  const approveTx = await client.sendTransaction({
    to: ETHEREUM_SEPOLIA_USDC as `0x${string}`,
    data: encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "approve",
          stateMutability: "nonpayable",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
      ],
      functionName: "approve",
      args: [ETHEREUM_SEPOLIA_TOKEN_MESSENGER as `0x${string}`, amount],
    }),
  });
  console.log(`USDC Approval Tx: ${approveTx}`);
  return approveTx;
}

/**
 * Burns USDC on the source chain (Ethereum Sepolia)
 */
async function burnUSDC(
  client: ReturnType<typeof createWalletClient>,
  params: USDCTransferParams
): Promise<`0x${string}`> {
  console.log("Burning USDC on Ethereum Sepolia...");
  
  const destinationAddressBytes32 = formatAddressToBytes32(params.destinationAddress) as `0x${string}`;
  const destinationCallerBytes32 =
    "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
  const maxFee = params.maxFee || 500n;
  const minFinalityThreshold = params.minFinalityThreshold || 1000;

  // @ts-ignore - Wallet client account is guaranteed to exist when created with account parameter
  const burnTx = await client.sendTransaction({
    to: ETHEREUM_SEPOLIA_TOKEN_MESSENGER as `0x${string}`,
    data: encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "depositForBurn",
          stateMutability: "nonpayable",
          inputs: [
            { name: "amount", type: "uint256" },
            { name: "destinationDomain", type: "uint32" },
            { name: "mintRecipient", type: "bytes32" },
            { name: "burnToken", type: "address" },
            { name: "destinationCaller", type: "bytes32" },
            { name: "maxFee", type: "uint256" },
            { name: "minFinalityThreshold", type: "uint32" },
          ],
          outputs: [],
        },
      ],
      functionName: "depositForBurn",
      args: [
        params.amount,
        AVALANCHE_FUJI_DOMAIN,
        destinationAddressBytes32,
        ETHEREUM_SEPOLIA_USDC as `0x${string}`,
        destinationCallerBytes32,
        maxFee,
        minFinalityThreshold,
      ],
    }),
  });
  console.log(`Burn Tx: ${burnTx}`);
  return burnTx;
}

/**
 * Retrieves the attestation from Circle's API
 */
async function retrieveAttestation(transactionHash: `0x${string}`): Promise<any> {
  console.log("Retrieving attestation...");
  const url = `${CCTP_API_URL}/${ETHEREUM_SEPOLIA_DOMAIN}?transactionHash=${transactionHash}`;
  
  while (true) {
    try {
      const response = await axios.get(url);
      if (response.status === 404) {
        console.log("Waiting for attestation...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      if (response.data?.messages?.[0]?.status === "complete") {
        console.log("Attestation retrieved successfully!");
        return response.data.messages[0];
      }
      console.log("Waiting for attestation...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.error("Rate limit exceeded. Waiting 5 minutes...");
        await new Promise((resolve) => setTimeout(resolve, 300000)); // Wait 5 minutes
        continue;
      }
      if (error.response?.status === 404) {
        console.log("Waiting for attestation...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      console.error("Error fetching attestation:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Mints USDC on the destination chain (Avalanche Fuji)
 */
async function mintUSDC(
  client: ReturnType<typeof createWalletClient>,
  attestation: any
): Promise<`0x${string}`> {
  console.log("Minting USDC on Avalanche Fuji...");
  // @ts-ignore - Wallet client account is guaranteed to exist when created with account parameter
  const mintTx = await client.sendTransaction({
    to: AVALANCHE_FUJI_MESSAGE_TRANSMITTER as `0x${string}`,
    data: encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "receiveMessage",
          stateMutability: "nonpayable",
          inputs: [
            { name: "message", type: "bytes" },
            { name: "attestation", type: "bytes" },
          ],
          outputs: [],
        },
      ],
      functionName: "receiveMessage",
      args: [attestation.message as `0x${string}`, attestation.attestation as `0x${string}`],
    }),
  });
  console.log(`Mint Tx: ${mintTx}`);
  return mintTx;
}

// ============ Main Export Function ============

/**
 * Executes a USDC transfer from patient to pharmacist using CCTP
 * 
 * @param params - Transfer parameters including private key, destination address, and amount
 * @returns Promise with transfer result including transaction hashes
 */
export async function executeUSDCTransfer(
  params: USDCTransferParams
): Promise<TransferResult> {
  try {
    // Validate inputs
    if (!params.privateKey) {
      throw new Error("Private key is required");
    }
    if (!params.destinationAddress) {
      throw new Error("Destination address is required");
    }
    if (!params.amount || params.amount <= 0n) {
      throw new Error("Amount must be greater than 0");
    }

    // Setup account and clients
    const privateKey = params.privateKey.startsWith("0x")
      ? params.privateKey
      : `0x${params.privateKey}`;
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const sepoliaWalletClient = createWalletClient({
      chain: sepolia,
      transport: http(),
      account,
    });

    const avalancheWalletClient = createWalletClient({
      chain: avalancheFuji,
      transport: http(),
      account,
    });

    // Create public clients for waiting for transaction receipts
    const sepoliaPublicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    const avalanchePublicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(),
    });

    // Step 1: Approve USDC (set max allowance for efficiency)
    const approvalAmount = 10_000_000_000n; // 10,000 USDC max allowance
    const approvalTx = await approveUSDC(sepoliaWalletClient, approvalAmount);

    // Wait for approval transaction to be mined
    await sepoliaPublicClient.waitForTransactionReceipt({
      hash: approvalTx,
    });

    // Step 2: Burn USDC on source chain
    const burnTx = await burnUSDC(sepoliaWalletClient, params);

    // Wait for burn transaction to be mined
    await sepoliaPublicClient.waitForTransactionReceipt({
      hash: burnTx,
    });

    // Step 3: Retrieve attestation
    const attestation = await retrieveAttestation(burnTx);

    // Step 4: Mint USDC on destination chain
    const mintTx = await mintUSDC(avalancheWalletClient, attestation);

    // Wait for mint transaction to be mined
    await avalanchePublicClient.waitForTransactionReceipt({
      hash: mintTx,
    });

    return {
      approvalTx,
      burnTx,
      attestation,
      mintTx,
      success: true,
    };
  } catch (error: any) {
    console.error("USDC transfer error:", error);
    return {
      burnTx: "",
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

