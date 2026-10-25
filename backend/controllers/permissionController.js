// Deprecated: Permission controller removed.
module.exports = {
  getUserPermissions: (req, res) => res.json({ success: true, data: [] }),
  getModuleTree: (req, res) => res.json({ success: true, data: [] }),
  getRolePermissions: (req, res) => res.json({ success: true, permissions: [] }),
  updateRolePermissions: (req, res) => res.json({ success: true, message: 'Permissions removed' }),
};
