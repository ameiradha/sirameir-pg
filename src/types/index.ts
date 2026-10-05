export interface WebApp {
  id: string;
  title: string;
  url: string;
  iconType?: 'preset' | 'image' | 'emoji';
  iconName?: string;
  iconColor?: string;
  iconUrl?: string;
  order?: number;
  clicks?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebsiteSettings {
  siteName: string;
  tagline: string;
  ownerName: string;
  ownerBio: string;
  ownerAvatar: string;
  announcementText: string;
  announcementActive: boolean;
  announcementType: 'info' | 'success' | 'warning' | 'alert';
  maintenanceMode: boolean;
  footerText: string;
  contactEmail: string;
  socialLinks?: Record<string, string>;
  adminUsername?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: {
    username: string;
    role: string;
    name: string;
  } | null;
}
