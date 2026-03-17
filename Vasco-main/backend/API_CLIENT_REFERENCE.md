# API Reference - Backend for Frontend

Below is a concise API map which your frontend can use to implement features (auth, posts, comments, messages, friends, notifications, etc.)

Base URL: http://localhost:5000

## Authentication (Auth)
- POST /api/auth/register
  - Body: { username, email, password, full_name, display_name, mssv }
  - Response: { message, user }
- POST /api/auth/login
  - Body: { usernameOrEmail, password }
  - Response: { token, user }
- POST /api/auth/logout (requires Authorization)
- GET /api/auth/me (requires Authorization) -> returns current user
- PUT /api/auth/change-password (requires Authorization)
  - Body: { old_password, new_password }

## Users
- POST /api/users -> create user (admin or public depending on flow)
- GET /api/users -> list users (admin/auth depending on role)
- GET /api/users/:id -> get user by id
- PUT /api/users/:id -> update user
- DELETE /api/users/:id -> delete (admin only)

## Posts
- POST /api/posts (requires Authorization, supports multipart/form-data for `media[]`)
  - Fields: text, and optional files under `media[]` (max 6 files)
  - Response: created post object
- GET /api/posts -> list posts (includes user and medias)
- GET /api/posts/:id -> get post by id
- PUT /api/posts/:id -> update post (admin or owner)
- DELETE /api/posts/:id -> delete post
- PUT /api/posts/:id/hide (admin only) -> hide a post (set is_hidden)

Notes:
- The `POST /api/posts` endpoint accepts `multipart/form-data` when sending media files. Use `Authorization` header with Bearer token.
- Server emits `new_post` event via socket.io with payload { post } after creating a post.

## Comments
- POST /api/comments (requires Authorization)
  - Body: { post_id, content }
  - Response: created comment
- GET /api/comments?post_id=ID -> list comments for a specific post (joins user to include `author` display name)
- GET /api/comments -> list all comments
- PUT /api/comments/:id -> update comment
- DELETE /api/comments/:id -> delete comment

Notes:
- Server emits `new_comment` event via socket.io with payload { comment } after creating a comment.

## Messages & Conversations
- POST /api/conversations (create conversation) - requires Authorization
- GET /api/conversations -> list conversations for current user
- GET /api/conversations/:id -> conversation details
- POST /api/conversations/:id/participants -> add participant to conversation
- DELETE /api/conversations/:id/participants -> remove participant

- POST /api/messages (requires Authorization)
- GET /api/messages?conversation_id=ID
- GET /api/messages/conversation/:conversationId

Socket events:
- join:conversation (client -> server, join a room)
- leave:conversation
- send:message (client) -> server emits receive:message to that room

## Friend Requests and Friendships
- POST /api/friend_requests -> create friend request (requires Authorization)
- GET /api/friend_requests -> list requests for current user (incoming/outgoing)
- PUT /api/friend_requests/:id -> update request (accept/decline)
- DELETE /api/friend_requests/:id -> remove request
- POST /api/friendships -> create friendship
- GET /api/friendships -> list friendships
- DELETE /api/friendships/:id -> delete friendship

## Notifications
- POST /api/notifications -> create (admin/system)
- GET /api/notifications -> get notifications for current user (requires Authorization)
- GET /api/notifications/user/:userId -> get notifications for a user (admin)
- PUT /api/notifications/:id/read -> mark as read
- DELETE /api/notifications/:id -> delete notification

## Media Upload
- POST /api/media/upload (requires Authorization) - single file under `file` field
- GET /api/media/:id -> get media

## Reactions
- POST /api/reactions -> create reaction (attach to post or comment)
- GET /api/reactions -> list
- DELETE /api/reactions/:id -> delete reaction

## Example fetch snippet (frontend)
- Using fetch (JS):

```js
const BASE = 'http://localhost:5000';

async function login(email, pwd) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: email, password: pwd })
  });
  return res.json();
}

async function fetchPosts(token) {
  const res = await fetch(`${BASE}/api/posts`, { headers: { Authorization: `Bearer ${token}`}});
  return res.json();
}

// Upload media example (create post with files)
async function createPostWithFiles(token, text, files) {
  const form = new FormData();
  form.append('text', text);
  files.forEach(f => form.append('media', f));
  const res = await fetch(`${BASE}/api/posts`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  return res.json();
}
```

## Socket.io (frontend)
```js
import { io } from 'socket.io-client';
const socket = io(BASE, { auth: { token } });
socket.on('connect', () => console.log('connected', socket.id));
socket.on('new_post', data => { console.log('New post:', data.post) });
socket.on('new_comment', data => { console.log('New comment:', data.comment) });
```

---

If you want, I can now:
- Generate a ready-to-use `frontend/src/api.js` file with helper functions for these endpoints and example usage (fetch/axios), or
- Add a `docs/API_CLIENT_REFERENCE.md` to the repo (I already created `API_CLIENT_REFERENCE.md`), or
- Implement a small sample frontend script that hits these endpoints to demonstrate the flow.

Which one would you like next?