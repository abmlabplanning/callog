import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 7);

export const generateInviteCode = () => nanoid();
