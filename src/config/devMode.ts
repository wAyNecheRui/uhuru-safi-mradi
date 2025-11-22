// Mock authentication - app is fully public
// Authentication has been disabled, using a mock user for all sessions
export const MOCK_USER = {
  id: 'mock-user-id',
  email: 'public@user.com',
  name: 'Public User',
  user_type: 'citizen' as const
};
