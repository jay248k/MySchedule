// Deprecated: Permissions middleware removed.
const authPermission = () => (req, res, next) => next();
const checkPermission = async () => true;

module.exports = {
  authPermission,
  checkPermission,
};
