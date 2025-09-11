import { lazy } from 'react';

export const LazyAdmin = lazy(() => import('../Admin').then(module => ({ default: module.Admin })));