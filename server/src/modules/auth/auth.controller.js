import * as service from './auth.service.js';

export const register = async (req, res, next) => {
  try {
    const result = await service.register(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (err) { next(err); }
};

export const me = async (req, res, next) => {
  try {
    const user = await service.getById(req.user.sub);
    res.json({ user });
  } catch (err) { next(err); }
};