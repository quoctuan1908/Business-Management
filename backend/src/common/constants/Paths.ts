import jetPaths from 'jet-paths';

const Paths = {
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    GetOne: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
    Login: '/login',
  },
  Products: {
    _: '/products',
    Get: '/all',
    GetOne: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Locations: {
    _: '/locations',
    Get: '/all',
    GetOne: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
    SyncCanTho: '/sync/can-tho',
  },
  Customers: {
    _: '/customers',
    Get: '/all',
    GetOne: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Invoices: {
    _: '/invoices',
    Get: '/all',
    GetOne: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Activities: {
    _: '/activities',
    Get: '/all',
    GetOne: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
    Confirm: '/:id/confirm',
    AdvanceStatus: '/:id/advance-status',
    DetailsGet: '/:activityId/details',
    DetailsAdd: '/details/add',
    DetailsUpdate: '/details/update',
    DetailsDelete: '/details/delete/:activityId/:productId',
  },
  OrderStatuses: {
    _: '/order-statuses',
    Get: '/all',
  },
} as const;

export const JetPaths = jetPaths(Paths);
export default Paths;
