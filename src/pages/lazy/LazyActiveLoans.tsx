import { lazy } from 'react';

export const LazyActiveLoans = lazy(() => import('../ActiveLoans').then(module => ({ default: module.ActiveLoans })));