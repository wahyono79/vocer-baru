import { SalesData } from '@/types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
   * Generate actual PDF using jsPDF for mobile downloads
   */
  private generatePDFContent(salesData: SalesData[], options: PDFExportOptions = {}): jsPDF {
    try {
      console.log('Generating PDF content for', salesData.length, 'items');
      
      const formatCurrency = (amount: number) => {
        try {
          return `Rp ${amount.toLocaleString('id-ID')}`;
        } catch (error) {
          console.warn('Currency formatting error:', error);
          return `Rp ${amount}`;
        }
      };
      
      const formatDate = (dateString: string) => {
        try {
          return new Date(dateString).toLocaleDateString('id-ID');
        } catch (error) {
          console.warn('Date formatting error:', error);
          return dateString;
        }
      };
      
      const totalPenjualan = salesData.reduce((sum, item) => sum + (item.harga || 0), 0);
      const totalFeePenjual = salesData.reduce((sum, item) => sum + (item.feePenjual || 0), 0);
      const totalSetoranBersih = salesData.reduce((sum, item) => sum + (item.setoranBersih || 0), 0);
      
      console.log('PDF calculations completed:', { totalPenjualan, totalFeePenjual, totalSetoranBersih });
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      console.log('jsPDF document created');
      
      // Add title
      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246); // Blue color
      const title = options.title || 'Laporan Penjualan Voucher WiFi';
      const titleWidth = doc.getTextWidth(title);
      const pageWidth = doc.internal.pageSize.width;
      doc.text(title, (pageWidth - titleWidth) / 2, 20);
      
      // Add generation date
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102); // Gray color
      const dateText = `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      doc.text(dateText, 20, 30);
      
      // Add summary section
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text('Ringkasan Penjualan', 20, 45);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      let yPos = 55;
      
      doc.text(`Total Transaksi: ${salesData.length} transaksi`, 20, yPos);
      yPos += 7;
      doc.text(`Total Penjualan: ${formatCurrency(totalPenjualan)}`, 20, yPos);
      yPos += 7;
      doc.text(`Total Fee Penjual: ${formatCurrency(totalFeePenjual)}`, 20, yPos);
      yPos += 7;
      doc.text(`Total Setoran Bersih: ${formatCurrency(totalSetoranBersih)}`, 20, yPos);
      
      // Add table
      const tableColumns = [
        'No',
        'Tanggal',
        'Nama Pelanggan',
        'Paket',
        'Harga',
        'Kode Voucher',
        'Fee Penjual',
        'Setoran Bersih'
      ];
      
      const tableData = salesData.map((item, index) => {
        try {
          return [
            (index + 1).toString(),
            formatDate(item.tanggal || ''),
            item.namaPelanggan || '',
            item.paket || '',
            formatCurrency(item.harga || 0),
            item.kodeVoucher || '',
            formatCurrency(item.feePenjual || 0),
            formatCurrency(item.setoranBersih || 0)
          ];
        } catch (error) {
          console.warn('Error processing item:', item, error);
          return [
            (index + 1).toString(),
            'Error',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error'
          ];
        }
      });
      
      console.log('Table data prepared, rows:', tableData.length);
      
      doc.autoTable({
        head: [tableColumns],
        body: tableData,
        startY: yPos + 15,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 20 },
          4: { halign: 'right', cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { halign: 'right', cellWidth: 25 },
          7: { halign: 'right', cellWidth: 25 }
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: 20, right: 20 }
      });
      
      console.log('AutoTable added successfully');
      
      // Add footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text('Digenerate oleh Aplikasi Manajemen Penjualan Voucher WiFi', 20, pageHeight - 20);
      doc.text(`© ${new Date().getFullYear()} MGX - Semua hak dilindungi`, 20, pageHeight - 15);
      
      console.log('PDF generation completed successfully');
      return doc;
      
    } catch (error) {
      console.error('Error generating PDF content:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Check file system permissions
   */
  private async checkPermissions(): Promise<boolean> {
    try {
      if (!this.isNative()) {
        return true; // Web environment doesn't need permissions
      }
      
      // Try to write a test file to check permissions
      const testContent = 'test';
      const testResult = await Filesystem.writeFile({
        path: 'permission-test.txt',
        data: testContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      
      // Clean up test file
      try {
        await Filesystem.deleteFile({
          path: 'permission-test.txt',
          directory: Directory.Documents,
        });
      } catch (deleteError) {
        console.warn('Could not delete test file:', deleteError);
      }
      
      console.log('Permissions check passed:', testResult.uri);
      return true;
      
    } catch (error) {
      console.error('Permissions check failed:', error);
      return false;
    }
  }
  private async saveAsHTMLFallback(salesData: SalesData[], filename: string): Promise<void> {
    try {
      console.log('Using HTML fallback method');
      
      const htmlContent = this.generateHTMLContent(salesData, {
        title: 'Laporan Penjualan Voucher WiFi',
        filename: filename
      });
      
      if (this.isNative()) {
        try {
          // Try to save to Documents directory first
          const result = await Filesystem.writeFile({
            path: `${filename}.html`,
            data: htmlContent,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          });
          
          console.log('HTML file saved to:', result.uri);
          
          // Show success message
          toast.success('✅ Laporan disimpan sebagai HTML', {
            description: 'File tersimpan di Documents folder. Buka dengan browser untuk mencetak.'
          });
          
          // Try to share the HTML file
          if (Capacitor.getPlatform() === 'android') {
            await this.shareFile(result.uri);
          }
          
        } catch (fsError) {
          console.warn('Documents directory failed, trying Downloads:', fsError);
          
          // Fallback to Downloads directory
          try {
            const result = await Filesystem.writeFile({
              path: `${filename}.html`,
              data: htmlContent,
              directory: Directory.Cache, // Use Cache as fallback
              encoding: Encoding.UTF8,
            });
            
            console.log('HTML file saved to Cache:', result.uri);
            
            toast.success('✅ Laporan disimpan', {
              description: 'File HTML tersimpan. Gunakan file manager untuk mengakses.'
            });
            
            if (Capacitor.getPlatform() === 'android') {
              await this.shareFile(result.uri);
            }
            
          } catch (cacheError) {
            console.error('Cache directory also failed:', cacheError);
            // Final fallback: browser download
            this.downloadHTMLFile(htmlContent, filename);
            
            toast.success('✅ Download dimulai', {
              description: 'File HTML akan didownload melalui browser.'
            });
          }
        }
      } else {
        // Web environment - direct download
        this.downloadHTMLFile(htmlContent, filename);
        
        toast.success('✅ Download dimulai', {
          description: 'File HTML akan didownload. Buka dengan browser untuk mencetak.'
        });
      }
      
    } catch (error) {
      console.error('HTML fallback save error:', error);
      
      // Ultimate fallback: create a simple text report
      const textReport = this.generateTextReport(salesData);
      
      if (this.isNative()) {
        try {
          const result = await Filesystem.writeFile({
            path: `${filename}.txt`,
            data: textReport,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
          });
          
          toast.success('✅ Laporan disimpan sebagai teks', {
            description: 'File teks tersimpan di Cache folder.'
          });
          
          if (Capacitor.getPlatform() === 'android') {
            await this.shareFile(result.uri);
          }
          
        } catch {
          // If everything fails, show error
          toast.error('❌ Gagal menyimpan laporan', {
            description: 'Periksa izin aplikasi dan ruang penyimpanan.'
          });
        }
      } else {
        // Web fallback: download as text
        const blob = new Blob([textReport], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('✅ Download dimulai', {
          description: 'Laporan teks akan didownload.'
        });
      }
    }
  }
  /**
   * Generate simple text report as ultimate fallback
   */
  private generateTextReport(salesData: SalesData[]): string {
    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;
    const formatDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString('id-ID');
      } catch {
        return dateString;
      }
    };
    
    const totalPenjualan = salesData.reduce((sum, item) => sum + (item.harga || 0), 0);
    const totalFeePenjual = salesData.reduce((sum, item) => sum + (item.feePenjual || 0), 0);
    const totalSetoranBersih = salesData.reduce((sum, item) => sum + (item.setoranBersih || 0), 0);
    
    let report = '';
    report += '==========================================\n';
    report += '    LAPORAN PENJUALAN VOUCHER WIFI\n';
    report += '==========================================\n\n';
    
    report += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}\n\n`;
    
    report += 'RINGKASAN PENJUALAN:\n';
    report += '------------------------------------------\n';
    report += `Total Transaksi: ${salesData.length} transaksi\n`;
    report += `Total Penjualan: ${formatCurrency(totalPenjualan)}\n`;
    report += `Total Fee Penjual: ${formatCurrency(totalFeePenjual)}\n`;
    report += `Total Setoran Bersih: ${formatCurrency(totalSetoranBersih)}\n\n`;
    
    report += 'DETAIL TRANSAKSI:\n';
    report += '------------------------------------------\n';
    
    if (salesData.length === 0) {
      report += 'Belum ada data penjualan\n';
    } else {
      salesData.forEach((item, index) => {
        report += `${index + 1}. ${formatDate(item.tanggal || '')}\n`;
        report += `   Nama: ${item.namaPelanggan || 'N/A'}\n`;
        report += `   Paket: ${item.paket || 'N/A'}\n`;
        report += `   Harga: ${formatCurrency(item.harga || 0)}\n`;
        report += `   Kode Voucher: ${item.kodeVoucher || 'N/A'}\n`;
        report += `   Fee Penjual: ${formatCurrency(item.feePenjual || 0)}\n`;
        report += `   Setoran Bersih: ${formatCurrency(item.setoranBersih || 0)}\n`;
        report += '\n';
      });
    }
    
    report += '------------------------------------------\n';
    report += 'Digenerate oleh Aplikasi Voucher WiFi\n';
    report += `© ${new Date().getFullYear()} MGX\n`;
    report += '==========================================';
    
    return report;
  }

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
      console.log('Starting PDF export...', { 
        isNative: this.isNative(), 
        platform: Capacitor.getPlatform(),
        dataLength: salesData.length 
      });
      
      // Validate input data
      if (!salesData || salesData.length === 0) {
        toast.error('❌ Tidak ada data untuk diekspor', {
          description: 'Pastikan ada data penjualan sebelum membuat laporan.'
        });
        return;
      }
      
      // Check permissions for native platforms
      if (this.isNative()) {
        console.log('Checking permissions for native platform...');
        const hasPermissions = await this.checkPermissions();
        if (!hasPermissions) {
          console.warn('Permissions check failed, but continuing with limited access...');
          // Don't return here, instead try with limited access
        }
      }
      
      const filename = options.filename || `laporan-voucher-${new Date().toISOString().split('T')[0]}`;
      
      if (this.isNative()) {
        console.log('Using native PDF generation with jsPDF');
        try {
          // Native mobile environment - use jsPDF for actual PDF generation
          const doc = this.generatePDFContent(salesData, options);
          console.log('PDF document generated successfully');
          
          const pdfBlob = doc.output('blob');
          console.log('PDF blob created, size:', pdfBlob.size, 'bytes');
          
          await this.savePDFToFileSystem(pdfBlob, filename);
        } catch (pdfError) {
          console.error('PDF generation failed, trying HTML fallback:', pdfError);
          
          // If PDF generation fails, try HTML fallback
          toast.info('🗖️ Menggunakan format HTML', {
            description: 'PDF gagal dibuat, menyimpan sebagai HTML'
          });
          
          await this.saveAsHTMLFallback(salesData, filename);
          return; // Exit early since fallback handles its own success message
        }
      } else {
        console.log('Using web HTML preview');
        // Web environment - use HTML for printing (fallback)
        const htmlContent = this.generateHTMLContent(salesData, options);
        await this.openPrintWindow(htmlContent);
      }
      
      toast.success('✅ Laporan berhasil digenerate!', {
        description: this.isNative() ? 
          'File PDF telah disimpan ke Documents' : 
          'Silakan gunakan Ctrl+P untuk print atau simpan sebagai PDF'
      });
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      
      // More detailed error handling
      if (error instanceof Error) {
        if (error.message.includes('jsPDF')) {
          toast.error('❌ Gagal membuat PDF', {
            description: 'Error pada generator PDF. Silakan coba lagi.'
          });
        } else if (error.message.includes('Memory') || error.message.includes('memory')) {
          toast.error('❌ Memori tidak cukup', {
            description: 'Data terlalu besar untuk diproses. Coba dengan data yang lebih kecil.'
          });
        } else {
          toast.error('❌ Gagal membuat laporan', {
            description: `Error: ${error.message}. Silakan coba lagi.`
          });
        }
      } else {
        toast.error('❌ Gagal membuat laporan', {
          description: 'Terjadi kesalahan tidak dikenal. Silakan coba lagi.'
        });
      }
    }
  }
  
  /**
   * Save PDF blob to filesystem for native apps
   */
  private async savePDFToFileSystem(pdfBlob: Blob, filename: string): Promise<void> {
    try {
      console.log('Starting PDF save process...', { filename, blobSize: pdfBlob.size });
      
      // Convert blob to base64 for Capacitor
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Data = btoa(binary);
      
      console.log('Base64 conversion completed, length:', base64Data.length);
      
      try {
        // Try Documents directory first
        const result = await Filesystem.writeFile({
          path: `${filename}.pdf`,
          data: base64Data,
          directory: Directory.Documents,
        });
        
        console.log('PDF file saved successfully to Documents:', result.uri);
        
        // Show success message
        toast.success('✅ PDF berhasil disimpan!', {
          description: 'File PDF tersimpan di Documents folder.'
        });
        
        // Try to share the PDF file
        if (Capacitor.getPlatform() === 'android') {
          await this.shareFile(result.uri);
        }
        
      } catch (documentsError) {
        console.warn('Documents directory failed, trying Cache:', documentsError);
        
        // Fallback to Cache directory
        try {
          const result = await Filesystem.writeFile({
            path: `${filename}.pdf`,
            data: base64Data,
            directory: Directory.Cache,
          });
          
          console.log('PDF file saved to Cache:', result.uri);
          
          toast.success('✅ PDF disimpan di Cache!', {
            description: 'File PDF tersimpan. Gunakan file manager untuk mengakses.'
          });
          
          if (Capacitor.getPlatform() === 'android') {
            await this.shareFile(result.uri);
          }
          
        } catch (cacheError) {
          console.error('Cache directory also failed:', cacheError);
          throw cacheError; // Re-throw to trigger HTML fallback
        }
      }
      
    } catch (error) {
      console.error('PDF filesystem save error:', error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
          console.log('Permission denied, trying fallback methods');
        } else if (error.message.includes('No space') || error.message.includes('ENOSPC')) {
          toast.error('❌ Ruang penyimpanan penuh', {
            description: 'Tidak ada cukup ruang untuk menyimpan file PDF.'
          });
          return; // Don't try fallback if no space
        }
      }
      
      // Fallback to browser download if available
      if (!this.isNative()) {
        console.log('Attempting browser PDF download...');
        this.downloadPDFFile(pdfBlob, filename);
        
        toast.success('✅ Download PDF dimulai!', {
          description: 'File PDF akan didownload melalui browser.'
        });
      } else {
        // Re-throw error to trigger HTML fallback
        throw error;
      }
    }
  }
  
  /**
   * Download PDF file directly in browser
   */
  private downloadPDFFile(pdfBlob: Blob, filename: string): void {
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Save HTML content to filesystem for native apps (fallback method)
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