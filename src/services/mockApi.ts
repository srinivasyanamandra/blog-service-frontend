import { User, Post, Comment, DashboardMetrics } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const generateToken = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

let currentUser: User | null = null;

const mockUsers: User[] = [
  {
    id: 1,
    name: 'Srinivas',
    email: 'srinivas@pranublog.com',
    role: 'AUTHOR',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Demo User',
    email: 'demo@pranublog.com',
    role: 'AUTHOR',
    lastLoginAt: new Date().toISOString(),
  },
];

let mockPosts: Post[] = [
  {
    id: 101,
    author: { id: 1, name: 'Srinivas', email: 'srinivas@pranublog.com' },
    title: 'How to Build PranuBlog',
    slug: 'how-to-build-pranublog',
    shareToken: generateToken(),
    content: '<h2>Introduction</h2><p>Building a modern blog platform requires careful planning and execution. In this post, we will explore the key features and architecture of PranuBlog.</p><h2>Key Features</h2><p>PranuBlog offers a rich set of features including draft management, analytics, comments, and more.</p>',
    excerpt: 'Learn how to build a modern blog platform with React and TypeScript',
    coverImageUrl: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=800',
    status: 'PUBLISHED',
    isPublic: true,
    allowComments: true,
    views: { '2025-11-20': 120, '2025-11-21': 95, '2025-11-22': 150 },
    likes: { guest: 15, user_1: true, user_2: true },
    favorites: { user_1: true },
    comments: {
      c1: {
        id: 'c1',
        author: 'Guest User',
        content: 'Great article! Very informative.',
        createdAt: '2025-11-21T10:30:00',
        replies: [
          {
            id: 'c1-r1',
            author: 'Srinivas',
            userId: 1,
            content: 'Thank you for reading!',
            createdAt: '2025-11-21T11:00:00',
            replies: [],
          },
        ],
      },
      c2: {
        id: 'c2',
        author: 'Tech Enthusiast',
        content: 'Looking forward to more posts like this.',
        createdAt: '2025-11-22T14:15:00',
        replies: [],
      },
    },
    metrics: { readingTimeMin: 7, wordCount: 1200 },
    createdAt: '2025-11-20T09:00:00',
    updatedAt: '2025-11-23T13:00:00',
  },
  {
    id: 102,
    author: { id: 1, name: 'Srinivas', email: 'srinivas@pranublog.com' },
    title: 'Getting Started with React',
    slug: 'getting-started-with-react',
    shareToken: '',
    content: '<h2>Why React?</h2><p>React is a powerful library for building user interfaces. This post covers the basics.</p>',
    excerpt: 'A beginner-friendly guide to React fundamentals',
    coverImageUrl: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800',
    status: 'DRAFT',
    isPublic: false,
    allowComments: true,
    views: {},
    likes: {},
    favorites: {},
    comments: {},
    metrics: { readingTimeMin: 5, wordCount: 850 },
    createdAt: '2025-11-23T08:00:00',
    updatedAt: '2025-11-23T10:30:00',
  },
  {
    id: 103,
    author: { id: 1, name: 'Srinivas', email: 'srinivas@pranublog.com' },
    title: 'TypeScript Best Practices',
    slug: 'typescript-best-practices',
    shareToken: generateToken(),
    content: '<h2>Type Safety</h2><p>TypeScript brings type safety to JavaScript. Here are some best practices to follow.</p><h2>Advanced Types</h2><p>Leverage union types, intersection types, and generics for better code.</p>',
    excerpt: 'Essential TypeScript patterns and practices for modern development',
    coverImageUrl: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=800',
    status: 'PUBLISHED',
    isPublic: true,
    allowComments: true,
    views: { '2025-11-22': 80, '2025-11-23': 110 },
    likes: { guest: 8, user_1: true },
    favorites: { user_1: true },
    comments: {},
    metrics: { readingTimeMin: 6, wordCount: 1050 },
    createdAt: '2025-11-22T10:00:00',
    updatedAt: '2025-11-23T09:00:00',
  },
];

let nextPostId = 104;
let nextCommentId = 100;

export const mockApi = {
  auth: {
    login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
      await delay(500);

      const user = mockUsers.find(u => u.email === email);
      if (!user || password !== 'password') {
        throw new Error('Invalid credentials');
      }

      currentUser = { ...user, lastLoginAt: new Date().toISOString() };
      return {
        token: 'mock-jwt-token-' + generateToken(),
        user: currentUser,
      };
    },

    signup: async (name: string, email: string, password: string): Promise<{ token: string; user: User }> => {
      await delay(500);

      if (mockUsers.find(u => u.email === email)) {
        throw new Error('User already exists');
      }

      const newUser: User = {
        id: mockUsers.length + 1,
        name,
        email,
        role: 'AUTHOR',
        lastLoginAt: new Date().toISOString(),
      };

      mockUsers.push(newUser);
      currentUser = newUser;

      return {
        token: 'mock-jwt-token-' + generateToken(),
        user: newUser,
      };
    },

    logout: async (): Promise<void> => {
      await delay(300);
      currentUser = null;
    },

    getCurrentUser: (): User | null => {
      return currentUser;
    },
  },

  posts: {
    list: async (): Promise<Post[]> => {
      await delay(400);
      return [...mockPosts].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },

    getBySlug: async (slug: string): Promise<Post> => {
      await delay(300);
      const post = mockPosts.find(p => p.slug === slug);
      if (!post) {
        throw new Error('Post not found');
      }
      return { ...post };
    },

    getById: async (id: number): Promise<Post> => {
      await delay(300);
      const post = mockPosts.find(p => p.id === id);
      if (!post) {
        throw new Error('Post not found');
      }
      return { ...post };
    },

    create: async (postData: Partial<Post>): Promise<Post> => {
      await delay(500);

      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      const newPost: Post = {
        id: nextPostId++,
        author: { id: currentUser.id, name: currentUser.name, email: currentUser.email },
        title: postData.title || 'Untitled Post',
        slug: slugify(postData.title || 'untitled-post') + '-' + Date.now(),
        shareToken: '',
        content: postData.content || '',
        excerpt: postData.excerpt || '',
        coverImageUrl: postData.coverImageUrl || '',
        status: 'DRAFT',
        isPublic: postData.isPublic ?? false,
        allowComments: postData.allowComments ?? true,
        views: {},
        likes: {},
        favorites: {},
        comments: {},
        metrics: {
          readingTimeMin: Math.ceil((postData.content || '').split(' ').length / 200),
          wordCount: (postData.content || '').split(' ').length,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockPosts.push(newPost);
      return newPost;
    },

    update: async (id: number, postData: Partial<Post>): Promise<Post> => {
      await delay(500);

      const index = mockPosts.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('Post not found');
      }

      const updatedPost = {
        ...mockPosts[index],
        ...postData,
        slug: postData.title ? slugify(postData.title) : mockPosts[index].slug,
        metrics: {
          readingTimeMin: Math.ceil((postData.content || mockPosts[index].content).split(' ').length / 200),
          wordCount: (postData.content || mockPosts[index].content).split(' ').length,
        },
        updatedAt: new Date().toISOString(),
      };

      mockPosts[index] = updatedPost;
      return updatedPost;
    },

    publish: async (id: number): Promise<{ shareToken: string; status: string }> => {
      await delay(400);

      const index = mockPosts.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('Post not found');
      }

      const shareToken = generateToken();
      mockPosts[index].shareToken = shareToken;
      mockPosts[index].status = 'PUBLISHED';
      mockPosts[index].updatedAt = new Date().toISOString();

      return { shareToken, status: 'PUBLISHED' };
    },

    delete: async (id: number): Promise<void> => {
      await delay(400);
      const index = mockPosts.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('Post not found');
      }
      mockPosts.splice(index, 1);
    },

    like: async (id: number, userId?: number): Promise<Record<string, boolean | number>> => {
      await delay(300);

      const post = mockPosts.find(p => p.id === id);
      if (!post) {
        throw new Error('Post not found');
      }

      const key = userId ? `user_${userId}` : 'guest';

      if (key === 'guest') {
        post.likes[key] = (post.likes[key] as number || 0) + 1;
      } else {
        post.likes[key] = !post.likes[key];
      }

      return post.likes;
    },

    comment: async (
      id: number,
      content: string,
      userId?: number,
      parentCommentId?: string
    ): Promise<Record<string, Comment>> => {
      await delay(400);

      const post = mockPosts.find(p => p.id === id);
      if (!post) {
        throw new Error('Post not found');
      }

      const commentId = 'c' + nextCommentId++;
      const newComment: Comment = {
        id: commentId,
        author: userId ? currentUser?.name || 'User' : 'Guest',
        userId,
        content,
        createdAt: new Date().toISOString(),
        replies: [],
      };

      if (parentCommentId) {
        const parentComment = post.comments[parentCommentId];
        if (parentComment) {
          parentComment.replies.push(newComment);
        }
      } else {
        post.comments[commentId] = newComment;
      }

      return post.comments;
    },
  },

  analytics: {
    getDashboardMetrics: async (): Promise<DashboardMetrics> => {
      await delay(400);

      const userPosts = mockPosts.filter(p => p.author.id === currentUser?.id);

      const totalViews = userPosts.reduce((sum, post) => {
        return sum + Object.values(post.views).reduce((a, b) => a + b, 0);
      }, 0);

      const totalLikes = userPosts.reduce((sum, post) => {
        return sum + Object.values(post.likes).reduce((a, b) => {
          return a + (typeof b === 'number' ? b : (b ? 1 : 0));
        }, 0);
      }, 0);

      const topPosts = userPosts
        .filter(p => p.status === 'PUBLISHED')
        .map(p => ({
          id: p.id,
          title: p.title,
          views: Object.values(p.views).reduce((a, b) => a + b, 0),
          likes: Object.values(p.likes).reduce((a, b) =>
            a + (typeof b === 'number' ? b : (b ? 1 : 0)), 0
          ),
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      return {
        totalPosts: userPosts.length,
        published: userPosts.filter(p => p.status === 'PUBLISHED').length,
        drafts: userPosts.filter(p => p.status === 'DRAFT').length,
        totalViews,
        totalLikes,
        topPosts,
      };
    },
  },
};
