// Mock authentication - app is fully public
// Authentication has been disabled, using a mock user for all sessions
export const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'public@user.com',
  name: 'Public User',
  user_type: 'citizen' as const
};
