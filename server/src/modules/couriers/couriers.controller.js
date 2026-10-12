import * as service from './couriers.service.js';

export const getMine = async (req, res, next) => {
  try {
    const profile = await service.getMine(req.user.sub);
    res.json({ profile });
  } catch (err) { next(err); }
};

export const upsertMine = async (req, res, next) => {
  try {
    const profile = await service.upsertMine(req.user.sub, req.body);
    res.json({ profile });
  } catch (err) { next(err); }
};

export const setAvailability = async (req, res, next) => {
  try {
    const profile = await service.setAvailability(req.user.sub, req.body.is_available);
    res.json({ profile });
  } catch (err) { next(err); }
};