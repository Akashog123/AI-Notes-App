import mongoose from 'mongoose';
const { Schema } = mongoose;

const noteSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  audio: { type: mongoose.Schema.Types.ObjectId, ref: 'Audio', default: null },
  duration: { type: Number, default: 0 },
  isFavourite: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  savedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Note', noteSchema);