-- Create the messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone (anon) to insert messages
-- Note: In a real app, you might want to restrict this to authenticated users
CREATE POLICY "Enable insert for all users" ON messages
  FOR INSERT WITH CHECK (true);

-- Create a policy to allow anyone to select messages (optional, for viewing history)
CREATE POLICY "Enable select for all users" ON messages
  FOR SELECT USING (true);
