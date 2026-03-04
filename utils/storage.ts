export const storage = {
  getToken: (): string | null => localStorage.getItem('authToken'),
  setToken: (token: string) => localStorage.setItem('authToken', token),
  removeToken: () => localStorage.removeItem('authToken'),

  getRole: (): 'Admin' | 'Merchant' | null => (localStorage.getItem('userRole') as 'Admin' | 'Merchant' | null),
  setRole: (role: 'Admin' | 'Merchant') => localStorage.setItem('userRole', role),
  removeRole: () => localStorage.removeItem('userRole'),

  // Partner profile convenience
  setPartnerProfile: (profile: object) => localStorage.setItem('partnerProfile', JSON.stringify(profile)),
  getPartnerProfile: (): any | null => {
    const v = localStorage.getItem('partnerProfile')
    if (!v) return null
    try { return JSON.parse(v) } catch { return null }
  },
  removePartnerProfile: () => localStorage.removeItem('partnerProfile'),

  clear: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('partnerProfile');
  }
};
