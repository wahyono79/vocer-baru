import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSales, useHistory } from '@/hooks/useDataStore';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useInstantUpdates } from '@/hooks/useInstantUpdates';
import { SalesData } from '@/types';
import SalesForm from '@/components/SalesForm';
import SalesTable from '@/components/SalesTable';
import EditSalesDialog from '@/components/EditSalesDialog';
import ReportsTab from '@/components/ReportsTab';
import HistoryTab from '@/components/HistoryTab';
import { OfflineStatus } from '@/components/OfflineStatus';

export default function Index() {
  const [editingItem, setEditingItem] = useState<SalesData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Use hybrid data store hooks
  const { sales: salesData, updateSale, deleteSale, loading: salesLoading } = useSales();
  const { history: historyData, moveToHistory, deleteHistory, loading: historyLoading } = useHistory();
  
  // Real-time refresh trigger
  const refreshTrigger = useRealtimeRefresh([salesData, historyData]);
  
  // Instant updates for immediate display
  const { updateTrigger } = useInstantUpdates();

  const handleEditSales = (data: SalesData) => {
    setEditingItem(data);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedData: SalesData) => {
    try {
      await updateSale(updatedData.id, updatedData);
      setIsEditDialogOpen(false);
      setEditingItem(null);
      // Notification is handled automatically by the hook
    } catch (error) {
      console.error('Error updating sale:', error);
    }
  };

  const handleDeleteSales = async (id: string) => {
    const item = salesData.find(item => item.id === id);
    if (item && window.confirm(`Hapus data penjualan ${item.namaPelanggan}?`)) {
      try {
        await deleteSale(id);
        // Notification is handled automatically by the hook
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  const handleDeposit = async () => {
    if (salesData.length === 0) return;

    const currentDate = new Date().toISOString().split('T')[0];
    
    try {
      // Move each sale to history
      for (const sale of salesData) {
        await moveToHistory(sale.id, currentDate);
        // Also delete from sales after moving to history
        await deleteSale(sale.id);
      }
      
      // Success notification is handled automatically by the hooks
    } catch (error) {
      console.error('Error processing deposit:', error);
      alert('Gagal memproses setoran. Silakan coba lagi.');
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteHistory(id);
      // Success notification is handled automatically by the hook
    } catch (error) {
      console.error('Error deleting history:', error);
      alert('Gagal menghapus riwayat setoran. Silakan coba lagi.');
    }
  };

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  const totalPenjualan = salesData.reduce((sum, item) => sum + item.harga, 0);
  const totalFeePenjual = salesData.reduce((sum, item) => sum + item.feePenjual, 0);
  const totalSetoranBersih = salesData.reduce((sum, item) => sum + item.setoranBersih, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Offline Status */}
        <OfflineStatus className="max-w-2xl mx-auto" />
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Penjualan Voucher WiFi
          </h1>
          <p className="text-gray-600">
            Kelola penjualan voucher WiFi dengan mudah dan efisien
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesData.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Penjualan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalPenjualan)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Fee Penjual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalFeePenjual)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Setoran Bersih
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalSetoranBersih)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="penjualan" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="penjualan">Data Penjualan</TabsTrigger>
            <TabsTrigger value="laporan">Laporan</TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat Setoran</TabsTrigger>
          </TabsList>

          <TabsContent value="penjualan" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <SalesForm />
              </div>
              <div className="lg:col-span-2">
                <SalesTable
                  data={salesData}
                  onEdit={handleEditSales}
                  onDelete={handleDeleteSales}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="laporan">
            <ReportsTab
              salesData={salesData}
              onDeposit={handleDeposit}
            />
          </TabsContent>

          <TabsContent value="riwayat">
            <HistoryTab historyData={historyData} onDelete={handleDeleteHistory} />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <EditSalesDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveEdit}
          initialData={editingItem}
        />
      </div>
    </div>
  );
}