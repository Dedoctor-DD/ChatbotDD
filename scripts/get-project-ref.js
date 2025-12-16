import https from 'https';

const token = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_aff5587b227798c53aa466d7b36b987c9a7e1806';

const options = {
    hostname: 'api.supabase.com',
    path: '/v1/projects',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Node.js Script'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const projects = JSON.parse(data);
            if (projects.length > 0) {
                console.log(`Project ID: ${projects[0].id}`);
                console.log(`Project Name: ${projects[0].name}`);
            } else {
                console.log("No projects found.");
            }
        } else {
            console.log(`Error: ${res.statusCode}`);
        }
    });
});

req.end();
