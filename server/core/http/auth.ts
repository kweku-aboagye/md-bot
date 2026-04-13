import type { Response } from 'express';

export function checkLegacyAdminPin(req: any, res: Response): boolean {
  const pin = req.body?.pin;
  const adminPin = process.env.ADMIN_PIN;

  if (adminPin && pin !== adminPin) {
    res.status(401).json({ message: 'Invalid PIN' });
    return false;
  }

  return true;
}
