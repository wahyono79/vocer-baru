import { SalesData } from '@/types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';

export interface PDFExportOptions {
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
}

export class MobilePDFExporter {
  private static instance: MobilePDFExporter;
  
  public static getInstance(): MobilePDFExporter {
    if (!MobilePDFExporter.instance) {
      MobilePDFExporter.instance = new MobilePDFExporter();
    }
    return MobilePDFExporter.instance;
  }
  
  /**
   * Check if we're running in a native mobile environment
   */
  private isNative(): boolean {
    return Capacitor.isNativePlatform();
  }
  
  /**
   * Generate PDF-style HTML content that can be printed or converted
   */
  private generateHTMLContent(salesData: SalesData[], options: PDFExportOptions = {}): string {
    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('id-ID');
    };
    
    const totalPenjualan = salesData.reduce((sum, item) => sum + item.harga, 0);
    const totalFeePenjual = salesData.reduce((sum, item) => sum + item.feePenjual, 0);
    const totalSetoranBersih = salesData.reduce((sum, item) => sum + item.setoranBersih, 0);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.title || 'Laporan Penjualan Voucher WiFi'}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 0.5in;
            }
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 15px;
          }
          
          .header h1 {
            margin: 0;
            color: #3b82f6;
            font-size: 24px;
            font-weight: bold;
          }
          
          .meta-info {
            margin: 20px 0;
            font-size: 14px;
            color: #666;
          }
          
          .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
          
          .summary h2 {
            margin: 0 0 15px 0;
            color: #3b82f6;
            font-size: 18px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }
          
          .summary-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          
          .summary-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          
          .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #059669;
          }
          
          .table-container {
            margin: 30px 0;
            overflow-x: auto;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            background: white;
          }
          
          th, td {
            padding: 10px 8px;
            text-align: left;
            border: 1px solid #e5e7eb;
          }
          
          th {
            background: #3b82f6;
            color: white;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          tr:nth-child(even) {
            background: #f9fafb;
          }
          
          tr:hover {
            background: #f3f4f6;
          }
          
          .currency {
            text-align: right;
            font-family: 'Courier New', monospace;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          
          .no-data {
            text-align: center;
            padding: 40px;
            color: #666;
            font-style: italic;
          }
          
          @media (max-width: 768px) {
            body { padding: 10px; }
            .header h1 { font-size: 20px; }
            table { font-size: 10px; }
            th, td { padding: 6px 4px; }
            .summary-grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${options.title || 'Laporan Penjualan Voucher WiFi'}</h1>
        </div>
        
        <div class="meta-info">
          <strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        
        <div class="summary">
          <h2>Ringkasan Penjualan</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total Transaksi</div>
              <div class="summary-value">${salesData.length} transaksi</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Penjualan</div>
              <div class="summary-value">${formatCurrency(totalPenjualan)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Fee Penjual</div>
              <div class="summary-value">${formatCurrency(totalFeePenjual)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Setoran Bersih</div>
              <div class="summary-value">${formatCurrency(totalSetoranBersih)}</div>
            </div>
          </div>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Nama Pelanggan</th>
                <th>Paket</th>
                <th>Harga</th>
                <th>Kode Voucher</th>
                <th>Fee Penjual</th>
                <th>Setoran Bersih</th>
              </tr>
            </thead>
            <tbody>
              ${salesData.length === 0 ? 
                '<tr><td colspan="8" class="no-data">Belum ada data penjualan</td></tr>' :
                salesData.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${formatDate(item.tanggal)}</td>
                    <td>${item.namaPelanggan}</td>
                    <td>${item.paket}</td>
                    <td class="currency">${formatCurrency(item.harga)}</td>
                    <td>${item.kodeVoucher}</td>
                    <td class="currency">${formatCurrency(item.feePenjual)}</td>
                    <td class="currency">${formatCurrency(item.setoranBersih)}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Digenerate oleh Aplikasi Manajemen Penjualan Voucher WiFi</p>
          <p>© ${new Date().getFullYear()} MGX - Semua hak dilindungi</p>
        </div>
        
        <script>
          // Auto-print functionality for mobile
          function printDocument() {
            if (window.print) {
              window.print();
            } else {
              alert('Fitur print tidak tersedia. Silakan gunakan menu browser untuk menyimpan atau share halaman ini.');
            }
          }
          
          // Mobile-friendly download as HTML
          function downloadHTML() {
            const htmlContent = document.documentElement.outerHTML;
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '${options.filename || 'laporan-voucher-wifi'}.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        </script>
      </body>
      </html>
    `;
  }
  
  /**
   * Export sales data as PDF for mobile devices
   */
  public async exportSalesReport(salesData: SalesData[], options: PDFExportOptions = {}): Promise<void> {
    try {
      const filename = options.filename || `laporan-voucher-${new Date().toISOString().split('T')[0]}`;
      const htmlContent = this.generateHTMLContent(salesData, options);
      
      if (this.isNative()) {
        // Native mobile environment - use Capacitor Filesystem
        await this.saveToFileSystem(htmlContent, filename);
      } else {
        // Web environment - open in new window for printing
        await this.openPrintWindow(htmlContent);
      }
      
      toast.success('✅ Laporan berhasil digenerate!', {
        description: this.isNative() ? 
          'File telah disimpan ke Downloads' : 
          'Silakan gunakan Ctrl+P untuk print atau simpan sebagai PDF'
      });
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('❌ Gagal membuat laporan', {
        description: 'Terjadi kesalahan saat membuat PDF. Silakan coba lagi.'
      });
    }
  }
  
  /**
   * Save HTML content to filesystem for native apps
   */
  private async saveToFileSystem(htmlContent: string, filename: string): Promise<void> {
    try {
      const result = await Filesystem.writeFile({
        path: `${filename}.html`,
        data: htmlContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      
      console.log('File saved to:', result.uri);
      
      // Try to open the file with system viewer
      if (Capacitor.getPlatform() === 'android') {
        // For Android, we can also show a share dialog
        this.shareFile(result.uri);
      }
      
    } catch (error) {
      console.error('Filesystem save error:', error);
      // Fallback to browser download
      this.downloadHTMLFile(htmlContent, filename);
    }
  }
  
  /**
   * Open HTML content in new window for printing
   */
  private async openPrintWindow(htmlContent: string): Promise<void> {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Auto-focus and setup print
      printWindow.focus();
      
      // Add print buttons for user convenience
      setTimeout(() => {
        const printButton = printWindow.document.createElement('button');
        printButton.textContent = '🖨️ Print / Save as PDF';
        printButton.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1000;
          padding: 10px 15px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        printButton.className = 'no-print';
        printButton.onclick = () => printWindow.print();
        printWindow.document.body.appendChild(printButton);
        
        const downloadButton = printWindow.document.createElement('button');
        downloadButton.textContent = '💾 Download HTML';
        downloadButton.style.cssText = `
          position: fixed;
          top: 10px;
          right: 180px;
          z-index: 1000;
          padding: 10px 15px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        downloadButton.className = 'no-print';
        downloadButton.onclick = () => {
          const htmlContent = printWindow.document.documentElement.outerHTML;
          this.downloadHTMLFile(htmlContent, 'laporan-voucher-wifi');
        };
        printWindow.document.body.appendChild(downloadButton);
      }, 500);
    }
  }
  
  /**
   * Download HTML file directly
   */
  private downloadHTMLFile(htmlContent: string, filename: string): void {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Share file on mobile using native share dialog
   */
  private async shareFile(fileUri: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: 'Laporan Penjualan Voucher WiFi',
          text: 'Laporan penjualan voucher WiFi telah siap',
          url: fileUri,
          dialogTitle: 'Share Laporan'
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      // Fallback: show file location
      toast.info('📁 File tersimpan', {
        description: `File laporan telah disimpan di Documents folder`
      });
    }
  }
}

// Export singleton instance
export const mobilePDFExporter = MobilePDFExporter.getInstance();