import { lazy } from 'react';

export const LazyHistory = lazy(() => import('../History').then(module => ({ default: module.History })));