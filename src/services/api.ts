const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1910';

export class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers as HeadersInit);
    // ensure content-type set
    headers.set('Content-Type', 'application/json');
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    } as RequestInit);

    if (!response.ok) {
      // If unauthorized, clear token and stored credentials and notify the app
      if (response.status === 401) {
        this.clearToken();
        try {
          sessionStorage.removeItem('pranublog_user');
          sessionStorage.removeItem('pranublog_token');
          localStorage.removeItem('pranublog_user');
          localStorage.removeItem('pranublog_token');
        } catch (e) {
          // ignore storage errors
        }
        // dispatch event so AuthContext can react
        try {
          window.dispatchEvent(new CustomEvent('pranublog:unauthorized'));
        } catch (e) {
          // ignore event error
        }
      }

      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  auth = {
    signup: async (name: string, email: string, password: string) => {
      return this.request('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
    },

    verifyOtp: async (email: string, otp: string) => {
      const response = await this.request<any>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      if (response.token) {
        this.setToken(response.token);
      }
      return response;
    },

    validateToken: async () => {
      // validate token present in this.token; request will include Authorization header
      try {
        return this.request<any>('/api/auth/validate-token', { method: 'POST' });
      } catch (err) {
        throw err;
      }
    },

    resendOtp: async (email: string) => {
      return this.request('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    login: async (email: string, password: string) => {
      const response = await this.request<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      // Do NOT auto set token here; AuthContext controls token storage
      return response;
    },
    logout: async () => {
      return this.request('/api/auth/logout', {
        method: 'POST',
      });
    },
  };

  posts = {
    list: async () => {
      return this.request('/api/posts', {
        method: 'GET',
      });
    },

    getById: async (postId: number) => {
      return this.request(`/api/posts/${postId}`, {
        method: 'GET',
      });
    },

    create: async (data: {
      title: string;
      content: string;
      excerpt?: string;
      coverImageUrl?: string;
      slug?: string;
      allowComments?: boolean;
    }) => {
      return this.request('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (
      postId: number,
      data: {
        title?: string;
        content?: string;
        excerpt?: string;
        coverImageUrl?: string;
        slug?: string;
        allowComments?: boolean;
      }
    ) => {
      return this.request(`/api/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (postId: number) => {
      return this.request(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
    },

    publish: async (postId: number) => {
      return this.request(`/api/posts/${postId}/publish`, {
        method: 'POST',
      });
    },

    unpublish: async (postId: number) => {
      return this.request(`/api/posts/${postId}/unpublish`, {
        method: 'POST',
      });
    },

    toggleFavorite: async (postId: number) => {
      return this.request(`/api/posts/${postId}/favorite`, {
        method: 'POST',
      });
    },

    getPublic: async (shareToken: string, guestName?: string, viewerGuestId?: string, referrer?: string, userAgent?: string, skipView?: boolean) => {
      const params = new URLSearchParams();
      if (guestName) params.append('guestName', guestName);
      if (viewerGuestId) params.append('viewerGuestId', viewerGuestId);
      if (referrer) params.append('referrer', referrer);
      if (userAgent) params.append('User-Agent', userAgent);
      if (typeof skipView !== 'undefined') params.append('skipView', String(skipView));

      const queryString = params.toString();
      return fetch(
        `${API_BASE_URL}/api/posts/public/${shareToken}${queryString ? '?' + queryString : ''}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      ).then(r => {
        if (!r.ok) throw new Error('Failed to fetch public post');
        return r.json();
      });
    },

    listPublic: async () => {
      return fetch(`${API_BASE_URL}/api/posts/public/list`).then(r => {
        if (!r.ok) throw new Error('Failed to fetch public posts');
        return r.json();
      });
    },

    like: async (shareToken: string, data?: any) => {
      return this.request(`/api/posts/public/${shareToken}/like`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      });
    },

    comment: async (
      shareToken: string,
      data: {
        userId?: number;
        guestName?: string;
        guestIdentifier?: string;
        content: string;
      }
    ) => {
      return this.request(`/api/posts/public/${shareToken}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    reply: async (
      shareToken: string,
      data: {
        parentCommentId: string;
        userId?: number;
        guestName?: string;
        guestIdentifier?: string;
        content: string;
      }
    ) => {
      return this.request(`/api/posts/public/${shareToken}/replies`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  };

  dashboard = {
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
      const q = new URLSearchParams();
      if (params.search) q.append('search', params.search);
      if (params.status) q.append('status', params.status);
      if (params.fromDate) q.append('fromDate', params.fromDate);
      if (params.toDate) q.append('toDate', params.toDate);
      if (typeof params.favoritesOnly !== 'undefined') q.append('favoritesOnly', String(params.favoritesOnly));
      if (params.sortBy) q.append('sortBy', params.sortBy);
      if (typeof params.page !== 'undefined') q.append('page', String(params.page));
      if (typeof params.size !== 'undefined') q.append('size', String(params.size));

      return this.request(`/api/dashboard?${q.toString()}`, {
        method: 'GET',
      });
    },
  };
}

export const apiClient = new ApiClient();
