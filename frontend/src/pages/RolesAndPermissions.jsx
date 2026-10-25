import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Deprecated: Roles and Permissions page removed.
 */
export function RolesAndPermissions() {
  return <Navigate to="/" replace />;
}

export default RolesAndPermissions;
