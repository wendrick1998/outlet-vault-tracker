import { lazy } from 'react';

export const LazyBatchOutflow = lazy(() => import('../BatchOutflow').then(module => ({ default: module.BatchOutflow })));