import React, { createContext, useContext, useEffect, useState } from 'react';
import { Pharmacy, getSelectedPharmacy } from '@/lib/pharmacies';

interface PharmacyContextType {
  selectedPharmacy: Pharmacy | null;
  refreshSelectedPharmacy: () => Promise<void>;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export function PharmacyProvider({ children }: { children: React.ReactNode }) {
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);

  const refreshSelectedPharmacy = async () => {
    try {
      const pharmacy = await getSelectedPharmacy();
      setSelectedPharmacy(pharmacy);
    } catch (error) {
      console.error('Error refreshing selected pharmacy:', error);
      setSelectedPharmacy(null);
    }
  };

  useEffect(() => {
    refreshSelectedPharmacy();
  }, []);

  return (
    <PharmacyContext.Provider value={{ selectedPharmacy, refreshSelectedPharmacy }}>
      {children}
    </PharmacyContext.Provider>
  );
}

export function usePharmacy() {
  const context = useContext(PharmacyContext);
  if (context === undefined) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
}

