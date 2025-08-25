import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { HistoryData } from '@/types';

interface HistoryTabProps {
  historyData: HistoryData[];
  onDelete: (id: string) => void;
}

export default function HistoryTab({ historyData, onDelete }: HistoryTabProps) {
  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
  };

  const handleDelete = (id: string, namaPelanggan: string) => {
    if (window.confirm(`Hapus riwayat setoran untuk ${namaPelanggan}?`)) {
      onDelete(id);
    }
  };

  const totalSetoranBersih = historyData.reduce((sum, item) => sum + item.setoranBersih, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Total Riwayat Setoran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalSetoranBersih)}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            dari {historyData.length} transaksi
          </p>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Setoran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal Penjualan</TableHead>
                  <TableHead>Tanggal Setor</TableHead>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Kode Voucher</TableHead>
                  <TableHead>Fee Penjual</TableHead>
                  <TableHead>Setoran Bersih</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">
                      Belum ada riwayat setoran
                    </TableCell>
                  </TableRow>
                ) : (
                  historyData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.tanggal)}</TableCell>
                      <TableCell>{formatDate(item.tanggalSetor)}</TableCell>
                      <TableCell>{item.namaPelanggan}</TableCell>
                      <TableCell>{item.paket}</TableCell>
                      <TableCell>{formatCurrency(item.harga)}</TableCell>
                      <TableCell>{item.kodeVoucher}</TableCell>
                      <TableCell>{formatCurrency(item.feePenjual)}</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {formatCurrency(item.setoranBersih)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.namaPelanggan)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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