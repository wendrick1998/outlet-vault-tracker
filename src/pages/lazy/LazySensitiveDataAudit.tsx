import { lazy } from 'react';

export const LazySensitiveDataAudit = lazy(() => 
  import('@/pages/admin/SensitiveDataAuditPage').then(module => ({
    default: module.default
  }))
);
