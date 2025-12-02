import { ethers } from 'ethers';
import Constants from 'expo-constants';

// Helper function to get environment variable
// Works in both Expo (via expo-constants) and web/Node.js (via process.env)
// Environment variables are loaded by app.config.js and exposed via expo-constants
function getEnvVar(key: string): string | undefined {
	// First, try expo-constants (works for both native and web builds)
	// Environment variables are exposed via app.config.js -> extra
	if (Constants.expoConfig?.extra?.[key]) {
		return Constants.expoConfig.extra[key];
	}

	// Fallback to process.env (for web builds where process.env might be set at build time)
	if (typeof process !== 'undefined' && process.env) {
		// Try direct key first
		if (process.env[key]) {
			return process.env[key];
		}
		// Try EXPO_PUBLIC_ prefixed version (Expo convention for public env vars)
		// Note: Not recommended for private keys, but included for completeness
		const expoPublicKey = `EXPO_PUBLIC_${key}`;
		if (process.env[expoPublicKey]) {
			return process.env[expoPublicKey];
		}
	}

	return undefined;
}

// Contract configuration
const CONTRACT_ADDRESS = '0xb8Df87631dBB64D28a4c015b23540F1ce02445e2';

const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"components": [
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "contactInfo",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "dateOfBirth",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "socialSecurityNumber",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "medicalHistory",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "pastDiagnoses",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "familyHistory",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "allergies",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "currentMedications",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "treatmentRegimens",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "vitalSigns",
						"type": "string"
					}
				],
				"internalType": "struct MedicalPassportOnChain.MedicalPassportInput",
				"name": "input",
				"type": "tuple"
			}
		],
		"name": "mintMedicalPassport",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "tokenURI",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ownerOf",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "counter",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "PassportIssued",
		"type": "event"
	}
] as const;

// Type definitions
export interface MedicalPassportInput {
	name?: string;
	contactInfo?: string;
	dateOfBirth?: string;
	socialSecurityNumber?: string;
	medicalHistory?: string;
	pastDiagnoses?: string;
	familyHistory?: string;
	allergies?: string;
	currentMedications?: string;
	treatmentRegimens?: string;
	vitalSigns?: string;
}

export interface MedicalPassportData extends MedicalPassportInput {
	name: string;
	contactInfo: string;
	dateOfBirth: string;
	socialSecurityNumber: string;
	medicalHistory: string;
	pastDiagnoses: string;
	familyHistory: string;
	allergies: string;
	currentMedications: string;
	treatmentRegimens: string;
	vitalSigns: string;
}

export interface MintPassportResult {
	success: true;
	transactionHash: string;
	blockNumber: number;
	tokenId: string;
	recipient: string;
	contractAddress: string;
	passportData: MedicalPassportData;
}

export interface GetPassportResult {
	success: true;
	tokenId: string;
	tokenURI: string;
	owner: string;
}

export interface BlockchainConfig {
	privateKey?: string;
	rpcUrl?: string;
	contractAddress?: string;
}

let provider: ethers.JsonRpcProvider | null = null;
let contract: ethers.Contract | null = null;
let wallet: ethers.Wallet | null = null;

export function initializeBlockchain(config: BlockchainConfig = {}): void {
	try {
		// Load RPC URL from config, environment variable, or use default
		const rpcUrl = "https://sepolia.base.org";
		if (!rpcUrl) {
			throw new Error('RPC_URL is required. Please provide it in the config or set RPC_URL environment variable.');
		}
		provider = new ethers.JsonRpcProvider(rpcUrl);

		// Load private key from config or environment variable
		const privateKeyValue = config.privateKey || getEnvVar('PRIVATE_KEY');
		if (!privateKeyValue) {
			throw new Error('PRIVATE_KEY is required. Please provide it in the config or set PRIVATE_KEY environment variable.');
		}

		// Check if private key is still the placeholder
		const privateKey = privateKeyValue.trim();
		if (privateKey === 'your_private_key_here' || privateKey.indexOf('your_private_key') !== -1) {
			throw new Error('Please replace "your_private_key_here" with your actual Ethereum private key.');
		}

		// Validate private key format (should be 64 hex characters, with or without 0x prefix)
		const cleanKey = privateKey.indexOf('0x') === 0 ? privateKey.slice(2) : privateKey;
		if (cleanKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(cleanKey)) {
			throw new Error('Invalid private key format. Private key must be 64 hexadecimal characters (with or without 0x prefix).');
		}

		wallet = new ethers.Wallet(privateKey, provider);

		// Initialize contract
		const contractAddress = config.contractAddress || CONTRACT_ADDRESS;
		contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

		console.log('Blockchain initialized successfully');
		console.log('Wallet address:', wallet.address);
		console.log('Contract address:', contractAddress);
		console.log('RPC URL:', rpcUrl);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Error initializing blockchain:', errorMessage);
		throw error;
	}
}

function ensureInitialized(): void {
	if (!provider || !contract || !wallet) {
		throw new Error('Blockchain not initialized. Call initializeBlockchain() first.');
	}
}

export async function mintMedicalPassport(
	input: MedicalPassportInput,
	recipient?: string
): Promise<MintPassportResult> {
	ensureInitialized();

	if (!contract || !wallet) {
		throw new Error('Contract or wallet not initialized');
	}

	// Store in local constants for TypeScript narrowing
	const contractInstance = contract;
	const walletInstance = wallet;

	// Set recipient to the wallet address if not provided
	const recipientAddress = recipient || walletInstance.address;

	// Prepare the medical passport input struct
	// Preserve actual values from input, convert to string format expected by contract
	// Use nullish coalescing to only default undefined/null to empty string
	const passportInput: MedicalPassportData = {
		name: input.name != null ? String(input.name) : '',
		contactInfo: input.contactInfo != null ? String(input.contactInfo) : '',
		dateOfBirth: input.dateOfBirth != null ? String(input.dateOfBirth) : '',
		socialSecurityNumber: input.socialSecurityNumber != null ? String(input.socialSecurityNumber) : '',
		medicalHistory: input.medicalHistory != null ? String(input.medicalHistory) : '',
		pastDiagnoses: input.pastDiagnoses != null ? String(input.pastDiagnoses) : '',
		familyHistory: input.familyHistory != null ? String(input.familyHistory) : '',
		allergies: input.allergies != null ? String(input.allergies) : '',
		currentMedications: input.currentMedications != null ? String(input.currentMedications) : '',
		treatmentRegimens: input.treatmentRegimens != null ? String(input.treatmentRegimens) : '',
		vitalSigns: input.vitalSigns != null ? String(input.vitalSigns) : ''
	};

	console.log('Minting passport for recipient:', recipientAddress);
	console.log('Passport data to be sent:', JSON.stringify(passportInput, null, 2));

	// Validate that at least some data is provided
	const hasData = Object.values(passportInput).some((value: string) => value && value.trim().length > 0);
	if (!hasData) {
		console.warn('Warning: All passport fields are empty. Proceeding with empty values.');
	}

	try {
		// Call the smart contract function
		const tx = await contractInstance.mintMedicalPassport(recipientAddress, passportInput);
		
		console.log('Transaction sent:', tx.hash);
		
		// Wait for transaction confirmation
		const receipt = await tx.wait();
		
		console.log('Transaction confirmed in block:', receipt.blockNumber);

		// Get the token ID from the event or counter
		let tokenId: string | null = null;
		
		// Try to get tokenId from PassportIssued event
		try {
			const eventFragment = contractInstance.interface.getEvent('PassportIssued');
			if (eventFragment) {
				const eventTopic = eventFragment.topicHash;
				
				const eventLog = receipt.logs.find((log: ethers.Log) => 
					log.topics[0] === eventTopic
				);
				
				if (eventLog) {
					const parsed = contractInstance.interface.parseLog(eventLog);
					if (parsed && parsed.args) {
						tokenId = parsed.args.tokenId.toString() || null;
					}
				}
			}
		} catch (error) {
			console.error('Error parsing PassportIssued event:', error);
		}

		// If we couldn't get tokenId from event, get it from the counter
		if (!tokenId) {
			try {
				const counter = await contractInstance.counter();
				tokenId = counter.toString();
			} catch (error) {
				console.error('Could not retrieve token ID from counter:', error);
				throw new Error('Could not retrieve token ID after minting');
			}
		}

		if (!tokenId) {
			throw new Error('Failed to retrieve token ID after minting');
		}

		// Return success result
		return {
			success: true,
			transactionHash: tx.hash,
			blockNumber: receipt.blockNumber,
			tokenId: tokenId,
			recipient: recipientAddress,
			contractAddress: contractInstance.target as string,
			passportData: passportInput
		};
	} catch (error) {
		console.error('Error minting passport:', error);
		
		// Handle specific error types
		if (error instanceof Error) {
			const errorMessage = error.message || '';
			if (errorMessage.indexOf('insufficient funds') !== -1 || (error as any).code === 'INSUFFICIENT_FUNDS') {
				throw new Error('Insufficient funds for transaction: ' + errorMessage);
			}
			
			if ((error as any).reason) {
				throw new Error('Transaction failed: ' + (error as any).reason);
			}
		}

		throw new Error('Failed to mint medical passport NFT: ' + (error instanceof Error ? error.message : String(error)));
	}
}

export async function getMedicalPassport(tokenId: string | number): Promise<GetPassportResult> {
	ensureInitialized();

	if (!contract) {
		throw new Error('Contract not initialized');
	}

	// Store in local constant for TypeScript narrowing
	const contractInstance = contract;

	// Validate token ID
	if (!tokenId || (typeof tokenId === 'string' && isNaN(Number(tokenId)))) {
		throw new Error('Invalid token ID');
	}

	try {
		const tokenIdStr = String(tokenId);
		const uri = await contractInstance.tokenURI(tokenIdStr);
		const owner = await contractInstance.ownerOf(tokenIdStr);

		return {
			success: true,
			tokenId: tokenIdStr,
			tokenURI: uri,
			owner: owner
		};
	} catch (error) {
		console.error('Error fetching passport:', error);
		throw new Error('Failed to fetch passport: ' + (error instanceof Error ? error.message : String(error)));
	}
}

export function getWalletAddress(): string | null {
	return wallet?.address || null;
}

export function getContractAddress(): string | null {
	return contract?.target?.toString() || null;
}

export function getHealthStatus(): {
	status: 'healthy' | 'not_initialized';
	contractAddress: string | null;
	walletAddress: string | null;
} {
	return {
		status: (provider && contract && wallet) ? 'healthy' : 'not_initialized',
		contractAddress: getContractAddress(),
		walletAddress: getWalletAddress()
	};
}

export function getPort(): string | null {
	return process.env.PORT || null;
}

