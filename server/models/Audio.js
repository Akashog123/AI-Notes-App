import mongoose from 'mongoose';
const { Schema } = mongoose;

const audioSchema = new Schema({
  filename: String,
  contentType: String,
  length: Number,
  chunkSize: Number,
  uploadDate: Date,
  metadata: Schema.Types.Mixed,
});

export default mongoose.model('Audio', audioSchema);