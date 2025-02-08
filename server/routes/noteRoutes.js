import express from 'express';
const router = express.Router();
import notesController from '../controllers/notesController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() })

// Create a new note
router.post('/', authMiddleware, notesController.createNote);

// Get all notes for a user
router.get('/', authMiddleware, notesController.getNotes);

// Update a note by ID
router.put('/:id', authMiddleware, notesController.updateNote);

// Patch endpoint to update favourite status
router.patch('/:id/favourite', authMiddleware, notesController.updateFavourite);

// Delete a note by ID
router.delete('/:id', authMiddleware, notesController.deleteNote);

// Upload image and audio file
router.post('/upload/:type', authMiddleware, upload.single('file'), notesController.fileuploads);

// Get file by ID
router.get('/file/:id', authMiddleware, notesController.getFile);

export default router;