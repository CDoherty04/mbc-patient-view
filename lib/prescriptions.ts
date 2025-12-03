import { ethers } from "ethers";

export interface PrescriptionNFT {
  tokenId: number;
  owner: string;
  medication: string;
  dosage: string;
  instructions: string;
  metadata: any;
}

export async function readPrescriptionNFT(
  contractAddress: string,
  tokenId: number
): Promise<PrescriptionNFT | null> {
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");

  // Minimal ABI for your NFT
  const abi = [
    "function prescriptions(uint256) view returns (string medication,string dosage,string instructions)",
    "function tokenURI(uint256) view returns (string)",
    "function ownerOf(uint256) view returns (address)"
  ];

  const nft = new ethers.Contract(contractAddress, abi, provider);

  // Check existence
  try {
    const owner = await nft.ownerOf(tokenId);
    
    // Read struct
    const p = await nft.prescriptions(tokenId);
    
    // Read tokenURI
    const uri = await nft.tokenURI(tokenId);
    let metadata = null;
    
    // Decode data:application/json
    if (uri.startsWith("data:application/json,")) {
      metadata = JSON.parse(uri.replace("data:application/json,", ""));
    }

    return {
      tokenId,
      owner,
      medication: p.medication,
      dosage: p.dosage,
      instructions: p.instructions,
      metadata
    };
  } catch (err) {
    return null;
  }
}

export async function readAllPrescriptionNFTs(contractAddress: string): Promise<PrescriptionNFT[]> {
  const results: PrescriptionNFT[] = [];
  
  for (let tokenId = 1; tokenId <= 10; tokenId++) {
    const data = await readPrescriptionNFT(contractAddress, tokenId);
    if (data) {
      results.push(data);
    }
  }
  
  return results;
}

/**
 * Read all prescription NFTs owned by a specific wallet address
 * @param contractAddress - The prescription NFT contract address
 * @param ownerAddress - The wallet address to filter by
 * @returns Array of prescription NFTs owned by the address
 */
export async function readPrescriptionNFTsForOwner(
  contractAddress: string,
  ownerAddress: string
): Promise<PrescriptionNFT[]> {
  const allNFTs = await readAllPrescriptionNFTs(contractAddress);
  
  // Filter by owner address (case-insensitive comparison)
  const ownerLower = ownerAddress.toLowerCase();
  return allNFTs.filter(
    (nft) => nft.owner.toLowerCase() === ownerLower
  );
}

