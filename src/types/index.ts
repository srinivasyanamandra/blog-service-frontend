export interface User {
  id: number;
  name: string;
  email: string;
  role: 'AUTHOR' | 'ADMIN' | 'READER';
  lastLoginAt: string;
}

export interface Author {
  id: number;
  name: string;
  email: string;
}

export interface Post {
  id: number;
  author: Author;
  title: string;
  slug: string;
  shareToken: string;
  content: string;
  excerpt: string;
  coverImageUrl: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublic: boolean;
  allowComments: boolean;
  views: Record<string, number>;
  likes: Record<string, boolean | number>;
  favorites: Record<string, boolean>;
  comments: Record<string, Comment>;
  metrics: {
    readingTimeMin: number;
    wordCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  author: string;
  userId?: number;
  content: string;
  createdAt: string;
  replies: Comment[];
}

export interface DashboardMetrics {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments?: number;
  totalFavorites?: number;
  topPosts?: Array<{
    id: number;
    title: string;
    views: number;
    likes: number;
  }>;
}

export interface PaginatedResult<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface DashboardPost {
  id: number;
  title: string;
  slug?: string | null;
  shareToken?: string;
  excerpt?: string;
  coverImageUrl?: string;
  status?: string;
  isPublic?: boolean;
  allowComments?: boolean;
  metrics?: { views?: number; likes?: number; comments?: number; recentActivity?: any[] };
  createdAt?: string;
  updatedAt?: string;
  authorName?: string;
}

export interface DashboardResponse {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFavorites: number;
  recentPosts: PaginatedResult<DashboardPost>;
  filteredPosts?: PaginatedResult<DashboardPost>;
}
