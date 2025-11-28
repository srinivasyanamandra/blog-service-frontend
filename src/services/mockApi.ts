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
    dashboard: {
      get: async (params: {
        search?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
        favoritesOnly?: boolean;
        sortBy?: 'RECENT' | 'TOP_VIEWS' | 'TOP_LIKES' | 'TOP_COMMENTS';
        page?: number;
        size?: number;
      } = {}) => {
        await delay(300);
        const page = params.page ?? 0;
        const size = params.size ?? 10;

        const userPosts = mockPosts.filter(p => p.author.id === currentUser?.id);

        // Metrics
        const totalViews = userPosts.reduce((sum, post) => sum + Object.values(post.views).reduce((a, b) => a + b, 0), 0);
        const totalLikes = userPosts.reduce((sum, post) => sum + Object.values(post.likes).reduce((a, b) => a + (typeof b === 'number' ? b : (b ? 1 : 0)), 0), 0);
        const totalComments = userPosts.reduce((sum, post) => sum + Object.values(post.comments || {}).length, 0);
        const totalFavorites = userPosts.reduce((sum, post) => sum + Object.values(post.favorites || {}).filter(Boolean).length, 0);

        const publishedCount = userPosts.filter(p => p.status === 'PUBLISHED').length;
        const draftsCount = userPosts.filter(p => p.status === 'DRAFT').length;

        // Build recentPosts (RECENT sorted by createdAt desc)
        const recentSorted = userPosts.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const recentStart = 0;
        const recentContent = recentSorted.slice(recentStart, recentStart + Math.max(5, size)).map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          coverImageUrl: p.coverImageUrl,
          status: p.status,
          isPublic: p.isPublic,
          allowComments: p.allowComments,
          shareToken: p.shareToken,
          metrics: {
            views: Object.values(p.views).reduce((a, b) => a + b, 0),
            likes: Object.values(p.likes).reduce((a, b) => a + (typeof b === 'number' ? b : (b ? 1 : 0)), 0),
            comments: Object.values(p.comments || {}).length,
            recentActivity: [],
          },
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          authorName: p.author.name,
        }));

        // Filtered posts based on params
        let filtered = userPosts.slice();
        if (params.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(p => p.title.toLowerCase().includes(s) || p.content.toLowerCase().includes(s));
        }
        if (params.status) {
          filtered = filtered.filter(p => p.status === params.status);
        }
        if (params.fromDate) {
          const from = new Date(params.fromDate).getTime();
          filtered = filtered.filter(p => new Date(p.createdAt).getTime() >= from);
        }
        if (params.toDate) {
          const to = new Date(params.toDate).getTime();
          filtered = filtered.filter(p => new Date(p.createdAt).getTime() <= to);
        }
        if (params.favoritesOnly) {
          filtered = filtered.filter(p => Object.values(p.favorites || {}).filter(Boolean).length > 0);
        }

        // sorting
        const sortBy = params.sortBy || 'RECENT';
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'TOP_VIEWS':
              return (Object.values(b.views).reduce((x, y) => x + y, 0)) - (Object.values(a.views).reduce((x, y) => x + y, 0));
            case 'TOP_LIKES':
              return (Object.values(b.likes).reduce((x, y) => x + (typeof y === 'number' ? y : (y ? 1 : 0)), 0)) - (Object.values(a.likes).reduce((x, y) => x + (typeof y === 'number' ? y : (y ? 1 : 0)), 0));
            case 'TOP_COMMENTS':
              return Object.values(b.comments || {}).length - Object.values(a.comments || {}).length;
            case 'RECENT':
            default:
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        });

        const totalElements = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalElements / size));
        const start = page * size;
        const content = filtered.slice(start, start + size).map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          coverImageUrl: p.coverImageUrl,
          shareToken: p.shareToken,
          status: p.status,
          isPublic: p.isPublic,
          allowComments: p.allowComments,
          metrics: {
            views: Object.values(p.views).reduce((a, b) => a + b, 0),
            likes: Object.values(p.likes).reduce((a, b) => a + (typeof b === 'number' ? b : (b ? 1 : 0)), 0),
            comments: Object.values(p.comments || {}).length,
            recentActivity: [],
          },
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          authorName: p.author.name,
        }));

        const dashboardResponse = {
          totalPosts: userPosts.length,
          publishedPosts: publishedCount,
          draftPosts: draftsCount,
          totalViews,
          totalLikes,
          totalComments,
          totalFavorites,
          recentPosts: {
            content: recentContent,
            pageNumber: 0,
            pageSize: Math.max(5, size),
            totalElements: recentSorted.length,
            totalPages: Math.max(1, Math.ceil(recentSorted.length / Math.max(5, size))),
            first: true,
            last: true,
            empty: recentContent.length === 0,
          },
          filteredPosts: {
            content,
            pageNumber: page,
            pageSize: size,
            totalElements,
            totalPages,
            first: page === 0,
            last: page >= totalPages - 1,
            empty: content.length === 0,
          },
        } as any;

        return dashboardResponse;
      },
    },
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
    getPublic: async (shareToken: string, guestName?: string, viewerGuestId?: string, referrer?: string, userAgent?: string, skipView?: boolean): Promise<Post> => {
      await delay(300);
      const post = mockPosts.find(p => p.slug === shareToken || p.shareToken === shareToken);
      if (!post) {
        throw new Error('Post not found');
      }

      // When this endpoint is called without skipView, increment today's views
      if (!skipView) {
        const today = new Date().toISOString().slice(0, 10);
        post.views[today] = (post.views[today] || 0) + 1;
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

      const publishedCount = userPosts.filter(p => p.status === 'PUBLISHED').length;
      const draftsCount = userPosts.filter(p => p.status === 'DRAFT').length;
      return {
        totalPosts: userPosts.length,
        // backwards-compatible keys
        published: publishedCount,
        drafts: draftsCount,
        // new keys expected by the dashboard UI
        publishedPosts: publishedCount,
        draftPosts: draftsCount,
        totalViews,
        totalLikes,
        topPosts,
      } as any;
    },
  },
  // dashboard: handled above with `dashboard.get(params)` returning metrics + paginated posts
};
