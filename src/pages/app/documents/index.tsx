// ============================================================
// DOCUMENTS ROUTES
// ============================================================

import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const DocumentGeneratorPage = lazy(() => import('./DocumentGeneratorPage'));

export const documentsRoutes: RouteObject[] = [
  {
    path: 'documents',
    children: [
      {
        path: 'new',
        element: <DocumentGeneratorPage />,
      },
      {
        path: 'generator',
        element: <DocumentGeneratorPage />,
      },
    ],
  },
];
