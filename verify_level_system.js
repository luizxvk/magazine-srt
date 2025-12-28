const API_URL = 'http://localhost:3000';

async function main() {
    try {
        // 1. Login as Admin
        console.log('Logging in as Admin...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@magazine.com',
                password: 'admin123'
            })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        const token = loginData.token;
        const adminId = loginData.user.id;
        console.log('Admin logged in.');

        // 2. Update Admin's Level (Self-update for testing)
        console.log(`Updating level for user ${adminId} to 15...`);
        const updateRes = await fetch(`${API_URL}/users/${adminId}/level`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ level: 15 })
        });

        if (!updateRes.ok) {
            const err = await updateRes.text();
            throw new Error(`Update failed: ${updateRes.status} ${err}`);
        }
        const updatedUser = await updateRes.json();
        console.log('Update response:', updatedUser);

        if (updatedUser.level === 15) {
            console.log('SUCCESS: Level updated to 15.');
        } else {
            console.error('FAILURE: Level mismatch.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
