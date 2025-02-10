import express from 'express';
import authController from '../controllers/authController.js';
const { signUp, login, verifyToken } = authController;
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);
router.get('/verify', verifyToken);

router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;