import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';

const app = express();

app.use(bodyParser.json());
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/notes', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), notesController.createNote);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});