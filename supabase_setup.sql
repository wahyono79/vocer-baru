-- Supabase Database Schema Setup for WiFi Voucher Sales Application
-- Execute this SQL in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tanggal DATE NOT NULL,
    nama_pelanggan VARCHAR(255) NOT NULL,
    paket VARCHAR(20) NOT NULL CHECK (paket IN ('24 Jam', '7 Hari', '15 Hari', '30 Hari')),
    harga DECIMAL(10,2) NOT NULL,
    kode_voucher VARCHAR(100) NOT NULL,
    fee_penjual DECIMAL(10,2) NOT NULL,
    setoran_bersih DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create history table
CREATE TABLE IF NOT EXISTS public.history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    tanggal DATE NOT NULL,
    nama_pelanggan VARCHAR(255) NOT NULL,
    paket VARCHAR(20) NOT NULL,
    harga DECIMAL(10,2) NOT NULL,
    kode_voucher VARCHAR(100) NOT NULL,
    fee_penjual DECIMAL(10,2) NOT NULL,
    setoran_bersih DECIMAL(10,2) NOT NULL,
    tanggal_setor DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('success', 'error', 'info')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_tanggal ON public.sales(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_sales_nama_pelanggan ON public.sales(nama_pelanggan);
CREATE INDEX IF NOT EXISTS idx_history_tanggal_setor ON public.history(tanggal_setor DESC);
CREATE INDEX IF NOT EXISTS idx_history_sales_id ON public.history(sales_id);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON public.notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for sales table
DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) if desired
-- ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust according to your security needs)
-- CREATE POLICY "Enable all operations for authenticated users" ON public.sales
--     FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable all operations for authenticated users" ON public.history
--     FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable all operations for authenticated users" ON public.notifications
--     FOR ALL USING (auth.role() = 'authenticated');

-- Sample data for testing (optional)
-- INSERT INTO public.sales (tanggal, nama_pelanggan, paket, harga, kode_voucher, fee_penjual, setoran_bersih)
-- VALUES 
--     ('2024-08-25', 'John Doe', '24 Jam', 15000, 'VOUCHER001', 2000, 13000),
--     ('2024-08-25', 'Jane Smith', '7 Hari', 45000, 'VOUCHER002', 5000, 40000);

-- IMPORTANT NOTES:
-- 1. Make sure to run this SQL in your Supabase SQL Editor
-- 2. The schema matches the TypeScript types defined in your application
-- 3. UUIDs are used for primary keys for better scalability
-- 4. Row Level Security (RLS) policies are commented out - enable them based on your security requirements
-- 5. The tables use proper constraints and indexes for performance and data integrity