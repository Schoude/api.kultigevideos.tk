type UserRole = 'admin' | 'maintainer' | 'user';

interface UserMetaData {
  avatarUrl?: string;
}

export type User = {
  _id: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  meta: UserMetaData | Record<string, never>;
};
