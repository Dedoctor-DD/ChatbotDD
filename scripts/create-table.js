import https from 'https';

const token = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_aff5587b227798c53aa466d7b36b987c9a7e1806';
const projectRef = 'utsuqmulvfcyxqlonlnf';
const sql = `
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Enable insert for all users'
    ) THEN
        CREATE POLICY "Enable insert for all users" ON messages FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Enable select for all users'
    ) THEN
        CREATE POLICY "Enable select for all users" ON messages FOR SELECT USING (true);
    END IF;
END $$;
`;

const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${projectRef}/database/query`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Script'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('SUCCESS: SQL executed.');
            console.log(data);
        } else {
            console.log('FAILURE: SQL execution failed.');
            console.log(data);
        }
    });
});

req.write(JSON.stringify({ query: sql }));
req.end();
