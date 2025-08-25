export interface SalesData {
  id: string;
  tanggal: string;
  namaPelanggan: string;
  paket: '24 Jam' | '7 Hari' | '15 Hari' | '30 Hari';
  harga: number;
  kodeVoucher: string;
  feePenjual: number;
  setoranBersih: number;
}

export interface HistoryData extends SalesData {
  tanggalSetor: string;
}

export interface PackageConfig {
  [key: string]: {
    harga: number;
    feePenjual: number;
  };
}

export interface NotificationData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
}