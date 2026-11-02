import * as service from './admin.service.js';

export const listUsers = async (req, res, next) => {
  try {
    const users = await service.getAllUsers();
    res.json({ users });
  } catch (err) { next(err); }
};

export const listDeliveries = async (req, res, next) => {
  try {
    const deliveries = await service.getAllDeliveries();
    res.json({ deliveries });
  } catch (err) { next(err); }
};

export const verifyCourier = async (req, res, next) => {
  try {
    const result = await service.verifyCourier(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
};