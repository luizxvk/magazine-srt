const API_URL = 'http://localhost:3000';

async function main() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@magazine.com',
                password: 'admin123'
            })
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        }

        const token = loginData.token;
        console.log('Login successful. Token:', token.substring(0, 20) + '...');

        // 2. Get User
        console.log('Fetching /users/me...');
        const userRes = await fetch(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!userRes.ok) {
            const err = await userRes.text();
            throw new Error(`User fetch failed: ${userRes.status} ${err}`);
        }
        const userData = await userRes.json();
        console.log('User fetched:', userData.email);

        // 3. Get Daily Login Status
        console.log('Fetching /gamification/daily-login/status...');
        const statusRes = await fetch(`${API_URL}/gamification/daily-login/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!statusRes.ok) {
            const err = await statusRes.text();
            throw new Error(`Daily Login Status failed: ${statusRes.status} ${err}`);
        }

        const statusData = await statusRes.json();
        console.log('Daily Login Status:', statusData);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
