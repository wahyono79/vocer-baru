import { Button } from '@/components/ui/button';
import { LogOut, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function AppHeader({ 
  title = "Manajemen Penjualan Voucher WiFi", 
  subtitle = "Kelola penjualan voucher WiFi dengan mudah dan efisien" 
}: AppHeaderProps) {
  const { exitApp } = useAndroidBackButton();

  const handleExit = async () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?');
    if (confirmed) {
      await exitApp();
    }
  };

  return (
    <div className="relative text-center space-y-2">
      {/* Exit button for Android */}
      {Capacitor.isNativePlatform() && (
        <div className="absolute top-0 right-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
            title="Keluar dari aplikasi"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <h1 className="text-3xl font-bold text-gray-900">
        {title}
      </h1>
      <p className="text-gray-600">
        {subtitle}
      </p>
    </div>
  );
}