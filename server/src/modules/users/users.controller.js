import * as service from './users.service.js';

export const me = async (req, res, next) => {
  try {
    const user = await service.getProfile(req.user.sub);
    res.json({ user });
  } catch (err) { next(err); }
};

export const updateMe = async (req, res, next) => {
  try {
    const user = await service.updateProfile(req.user.sub, req.body);
    res.json({ user });
  } catch (err) { next(err); }
};