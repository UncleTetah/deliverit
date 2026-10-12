import * as service from './deliveries.service.js';

export const list = async (req, res, next) => {
  try {
    const scope = req.query.scope; // e.g. ?scope=available
    const deliveries = await service.listForUser(req.user, { scope });
    res.json({ deliveries });
  } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
  try {
    const delivery = await service.getById(req.params.id, req.user);
    res.json({ delivery });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const delivery = await service.create(req.user, req.body);
    res.status(201).json({ delivery });
  } catch (err) { next(err); }
};

export const accept = async (req, res, next) => {
  try {
    const delivery = await service.accept(req.params.id, req.user);
    res.json({ delivery });
  } catch (err) { next(err); }
};

export const updateStatus = async (req, res, next) => {
  try {
    const delivery = await service.updateStatus(req.params.id, req.user, req.body);
    res.json({ delivery });
  } catch (err) { next(err); }
};

export const track = async (req, res, next) => {
  try {
    // Reuse getOne so access rules apply, then fetch events
    await service.getById(req.params.id, req.user);
    const events = await service.getTracking(req.params.id);
    res.json({ events });
  } catch (err) { next(err); }
};