const axios = require('axios');

(async () => {
  try {
    // Get a valid token first
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      usernameOrEmail: 'ccbm',
      password: '123456'
    });
    const token = loginRes.data.data.token;
    console.log('✅ Logged in, token:', token.substring(0, 20) + '...');
    
    // Fetch posts
    const postsRes = await axios.get('http://localhost:5000/api/posts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ Posts count:', postsRes.data.posts?.length);
    if (postsRes.data.posts && postsRes.data.posts.length > 0) {
      console.log('\n📌 First post:');
      console.log(JSON.stringify(postsRes.data.posts[0], null, 2));
    }
  } catch (e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
  process.exit(0);
})();
