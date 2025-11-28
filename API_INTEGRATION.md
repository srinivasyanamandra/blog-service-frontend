# PranuBlog API Integration Guide

## Overview

PranuBlog frontend is now fully integrated with the real backend API running at `http://localhost:1910`. All authentication, post management, and user interactions are connected to the actual backend endpoints defined in the OpenAPI specification.

## Environment Setup

Add the following to your `.env` file:

```
VITE_API_BASE_URL=http://localhost:1910
```

The API client automatically picks this up from `import.meta.env.VITE_API_BASE_URL`.

## API Client Architecture

The frontend uses a centralized API client (`src/services/api.ts`) that handles:
- Request/response serialization
- JWT token management
- CORS headers
- Error handling

### Usage Example

```typescript
import { apiClient } from '../services/api';

// Login
const response = await apiClient.auth.login(email, password);
apiClient.setToken(response.token);

// Create post
const newPost = await apiClient.posts.create({ title, content, excerpt });

// Get posts
const posts = await apiClient.posts.list();

// Publish post
await apiClient.posts.publish(postId);
```

## Authentication Flow

### 1. Signup with OTP Verification

**Step 1: Signup**
```typescript
await apiClient.auth.signup(name, email, password);
// Response: User redirected to OTP verification screen
```

**Step 2: Verify OTP**
```typescript
const response = await apiClient.auth.verifyOtp(email, otp);
// Response: { token, user, userId, name, email, role, lastLoginAt }
```

**Step 3: Token Storage**
- Token is automatically stored in localStorage
- Token is sent in `Authorization: Bearer <token>` header for authenticated requests

### 2. Login
```typescript
const response = await apiClient.auth.login(email, password);
// Returns JWT token and user data
```

### 3. Logout
```typescript
logout(); // Clears token and user data
```

## Post Management

### Create Draft Post
```typescript
const post = await apiClient.posts.create({
  title: 'My First Post',
  content: '<p>Content here</p>',
  excerpt: 'Short summary',
  coverImageUrl: 'https://...',
  allowComments: true,
});
```

**Response**: Post object with `id`, `status: DRAFT`, empty `shareToken`

### Update Draft Post
```typescript
const updated = await apiClient.posts.update(postId, {
  title: 'Updated Title',
  content: 'Updated content',
  excerpt: 'Updated excerpt',
  coverImageUrl: 'https://...',
  allowComments: true,
});
```

### Publish Post
```typescript
const response = await apiClient.posts.publish(postId);
// Response: { shareToken: "uuid", status: "PUBLISHED" }
```

**What happens:**
- Post status changes from `DRAFT` to `PUBLISHED`
- Unique `shareToken` is generated
- Public URL becomes: `/posts/{shareToken}`

### List User's Posts
```typescript
const posts = await apiClient.posts.list();
// Returns array of all user's posts (both DRAFT and PUBLISHED)
```

### Get Single Post
```typescript
const post = await apiClient.posts.getById(postId);
```

### Delete Post
```typescript
await apiClient.posts.delete(postId);
```

## Public Post Viewing

### Access Public Post
```typescript
// No auth required - anyone can view
const post = await apiClient.posts.getPublic(shareToken);
```

**Response contains:**
```typescript
{
  id, title, content, excerpt, coverImageUrl, authorName,
  shareToken, status, metrics,
  likes: { count, entries: [...] },
  comments: { count, entries: [...] },
  views: { count, uniqueViewers, entries: [...] }
}
```

## Interactions (Likes & Comments)

### Like a Public Post
```typescript
await apiClient.posts.like(shareToken, {});
// Increments like count, adds entry to likes.entries
```

### Add Comment
```typescript
await apiClient.posts.comment(shareToken, {
  userId: user?.id,           // Optional if logged in
  content: 'Great post!',
});
```

**Response**: Updated `comments` object with new entry

### Add Reply to Comment
```typescript
await apiClient.posts.reply(shareToken, {
  parentCommentId: 'comment-123',
  userId: user?.id,
  content: 'Thanks for the feedback!',
});
```

## Dashboard Analytics

### Get Dashboard Metrics
```typescript
const metrics = await apiClient.dashboard.get();
```

**Response:**
```typescript
{
  totalPosts: 5,
  publishedPosts: 3,
  draftPosts: 2,
  totalViews: 1250,
  totalLikes: 89,
  totalComments: 23,
  recentPosts: [...],      // Last 5 posts
  popularPosts: [...]      // Top 5 by views
}
```

## Data Structures

### Post Object
```typescript
interface Post {
  id: number;
  title: string;
  slug: string;
  shareToken: string;
  excerpt: string;
  coverImageUrl: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublic: boolean;
  allowComments: boolean;
  authorName: string;
  createdAt: string;
  updatedAt: string;

  metrics: {
    views: number;
    likes: number;
    comments: number;
  };

  likes: {
    count: number;
    entries: Array<{
      userId?: number;
      guestName?: string;
      likedAt: string;
    }>;
  };

  comments: {
    count: number;
    entries: CommentEntry[];
  };

  views: {
    count: number;
    uniqueViewers: number;
    entries: Array<{
      viewerGuestId: string;
      viewedAt: string;
      referrer?: string;
      userAgent?: string;
    }>;
  };
}
```

### Get Dashboard Posts (Paginated)
Use this endpoint to fetch posts with server-side pagination, filtering, and sort.

```typescript
const page = await apiClient.dashboard.posts({
  page: 0,
  size: 10,
  title: 'spring',
  status: 'PUBLISHED',
  createdFrom: '2024-01-01T00:00:00',
  createdTo: '2024-12-31T23:59:59',
  sortDirection: 'DESC'
});
console.log(page.content, page.totalElements, page.totalPages);
```

The response structure is the same as described in the API docs: `content`, `pageNumber`, `pageSize`, `totalElements`, `totalPages`, `first`, `last`, `empty`.

### Comment Entry
```typescript
interface CommentEntry {
  commentId: string;
  userId?: number;
  guestName?: string;
  content: string;
  createdAt: string;
  replies: CommentEntry[];
}
```

## Error Handling

All API calls throw errors with descriptive messages:

```typescript
try {
  const post = await apiClient.posts.getById(999);
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message); // "Post not found" or API error
  }
}
```

**Common Errors:**
- `Invalid credentials` - Login failed
- `Invalid or expired OTP` - OTP verification failed
- `Post not found` - Post doesn't exist or not authorized
- `User not authenticated` - Token missing or expired

## State Management

The app uses React Context for authentication state:

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const {
    user,           // Current user or null
    isAuthenticated, // true if logged in
    login,
    signup,
    verifyOtp,
    resendOtp,
    logout,
    pendingEmail    // Email awaiting OTP verification
  } = useAuth();
}
```

## Pages & Routes

### Public Routes
- `/login` - Login/Signup page
- `/posts/:slug` - Public post view (no auth required)

### Protected Routes (require login)
- `/dashboard` - Dashboard with posts list and metrics
- `/create` - Create new post (draft)
- `/edit/:id` - Edit existing post

## Features Implemented

✅ User signup with email OTP verification
✅ JWT token-based authentication
✅ Create/update/delete posts
✅ Publish draft posts with share token generation
✅ View public posts by share token
✅ Like posts (guest or authenticated)
✅ Comment on posts with nested replies
✅ Dashboard analytics and metrics
✅ Responsive design matching site theme
✅ Sunflower icon in logo
✅ Error handling and validation

## Testing the Integration

### Local Development
1. Start backend: `java -jar pranu-blog-api.jar`
2. Backend runs on: `http://localhost:1910`
3. Frontend dev server: `npm run dev`
4. Visit: `http://localhost:5173`

### Test Workflow
1. Click "Sign Up"
2. Enter name, email, password (min 6 chars)
3. Check email for 6-digit OTP
4. Enter OTP and verify
5. Redirected to dashboard
6. Create new post → Save draft → Edit → Publish
7. Share published post link
8. Open in incognito window to test public viewing
9. Like and comment as guest
10. Login again to see authored posts

## Deployment Notes

### Environment Variables Required
- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:1910)

### CORS Configuration
Backend must allow requests from frontend origin:
```
Access-Control-Allow-Origin: http://localhost:5173 (dev) or your frontend domain
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey
```

### Token Expiration
Tokens are stored in localStorage. Implement token refresh logic if backend returns 401.

## API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/verify-otp` | No | Verify email OTP |
| POST | `/api/auth/resend-otp` | No | Resend OTP |
| POST | `/api/auth/login` | No | Login user |
| GET | `/api/posts` | Yes | List user's posts |
| POST | `/api/posts` | Yes | Create draft post |
| GET | `/api/posts/:id` | Yes | Get post by ID |
| PUT | `/api/posts/:id` | Yes | Update post |
| DELETE | `/api/posts/:id` | Yes | Delete post |
| POST | `/api/posts/:id/publish` | Yes | Publish post |
| POST | `/api/posts/:id/unpublish` | Yes | Unpublish post |
| GET | `/api/posts/public/:shareToken` | No | Get public post |
| POST | `/api/posts/public/:shareToken/like` | No | Like post |
| POST | `/api/posts/public/:shareToken/comments` | No | Add comment |
| POST | `/api/posts/public/:shareToken/replies` | No | Add reply |
| GET | `/api/dashboard` | Yes | Get analytics |

For detailed API specification, see the OpenAPI spec provided.
