-- 1. Create table for queue status of active duty users
CREATE TABLE queue_status (
  discord_id text PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
  status text CHECK (status IN ('unavailable', 'queued', 'manager', 'story')),
  
  -- Manager specific fields
  manager_start_time timestamp with time zone,
  
  -- Story specific fields
  story_target_time text, -- the HH:MM time typed by the user (or null)
  story_gang_1 text,
  story_gang_2 text,
  story_type text,
  story_locked boolean DEFAULT false, -- this is true when the target time is reached
  story_premium integer, -- from premium input if exists in design
  
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Enable Realtime on queue_status (Run this manually in Supabase Dashboard if the below command fails)
-- ALTER PUBLICATION supabase_realtime ADD TABLE queue_status;

-- 3. Create table for Queue Manager Logs (History)
CREATE TABLE queue_manager_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id text NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  duration_minutes integer, -- calculated on end
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Create table for Story Logs (History)
CREATE TABLE story_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id text NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  gang_1 text,
  gang_2 text,
  story_type text,
  story_target_time text, -- the original HH:MM they inputted
  start_time timestamp with time zone NOT NULL, -- when it auto-ticked
  end_time timestamp with time zone, -- when they unchecked it
  duration_minutes integer,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Set up RLS Policies (Allow everyone access for ease of use)
ALTER TABLE queue_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_manager_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read queue_status" ON queue_status FOR SELECT USING (true);
CREATE POLICY "Allow public insert queue_status" ON queue_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update queue_status" ON queue_status FOR UPDATE USING (true);
CREATE POLICY "Allow public delete queue_status" ON queue_status FOR DELETE USING (true);

CREATE POLICY "Allow public read queue_manager_logs" ON queue_manager_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert queue_manager_logs" ON queue_manager_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update queue_manager_logs" ON queue_manager_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete queue_manager_logs" ON queue_manager_logs FOR DELETE USING (true);

CREATE POLICY "Allow public read story_logs" ON story_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert story_logs" ON story_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update story_logs" ON story_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete story_logs" ON story_logs FOR DELETE USING (true);
