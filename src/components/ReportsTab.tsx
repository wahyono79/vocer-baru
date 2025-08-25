import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Upload, Smartphone, Monitor } from 'lucide-react';
import { SalesData } from '@/types';
import { mobilePDFExporter } from '@/utils/mobilePDFExporter';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

interface ReportsTabProps {
  salesData: SalesData[];
  onDeposit: () => void;
}

export default function ReportsTab({ salesData, onDeposit }: ReportsTabProps) {
  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  const totalPenjualan = salesData.reduce((sum, item) => sum + item.harga, 0);
  const totalFeePenjual = salesData.reduce((sum, item) => sum + item.feePenjual, 0);
  const totalSetoranBersih = salesData.reduce((sum, item) => sum + item.setoranBersih, 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
  };

  const generatePDF = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      const platform = Capacitor.getPlatform();
      
      toast.info(isNative ? 
        `📱 Generating laporan untuk ${platform}...` : 
        '🖥️ Membuka preview laporan...', {
        description: 'Silakan tunggu sebentar'
      });
      
      await mobilePDFExporter.exportSalesReport(salesData, {
        title: 'Laporan Penjualan Voucher WiFi',
        filename: `laporan-voucher-${new Date().toISOString().split('T')[0]}`,
        orientation: 'portrait'
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('❌ Gagal membuat laporan', {
        description: 'Terjadi kesalahan saat membuat PDF. Silakan coba lagi.'
      });
    }
  };

  const handleDeposit = () => {
    if (salesData.length === 0) {
      alert('Tidak ada data untuk disetor');
      return;
    }

    const confirmDeposit = window.confirm(
      `Apakah Anda yakin ingin menyetor ${salesData.length} transaksi dengan total setoran bersih ${formatCurrency(totalSetoranBersih)}?`
    );

    if (confirmDeposit) {
      onDeposit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalPenjualan)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Fee Penjual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalFeePenjual)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Setoran Bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalSetoranBersih)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button onClick={generatePDF} className="flex items-center space-x-2">
          {Capacitor.isNativePlatform() ? (
            <Smartphone className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
          <span>
            {Capacitor.isNativePlatform() ? 'Export Mobile' : 'Print / Save PDF'}
          </span>
        </Button>
        <Button 
          onClick={handleDeposit} 
          variant="outline" 
          className="flex items-center space-x-2"
          disabled={salesData.length === 0}
        >
          <Upload className="h-4 w-4" />
          <span>Setor ({salesData.length} transaksi)</span>
        </Button>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Kode Voucher</TableHead>
                  <TableHead>Fee Penjual</TableHead>
                  <TableHead>Setoran Bersih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Belum ada data penjualan
                    </TableCell>
                  </TableRow>
                ) : (
                  salesData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.tanggal)}</TableCell>
                      <TableCell>{item.namaPelanggan}</TableCell>
                      <TableCell>{item.paket}</TableCell>
                      <TableCell>{formatCurrency(item.harga)}</TableCell>
                      <TableCell>{item.kodeVoucher}</TableCell>
                      <TableCell>{formatCurrency(item.feePenjual)}</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {formatCurrency(item.setoranBersih)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}