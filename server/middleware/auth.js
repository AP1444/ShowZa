import { clerkClient } from "@clerk/express";

export const requireAuth = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid authentication' });
  }
}

export const protectAdmin = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    const user = await clerkClient.users.getUser(userId);

    if(user.privateMetadata.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}