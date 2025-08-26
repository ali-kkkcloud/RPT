-- G4S Fleet Management Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create offline_status table for vehicle status updates
CREATE TABLE IF NOT EXISTS offline_status (
  id BIGSERIAL PRIMARY KEY,
  vehicle_number TEXT NOT NULL UNIQUE,
  current_status TEXT NOT NULL DEFAULT 'Offline' CHECK (current_status IN ('Online', 'Parking/Garage', 'Dashcam Issue', 'Technical Problem')),
  reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offline_status_vehicle ON offline_status(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_offline_status_updated_at ON offline_status(updated_at);
CREATE INDEX IF NOT EXISTS idx_offline_status_current_status ON offline_status(current_status);

-- Create RLS (Row Level Security) policies
ALTER TABLE offline_status ENABLE ROW LEVEL SECURITY;

-- Policy to allow read access to all authenticated users
CREATE POLICY "Allow read access to offline_status" ON offline_status
  FOR SELECT USING (true);

-- Policy to allow insert/update for authenticated users
CREATE POLICY "Allow insert/update to offline_status" ON offline_status
  FOR ALL USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to call the function before update
DROP TRIGGER IF EXISTS update_offline_status_updated_at ON offline_status;
CREATE TRIGGER update_offline_status_updated_at
  BEFORE UPDATE ON offline_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
INSERT INTO offline_status (vehicle_number, current_status, reason) VALUES
  ('AP39HS4926', 'Dashcam Issue', 'Camera not responding - technician assigned'),
  ('AS01EH6877', 'Parking/Garage', 'Vehicle parked at depot for maintenance'),
  ('BR01PK9758', 'Technical Problem', 'GPS connectivity issues'),
  ('CG04MY9667', 'Online', 'Recently came back online')
ON CONFLICT (vehicle_number) DO NOTHING;

-- Create view for dashboard analytics
CREATE OR REPLACE VIEW offline_status_analytics AS
SELECT 
  current_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM offline_status 
GROUP BY current_status
ORDER BY count DESC;

-- Create function to get vehicle status history
CREATE OR REPLACE FUNCTION get_vehicle_status_history(vehicle_id TEXT)
RETURNS TABLE (
  status TEXT,
  reason TEXT,
  updated_at TIMESTAMPTZ,
  updated_by TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    os.current_status,
    os.reason,
    os.updated_at,
    os.updated_by
  FROM offline_status os
  WHERE os.vehicle_number = vehicle_id
  ORDER BY os.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON offline_status TO authenticated;
GRANT ALL ON offline_status TO anon;
GRANT USAGE, SELECT ON SEQUENCE offline_status_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE offline_status_id_seq TO anon;

-- Create function for the Next.js API (called via RPC)
CREATE OR REPLACE FUNCTION create_offline_status_table()
RETURNS BOOLEAN AS $$
BEGIN
  -- This function is called from Next.js to ensure table exists
  -- The table creation is handled above, so this just returns success
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Log successful setup
DO $$
BEGIN
  RAISE NOTICE 'G4S Fleet Management database setup completed successfully!';
  RAISE NOTICE 'Table created: offline_status';
  RAISE NOTICE 'Policies created for Row Level Security';
  RAISE NOTICE 'Triggers and functions created';
  RAISE NOTICE 'Sample data inserted (if not exists)';
END $$;
