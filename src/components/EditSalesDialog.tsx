import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SalesData } from '@/types';
import { calculatePricing } from '@/utils/packageConfig';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { toast } from 'sonner';

interface EditSalesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SalesData) => void;
  initialData: SalesData | null;
}

export default function EditSalesDialog({ isOpen, onClose, onSave, initialData }: EditSalesDialogProps) {
  const { syncFeedback, startSync, completeSync, errorSync, triggerRefresh } = useRealTimeSync();
  const [formData, setFormData] = useState({
    tanggal: new Date(),
    namaPelanggan: '',
    paket: '' as SalesData['paket'],
    kodeVoucher: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        tanggal: new Date(initialData.tanggal),
        namaPelanggan: initialData.namaPelanggan,
        paket: initialData.paket,
        kodeVoucher: initialData.kodeVoucher,
      });
    }
  }, [initialData]);

  const handlePackageChange = (value: string) => {
    setFormData(prev => ({ ...prev, paket: value as SalesData['paket'] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.namaPelanggan || !formData.paket || !formData.kodeVoucher || !initialData) {
      errorSync('Harap lengkapi semua field!');
      return;
    }

    // Start sync with progress feedback
    startSync(`Memperbarui penjualan ${formData.namaPelanggan}...`);

    try {
      const pricing = calculatePricing(formData.paket);
      
      const updatedData: SalesData = {
        ...initialData,
        tanggal: formData.tanggal.toISOString().split('T')[0],
        namaPelanggan: formData.namaPelanggan,
        paket: formData.paket,
        harga: pricing.harga,
        kodeVoucher: formData.kodeVoucher,
        feePenjual: pricing.feePenjual,
        setoranBersih: pricing.setoranBersih,
      };

      onSave(updatedData);
      
      // Complete sync with success feedback
      completeSync(
        `Penjualan ${formData.namaPelanggan} berhasil diperbarui!`,
        initialData.id,
        'update'
      );
      
      // Trigger data refresh for other components
      triggerRefresh();
      
      // Close dialog after brief success display
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error updating sale:', error);
      errorSync('Gagal memperbarui penjualan. Silakan coba lagi.');
    }
  };

  const pricing = formData.paket ? calculatePricing(formData.paket) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Penjualan Voucher</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tanggal Transaksi</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.tanggal && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.tanggal ? (
                    format(formData.tanggal, "PPP", { locale: id })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.tanggal}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, tanggal: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="namaPelanggan">Nama Pelanggan</Label>
            <Input
              id="namaPelanggan"
              value={formData.namaPelanggan}
              onChange={(e) => setFormData(prev => ({ ...prev, namaPelanggan: e.target.value }))}
              placeholder="Masukkan nama pelanggan"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paket">Paket</Label>
            <Select onValueChange={handlePackageChange} value={formData.paket}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih paket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24 Jam">24 Jam</SelectItem>
                <SelectItem value="7 Hari">7 Hari</SelectItem>
                <SelectItem value="15 Hari">15 Hari</SelectItem>
                <SelectItem value="30 Hari">30 Hari</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kodeVoucher">Kode Voucher</Label>
            <Input
              id="kodeVoucher"
              value={formData.kodeVoucher}
              onChange={(e) => setFormData(prev => ({ ...prev, kodeVoucher: e.target.value }))}
              placeholder="Masukkan kode voucher"
            />
          </div>

          {pricing && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Harga:</span>
                <span className="font-semibold">Rp {pricing.harga.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Fee Penjual:</span>
                <span className="font-semibold">Rp {pricing.feePenjual.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Setoran Bersih:</span>
                <span className="font-semibold text-green-600">Rp {pricing.setoranBersih.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={syncFeedback.isLoading}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              className={cn(
                "flex-1 transition-all duration-300",
                syncFeedback.isSuccess && "bg-green-600 hover:bg-green-700"
              )}
              disabled={syncFeedback.isLoading}
            >
              {syncFeedback.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memperbarui...
                </>
              ) : syncFeedback.isSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Berhasil!
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}