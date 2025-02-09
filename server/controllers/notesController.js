import Note from '../models/Note.js';
import Image from '../models/Image.js';
import Audio from '../models/Audio.js';
import mongoose from 'mongoose';
import Grid from 'gridfs-stream';
import { GridFSBucket } from 'mongodb';

let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('images');
  gfs.collection('audios');
});

// Create a new note
const createNote = async (req, res) => {
  try {
    console.log('Checkpoint 1: Starting note creation');
    const { title, content, images, audio } = req.body;
    console.log('Checkpoint 2: Request body parsed', { title, content });
    
    const imageIds = images ? images.map(id => new mongoose.Types.ObjectId(id)) : [];
    let audioId = audio ? new mongoose.Types.ObjectId(audio) : null;
    console.log('Checkpoint 3: Parsed image and audio IDs', { imageIds, audioId });
    
    // Process directly attached image file if provided
    if (req.files?.image) {
      console.log('Checkpoint 4: Processing attached image file');
      const writeStream = gfs.createWriteStream({
        filename: req.files.image.name,
        contentType: req.files.image.mimetype,
      });
      writeStream.write(req.files.image.data);
      writeStream.end();
      imageIds.push(writeStream.id);
      console.log('Checkpoint 4a: Attached image saved with id', writeStream.id);
    }
    
    // Process directly attached audio file if provided
    if (req.files?.audio) {
      console.log('Checkpoint 5: Processing attached audio file');
      const writeStream = gfs.createWriteStream({
        filename: req.files.audio.name,
        contentType: req.files.audio.mimetype,
      });
      writeStream.write(req.files.audio.data);
      writeStream.end();
      audioId = writeStream.id;
      console.log('Checkpoint 5a: Attached audio saved with id', audioId);
    }

    const currentTimestamp = new Date();
    console.log('Checkpoint 6: Creating new note instance');

    const newNote = new Note({
      title,
      content,
      images: imageIds,
      audio: audioId,
      user: req.user.id,
      savedAt: currentTimestamp,
    });
    
    await newNote.save();
    console.log('Checkpoint 7: Note saved successfully', newNote._id);
    
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error during note creation:', error);
    res.status(500).json({ message: 'Error creating note', error });
  }
};

// Get all notes for a user
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving notes', error });
  }
};

// Update a note
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedNote = await Note.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: 'Error updating note', error });
  }
};

// New: Update favourite status of a note
const updateFavourite = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFavourite } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(
      id, 
      { isFavourite }, 
      { new: true }
    );
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: 'Error updating favourite status', error });
  }
};

// Delete a note along with associated files
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNote = await Note.findByIdAndDelete(id);
    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const db = mongoose.connection.db;
    // Loop through each image id and delete the file
    if (deletedNote.images && deletedNote.images.length > 0) {
      const imageBucket = new GridFSBucket(db, { bucketName: 'images' });
      deletedNote.images.forEach(imgId => {
        imageBucket.delete(imgId, (err) => {
          if (err) {
            console.error("Error deleting associated image file:", err);
          }
        });
      });
    }

    // Delete associated audio file if exists
    if (deletedNote.audio) {
      const audioBucket = new GridFSBucket(db, { bucketName: 'audios' });
      audioBucket.delete(deletedNote.audio, (err) => {
        if (err) {
          console.error("Error deleting associated audio file:", err);
        }
      });
    }

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting note', error });
  }
};

const fileuploads = async (req, res) => {
  try {
    console.log("fileuploads: Received file:", req.file, "Type:", req.params.type);
    if (!req.file) {
      console.error("fileuploads: No file provided");
      return res.status(400).json({ error: 'No file provided' });
    }
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(
      db, 
      { bucketName: req.params.type === 'image' ? 'images' : 'audios' }
    );
    
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: { userId: req.user.id, contentType: req.file.mimetype }
    });
    
    uploadStream.end(req.file.buffer);
    
    uploadStream.on('finish', () => {
      console.log("fileuploads: Finished uploading file with id", uploadStream.id);
      res.status(201).json({ fileId: uploadStream.id.toString(), filename: req.file.originalname });
    });
  } catch (error) {
    console.error("fileuploads: Error during file upload:", error);
    res.status(500).json({ error: 'Upload failed' });
  }
}

const getFile = async (req, res) => {
  try {
    let fileId;
    try {
      fileId = new mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid file ID' });
    }
    
    const db = mongoose.connection.db;
    let bucket = new GridFSBucket(db, { bucketName: 'images' });
    let files = await bucket.find({ _id: fileId }).toArray();
    
    if (files.length === 0) {
      bucket = new GridFSBucket(db, { bucketName: 'audios' });
      files = await bucket.find({ _id: fileId }).toArray();
      if (files.length === 0) {
        return res.status(404).json({ message: 'File not found' });
      }
    }
    
    res.set('Content-Type', files[0].contentType || 'application/octet-stream');
    bucket.openDownloadStream(fileId).pipe(res);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving file', error });
  }
};

export default { createNote, getNotes, updateNote, updateFavourite, deleteNote, fileuploads, getFile };