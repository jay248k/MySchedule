import React from 'react';

/**
 * Deprecated: Permission guard component.
 * Permissions removed; renders children unconditionally.
 */
export function Can({ children }) {
  return <>{children}</>;
}

export default Can;
