const {
  Task,
  KnowledgeItem,
  Thought,
  Goal,
  Category,
  Event,
  DailyReport,
  WorkSession,
  ScheduleDeviation,
  WorkRequest
} = require('../models');
const { Op } = require('sequelize');

exports.searchAll = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, results: {} });
    }
    const query = q.trim();
    const userId = req.userId;

    // Define search scopes for each model (only if they have userId)
    const baseWhere = (userId && process.env.ISOLATE_USER_KNOWLEDGE === 'true')
      ? { userId }
      : {};

    const [tasks, knowledge, thoughts, goals, categories, events, reports, workSessions, deviations, requests] = await Promise.all([
      Task.findAll({ where: { ...baseWhere, [Op.or]: [{ title: { [Op.iLike]: `%${query}%` } }, { description: { [Op.iLike]: `%${query}%` } }] }, limit: 10 }),
      KnowledgeItem.findAll({ where: { ...baseWhere, [Op.or]: [{ title: { [Op.iLike]: `%${query}%` } }, { content: { [Op.iLike]: `%${query}%` } }] }, limit: 10 }),
      Thought.findAll({ where: { ...baseWhere, [Op.or]: [{ text: { [Op.iLike]: `%${query}%` } }, { category: { [Op.iLike]: `%${query}%` } }] }, limit: 10 }),
      Goal.findAll({ where: { ...baseWhere, [Op.or]: [{ title: { [Op.iLike]: `%${query}%` } }, { description: { [Op.iLike]: `%${query}%` } }] }, limit: 10 }),
      Category.findAll({ where: { ...baseWhere, [Op.or]: [{ name: { [Op.iLike]: `%${query}%` } }, { description: { [Op.iLike]: `%${query}%` } }] }, limit: 10 }),
      Event.findAll({ where: { ...baseWhere, [Op.or]: [{ title: { [Op.iLike]: `%${query}%` } }, { description: { [Op.iLike]: `%${query}%` } }] }, limit: 10 }),
      DailyReport.findAll({ where: { ...baseWhere, [Op.or]: [{ accomplishments: { [Op.iLike]: `%${query}%` } }, { highlights: { [Op.iLike]: `%${query}%` } }] }, limit: 10 }),
      WorkSession.findAll({ where: { ...baseWhere, [Op.or]: [{ taskTitle: { [Op.iLike]: `%${query}%` } }, { notes: { [Op.iLike]: `%${query}%` } }] }, limit: 10 }),
      ScheduleDeviation.findAll({ where: { ...baseWhere, [Op.or]: [{ plannedAction: { [Op.iLike]: `%${query}%` } }, { actualAction: { [Op.iLike]: `%${query}%` } }] }, limit: 10 }),
      WorkRequest.findAll({ where: { ...baseWhere, [Op.or]: [{ title: { [Op.iLike]: `%${query}%` } }, { reason: { [Op.iLike]: `%${query}%` } }] }, limit: 10 }),
    ]);

    res.json({
      success: true,
      results: {
        tasks,
        knowledge,
        thoughts,
        goals,
        categories,
        events,
        reports,
        workSessions,
        deviations,
        requests
      }
    });
  } catch (error) {
    next(error);
  }
};
