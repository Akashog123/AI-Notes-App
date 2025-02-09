import { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Play, Pause, CheckCheck, Save, ImagePlus, Loader2, Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

const NoteCreatorDialog = ({ isOpen, onClose, onAddNote }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recording, setRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecorded, setisRecorded] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recordError, setRecordError] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef();
  const { toast } = useToast();


  const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });


  if (recognition) {
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setContent(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event) => {
      setRecordError(event.error);
      setRecording(false);
    };
  }

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`/api/notes/upload/${type}`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.fileId;
    } catch (error) {
      throw error;
    }
  };

  const handleRecordToggle = () => {
    if (recordTime >= 60) {
      return;
    }

    if (!recording) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          let localAudioChunks = [];
          mediaRecorder.start();

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              localAudioChunks.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(localAudioChunks, { type: 'audio/webm' });
            setAudioFile(new File([audioBlob], 'recording.webm', { type: 'audio/webm' }));
            stream.getTracks().forEach(track => track.stop());
          };

          setMediaRecorder(mediaRecorder);
          setAudioChunks(localAudioChunks);
          setRecording(true);
          setIsPaused(false);
          setRecordTime(0);
          recognition.start();

          // Start interval
          intervalRef.current = setInterval(() => {
            setRecordTime(prev => prev + 1);
          }, 1000);
        })
        .catch(err => {
          setRecordError('Error accessing microphone: ' + err.message);
        });
    } else if (recording && !isPaused) {
      mediaRecorder.pause();
      recognition.stop();
      setIsPaused(true);
      // Pause interval
      clearInterval(intervalRef.current);
    } else if (recording && isPaused) {
      mediaRecorder.resume();
      recognition.start();
      setIsPaused(false);
      // Resume interval
      intervalRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    }
  };

  const handleFinishRecording = useCallback(() => {
    if (recording && mediaRecorder) {
      mediaRecorder.stop();
      recognition.stop();
      setRecording(false);
      setIsPaused(false);
      setisRecorded(true);
      clearInterval(intervalRef.current);
    }
  }, [recording, mediaRecorder, recognition]);

  useEffect(() => {
    if (recordTime >= 60) {
      toast({
        variant: "destructive",
        title: "Recording Limit Reached",
        description: "Maximum recording time is 1 minute.",
      });
      handleFinishRecording();
    }
  }, [recordTime, handleFinishRecording, toast]);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);


  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    if (files.length) {
      setImageFiles(prev => {
        const allowed = 2 - prev.length;
        return [...prev, ...files.slice(0, allowed)];
      });
    }
  };

  const uploadImage = async (fileObj) => {
    const formData = new FormData();
    // Use fileObj.file to get the proper File object
    formData.append('file', fileObj.file);
    const authHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    const response = await axios.post(`/api/notes/upload/image`, formData, {
      headers: {
        ...authHeader,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.fileId;
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(imageFiles[index].preview);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Title Required",
        description: "Please enter a title for your note.",
      });
      return;
    }
    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Content Required",
        description: "Please enter content for your note.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const imageIds = imageFiles.length > 0
        ? await Promise.all(imageFiles.map(uploadImage))
        : [];
      const audioIdPromise = audioFile ? uploadFile(audioFile, 'audio') : Promise.resolve(null);
      const [audioId] = await Promise.all([audioIdPromise]);

      const newNote = {
        title,
        content,
        images: imageIds,
        audio: audioId
      };

      const response = await axios.post('/api/notes', newNote, { headers: getAuthHeader() });
      if (onAddNote) onAddNote(response.data);

      toast({
        title: "Note Saved",
        description: "Your note has been saved successfully.",
        className: "bg-green-500 text-white border-success"
      });

      setTitle('');
      setContent('');
      setImageFiles([]);
      setAudioFile(null);
      setisRecorded(false);
      onClose();
    } catch (error) {
      console.error('Failed to save note:', error);
      toast({
        variant: "destructive",
        title: "Saving Failed",
        description: "Failed to save note. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[650px] p-6 bg-rose-50 rounded-lg shadow-lg" aria-describedby="modal-description">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Create Note</DialogTitle>
        </DialogHeader>
        <Input
          type="text"
          placeholder="Enter title here..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 border border-gray-300 p-2 rounded-md h-15"
        />
        <Textarea
          placeholder="Enter content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mb-3 border border-gray-300 p-2 rounded-md bg-gray-100 h-20"
        />
        <div className="flex items-center gap-2 mb-3">
          {/* <label
            htmlFor="image-upload"
            className="w-12 h-12 flex items-center justify-center border border-dashed border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <ImagePlus size={26} className="text-gray-500" />
          </label> */}
          <Button onClick={handleRecordToggle} disabled={recordTime >= 60 || isRecorded} hidden={recordTime >= 60 || isRecorded} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md">
            {recording ? (isPaused ? <Play size={16} /> : <Pause size={16} />) : <Mic size={16} />}
          </Button>
          {recording && <Button onClick={handleFinishRecording}>Finish<CheckCheck size={16} /></Button>}
          <Button onClick={handleSubmit} 
              className=" absolute right-6 bg-rose-600 hover:bg-rose-800 text-white px-4 py-2 rounded-md" 
              disabled={isSaving}
              >
                {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  Save
                  <Save size={16} className="ml-2" />
                </>
              )}
          </Button>
        </div>
        {/* Image upload section */}
        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" multiple />
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[0, 1].map(index => (
            <Card 
              key={index} 
              onClick={!imageFiles[index] ? () => document.getElementById('image-upload').click() : undefined} 
              className="relative cursor-pointer"
            >
              <CardContent className="p-0">
                <AspectRatio ratio={16/9}>
                  {imageFiles[index] ? (
                    <>
                      <img 
                        src={imageFiles[index].preview} 
                        alt={`preview-${index}`} 
                        className="object-cover w-full h-full" 
                      />
                      <Trash2 
                        size={16} 
                        className="absolute top-1 right-1 text-rose-500" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleRemoveImage(index); 
                        }} 
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      <Plus size={24} className="text-gray-500" />
                      <span className="mb-1 text-sm font-medium text-gray-500">Image</span>
                    </div>
                  )}
                </AspectRatio>
              </CardContent>
            </Card>
          ))}
        </div>
        {audioFile && (<audio controls src={URL.createObjectURL(audioFile)} className="mt-2 w-full" /> )}
      </DialogContent>
    </Dialog>
  );
};

export default NoteCreatorDialog;