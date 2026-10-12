import bcrypt from 'bcrypt';

const ROUNDS = 12;

export const hashPassword = (pw) => bcrypt.hash(pw, ROUNDS);
export const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);