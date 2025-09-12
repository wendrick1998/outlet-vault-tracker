import { lazy } from 'react';

export const LazySearchAndOperate = lazy(() => import('../SearchAndOperate').then(module => ({ default: module.SearchAndOperate })));