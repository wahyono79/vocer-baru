import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SalesData } from '@/types';
import { calculatePricing } from '@/utils/packageConfig';
import { useSales } from '@/hooks/useDataStore';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';

interface SalesFormProps {
  onSubmit?: (data: SalesData) => void;
}

export default function SalesForm({ onSubmit }: SalesFormProps) {
  const { addSale } = useSales();
  const { syncFeedback, startSync, completeSync, errorSync, triggerRefresh } = useRealTimeSync();
  const [formData, setFormData] = useState({
    tanggal: new Date(),
    namaPelanggan: '',
    paket: '' as SalesData['paket'],
    kodeVoucher: '',
  });
  const [isFormAnimating, setIsFormAnimating] = useState(false);

  const handlePackageChange = (value: string) => {
    setFormData(prev => ({ ...prev, paket: value as SalesData['paket'] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.namaPelanggan || !formData.paket || !formData.kodeVoucher) {
      errorSync('Harap lengkapi semua field!');
      return;
    }

    // Start sync with progress feedback
    startSync(`Menyimpan penjualan ${formData.namaPelanggan}...`);
    setIsFormAnimating(true);

    try {
      const pricing = calculatePricing(formData.paket);
      
      const salesData = {
        tanggal: formData.tanggal.toISOString().split('T')[0],
        namaPelanggan: formData.namaPelanggan,
        paket: formData.paket,
        harga: pricing.harga,
        kodeVoucher: formData.kodeVoucher,
        feePenjual: pricing.feePenjual,
        setoranBersih: pricing.setoranBersih,
      };

      const newSale = await addSale(salesData);
      
      // Call onSubmit if provided (for backward compatibility)
      if (onSubmit) {
        onSubmit({ id: newSale.id, ...salesData });
      }
      
      // Trigger data refresh for other components IMMEDIATELY
      triggerRefresh();
      
      // Complete sync with success feedback
      completeSync(
        `Penjualan ${formData.namaPelanggan} berhasil ditambahkan!`,
        newSale.id,
        'add'
      );
      
      // Reset form immediately to allow new input
      setFormData({
        tanggal: new Date(),
        namaPelanggan: '',
        paket: '' as SalesData['paket'],
        kodeVoucher: '',
      });
      
      // Show success animation briefly
      setTimeout(() => {
        setIsFormAnimating(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error adding sale:', error);
      errorSync('Gagal menambahkan penjualan. Silakan coba lagi.');
      setIsFormAnimating(false);
    }
  };

  const pricing = formData.paket ? calculatePricing(formData.paket) : null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Tambah Penjualan Voucher</CardTitle>
      </CardHeader>
      <CardContent>
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

          {/* Sync Feedback Display */}
          {(syncFeedback.isLoading || syncFeedback.isSuccess || syncFeedback.isError) && (
            <div className="space-y-2">
              {syncFeedback.isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">{syncFeedback.message}</span>
                    <span className="text-blue-600">{Math.round(syncFeedback.progress)}%</span>
                  </div>
                  <Progress value={syncFeedback.progress} className="h-2" />
                </div>
              )}
              {syncFeedback.isSuccess && (
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>{syncFeedback.message}</span>
                </div>
              )}
              {syncFeedback.isError && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{syncFeedback.message}</span>
                </div>
              )}
            </div>
          )}

          <Button 
            type="submit" 
            className={cn(
              "w-full transition-all duration-300",
              syncFeedback.isLoading && "opacity-75",
              syncFeedback.isSuccess && "bg-green-600 hover:bg-green-700",
              isFormAnimating && "animate-pulse"
            )} 
            disabled={syncFeedback.isLoading}
          >
            {syncFeedback.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : syncFeedback.isSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Berhasil!
              </>
            ) : (
              'Tambah Penjualan'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}