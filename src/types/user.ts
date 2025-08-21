export interface User {
  id: string;
  username: string;
  email: string;
  password: string; 
  role: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null; 
  createdAt: string;            
}