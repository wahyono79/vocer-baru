import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
import { SalesData } from '@/types';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useInstantUpdates } from '@/hooks/useInstantUpdates';
import { cn } from '@/lib/utils';

interface SalesTableProps {
  data: SalesData[];
  onEdit: (data: SalesData) => void;
  onDelete: (id: string) => void;
}

export default function SalesTable({ data, onEdit, onDelete }: SalesTableProps) {
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
  const refreshTrigger = useRealtimeRefresh([data]);
  const { updateTrigger } = useInstantUpdates();
  
  // Force re-render on instant updates
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [updateTrigger]);
  
  // Listen for new items and highlight them
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const { source } = event.detail;
      
      // Highlight newly added items
      if (source === 'addSale' && data.length > 0) {
        const newestItem = data[0]; // Assuming new items are added to the beginning
        if (newestItem) {
          setHighlightedItems(prev => new Set(prev).add(newestItem.id));
          
          // Remove highlight after animation
          setTimeout(() => {
            setHighlightedItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(newestItem.id);
              return newSet;
            });
          }, 3000);
        }
      }
    };

    const handleInstantUpdate = (event: CustomEvent) => {
      const { type, action, data: updateData } = event.detail;
      
      if (type === 'sales' && action === 'add' && updateData) {
        // Highlight instantly added items
        setHighlightedItems(prev => new Set(prev).add(updateData.id));
        
        // Force immediate re-render
        forceUpdate({});
        
        // Remove highlight after animation
        setTimeout(() => {
          setHighlightedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(updateData.id);
            return newSet;
          });
        }, 3000);
      }
    };

    window.addEventListener('forceDataRefresh', handleDataRefresh as EventListener);
    window.addEventListener('instantDataUpdate', handleInstantUpdate as EventListener);
    
    return () => {
      window.removeEventListener('forceDataRefresh', handleDataRefresh as EventListener);
      window.removeEventListener('instantDataUpdate', handleInstantUpdate as EventListener);
    };
  }, [data]);
  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Penjualan</CardTitle>
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
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    Belum ada data penjualan
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const isHighlighted = highlightedItems.has(item.id);
                  
                  return (
                    <TableRow 
                      key={item.id} 
                      data-item-id={item.id}
                      className={cn(
                        "transition-all duration-500",
                        isHighlighted && "bg-green-50 border-l-4 border-l-green-500 animate-pulse"
                      )}
                    >
                      <TableCell>{formatDate(item.tanggal)}</TableCell>
                      <TableCell className={cn(
                        "font-medium",
                        isHighlighted && "text-green-700"
                      )}>
                        {item.namaPelanggan}
                        {isHighlighted && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            Baru!
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{item.paket}</TableCell>
                      <TableCell>{formatCurrency(item.harga)}</TableCell>
                      <TableCell>{item.kodeVoucher}</TableCell>
                      <TableCell>{formatCurrency(item.feePenjual)}</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {formatCurrency(item.setoranBersih)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}