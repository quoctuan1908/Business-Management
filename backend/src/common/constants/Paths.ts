import jetPaths from 'jet-paths';

const Paths = {
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Auth: {
    _: '/auth',
    Login: '/login',
    Refresh: '/refresh',
    Logout: '/logout',
    Register: '/register'
  },
} as const;

export const JetPaths = jetPaths(Paths);
export default Paths;
