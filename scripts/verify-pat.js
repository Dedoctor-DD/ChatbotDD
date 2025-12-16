import https from 'https';

const token = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_aff5587b227798c53aa466d7b36b987c9a7e1806';

console.log('Verifying PAT...');

const options = {
    hostname: 'api.supabase.com',
    path: '/v1/projects',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Node.js Verification Script'
    }
};

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('SUCCESS: Token accepted. Found projects.');
            try {
                const projects = JSON.parse(data);
                console.log(`Number of projects: ${projects.length}`);
                projects.forEach(p => console.log(`- ${p.name} (${p.id})`));
            } catch (e) {
                console.log("Could not parse response.");
            }
        } else {
            console.log('FAILURE: Token rejected or API error.');
            console.log('Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
