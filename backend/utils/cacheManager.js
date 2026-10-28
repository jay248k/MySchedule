/**
 * High-performance In-Memory Cache with TTL and Automatic Invalidation
 * Dramatically cuts down database query latency for frequently read endpoints.
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttlSeconds = 60) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  del(key) {
    this.cache.delete(key);
  }

  delPattern(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }

  // Convenient invalidation triggers
  invalidateCategories(userId) {
    this.delPattern('categories_');
  }

  invalidateSettings(userId) {
    this.delPattern('settings_');
  }

  invalidateGoals(userId) {
    this.delPattern('goals_');
  }

  invalidateTasks(userId) {
    this.delPattern('tasks_');
  }

  invalidateReports(userId) {
    this.delPattern('reports_');
  }

  invalidateDeviations(userId) {
    this.delPattern('deviations_');
  }

  invalidateWorkSessions(userId) {
    this.delPattern('work_sessions_');
  }

  invalidateWorkRequests(userId) {
    this.delPattern('work_requests_');
  }
}

const cacheManager = new CacheManager();

module.exports = cacheManager;
