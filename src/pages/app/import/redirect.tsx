/**
 * Universal Import Redirect
 * Redirects to Data Hub with universal tab active
 */

import { Navigate, useLocation } from 'react-router-dom';

export default function ImportRedirect() {
  const location = useLocation();
  
  // Redirect to data-hub with universal tab
  return <Navigate to="/app/data-hub?tab=universal" replace state={location.state} />;
}
