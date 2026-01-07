// Pure localStorage approach - no Zustand, no complex state management

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  friends: string[];
  isLoggedIn: boolean;
}

interface SharedLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  sharedBy: string;
  sharedAt: string;
}

// Simple localStorage helpers - check both window AND localStorage (React Native has window but no localStorage)
const hasLocalStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const storage = {
  // User auth data
  saveUser: (userData: UserData) => {
    if (hasLocalStorage) {
      window.localStorage.setItem('user', JSON.stringify(userData));
    }
  },
  
  getUser: (): UserData | null => {
    if (hasLocalStorage) {
      const user = window.localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
  
  clearUser: () => {
    if (hasLocalStorage) {
      window.localStorage.removeItem('user');
    }
  },
  
  // Shared links data
  saveLinks: (links: SharedLink[]) => {
    if (hasLocalStorage) {
      window.localStorage.setItem('shared-links', JSON.stringify(links));
    }
  },
  
  getLinks: (): SharedLink[] => {
    if (hasLocalStorage) {
      const links = window.localStorage.getItem('shared-links');
      return links ? JSON.parse(links) : [];
    }
    return [];
  },
  
  addLink: (link: SharedLink) => {
    const existingLinks = storage.getLinks();
    const updatedLinks = [link, ...existingLinks];
    storage.saveLinks(updatedLinks);
    return updatedLinks;
  },
  
  removeLink: (linkId: string) => {
    const existingLinks = storage.getLinks();
    const updatedLinks = existingLinks.filter(link => link.id !== linkId);
    storage.saveLinks(updatedLinks);
    return updatedLinks;
  }
};