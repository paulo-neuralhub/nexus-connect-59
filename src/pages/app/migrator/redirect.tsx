/**
 * Migrator Redirect
 * Redirects to Data Hub with migrator tab active
 */

import { Navigate, useLocation } from 'react-router-dom';

export default function MigratorRedirect() {
  const location = useLocation();
  
  // If accessing /app/migrator/new or /app/migrator/:id, redirect to data-hub with migrator tab
  return <Navigate to="/app/data-hub?tab=migrator" replace state={location.state} />;
}
