/**
 * Test API response format for posts
 */

const BASE = 'http://localhost:5000';

async function testPostsAPI() {
  try {
    // Get token từ localStorage nếu có
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('No token found. Please login first.');
      return;
    }

    const response = await fetch(`${BASE}/api/posts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('========== Posts API Response ==========');
    console.log('Full response:', JSON.stringify(data, null, 2));
    console.log('Response structure:');
    console.log('- success:', data.success);
    console.log('- message:', data.message);
    console.log('- data:', data.data);
    console.log('- data.posts:', data.data?.posts);
    
    if (data.data?.posts && data.data.posts.length > 0) {
      const firstPost = data.data.posts[0];
      console.log('\nFirst Post:');
      console.log('- id:', firstPost.id);
      console.log('- User:', firstPost.User);
      console.log('- User.user_profile:', firstPost.User?.user_profile);
      console.log('- PostMedia:', firstPost.post_media || firstPost.PostMedia);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Chạy test
testPostsAPI();
