import { PackageConfig } from '@/types';

export const packageConfig: PackageConfig = {
  '24 Jam': {
    harga: 5000,
    feePenjual: 1000,
  },
  '7 Hari': {
    harga: 20000,
    feePenjual: 2000,
  },
  '15 Hari': {
    harga: 35000,
    feePenjual: 5000,
  },
  '30 Hari': {
    harga: 60000,
    feePenjual: 5000,
  },
};

export const calculatePricing = (paket: string) => {
  const config = packageConfig[paket];
  if (!config) return { harga: 0, feePenjual: 0, setoranBersih: 0 };
  
  return {
    harga: config.harga,
    feePenjual: config.feePenjual,
    setoranBersih: config.harga - config.feePenjual,
  };
};