import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PenLine, Play, Save, X, ArrowDownToLine, Maximize2, Minimize2, Star, Trash2, Plus } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';

const NoteCardDialog = ({ isOpen, onClose, note, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(note.title);
  const [newContent, setNewContent] = useState(note.content);
  const [previewType, setPreviewType] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [activeSave, setActiveSave] = useState(false);
  const [activeDownload, setActiveDownload] = useState(false);
  const [isFavourite, setIsFavourite] = useState(note.isFavourite);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState(null);
  const [savedImages, setSavedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const imageInputRef = useRef(null);

  const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`/api/notes/upload/image`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.fileId;
  };

  const handleSave = async () => {
    let newImageIds = [];
    if (uploadedImages.length > 0) {
      newImageIds = await Promise.all(uploadedImages.map(uploadImage));
    }
    const updatedImages = note.images ? [...note.images, ...newImageIds] : newImageIds;
    onUpdate({ ...note, title: newTitle, content: newContent, images: updatedImages });
    setIsEditing(false);
    setUploadedImages([]);
  };

  const toggleFavourite = () => {
    const updatedFavouriteStatus = !isFavourite;
    setIsFavourite(updatedFavouriteStatus);
    onUpdate({ ...note, isFavourite: updatedFavouriteStatus });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && (savedImages.length + uploadedImages.length) < 2) {
      setUploadedImages([...uploadedImages, file]);
    }
  };

  const handleRemoveImage = (index) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleRemoveSavedImage = (id) => {
    const updatedImageIds = note.images.filter(imgId => imgId !== id);
    onUpdate({ ...note, images: updatedImageIds });
    setSavedImages(savedImages.filter(img => img.id !== id));
  };

  useEffect(() => {
    const fetchSavedImages = async () => {
      const imageIds = Array.isArray(note.images)
        ? note.images
        : note.images
          ? [note.images]
          : [];
      if (imageIds.length) {
        setSavedImages([]);
        console.log('NoteCardDialog imageIds',imageIds);
        const promises = imageIds.map(async (id) => {
          const res = await fetch(`/api/notes/file/${id}`, { headers: getAuthHeader() });
          console.log('NoteCardDialog res',res);
          if (!res.ok) return console.error(`Failed to fetch image with ID: ${id}`);
          console.log(res);
          const blob = await res.blob();
          return { id, url: URL.createObjectURL(blob) };
        });
        const imgs = (await Promise.all(promises)).filter(Boolean);
        setSavedImages(imgs);
      }
    };
    fetchSavedImages();
    return () => {
      savedImages.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [note]);

  useEffect(() => {
// Cleanup previous blob URLs when preview type changes
    return () => {
      if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
      if (previewAudioUrl) URL.revokeObjectURL(previewAudioUrl);
    };
  }, [previewImageUrl, previewAudioUrl]);

  useEffect(() => {
// Fetch file with auth header when previewType is set
    if (previewType === 'image' && note.image) {
      fetch(`/api/notes/file/${note.image}`, { headers: getAuthHeader() })
        .then(res => res.blob())
        .then(blob => setPreviewImageUrl(URL.createObjectURL(blob)))
        .catch(err => console.error(err));
    } else if (previewType === 'audio' && note.audio) {
      fetch(`/api/notes/file/${note.audio}`, { headers: getAuthHeader() })
        .then(res => res.blob())
        .then(blob => setPreviewAudioUrl(URL.createObjectURL(blob)))
        .catch(err => console.error(err));
    } else {
// Clear preview URLs when previewType is unset
      setPreviewImageUrl(null);
      setPreviewAudioUrl(null);
    }
  }, [previewType, note.image, note.audio]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`p-6 bg-rose-50 shadow-lg ${fullScreen ? 'w-screen h-screen m-0 rounded-none max-w-none' : 'rounded-lg sm:max-w-[425px]'}`}>
        <DialogHeader>
          <div className="flex justify-end items-center mb-2">
            <button 
              onClick={toggleFavourite}
              title="Toggle Favourite"
              className={`absolute right-14 ${isFavourite ? 'text-yellow-500 fill-yellow-500' : 'text-slate-500'}`}
            >
              <Star size={18} />
            </button>
          </div>
          <div className="mb-2">
            <DialogTitle>
              {isEditing ? (
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e)=>setNewTitle(e.target.value)} 
                  className="w-full p-2 border rounded" 
                  title="Title"
                />
              ) : (
                <span className="w-full p-2" title="Title">{newTitle}</span>
              )}
            </DialogTitle>
          </div> <br/>
          <DialogDescription>
            <div className="relative">
              <textarea 
                value={newContent} 
                onChange={(e)=>setNewContent(e.target.value)} 
                className="w-full p-2 border rounded resize-none" 
                rows={4} 
                disabled={!isEditing}
                title='Content'
              />
            </div>
          </DialogDescription>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsEditing(!isEditing)} 
                  title="Edit Title/Content" 
                  className={`${isEditing ? 'text-slate-900' : 'text-slate-500'}`}
                >
                  <PenLine size={18} />
                </button>
                {isEditing && (
                  <button 
                    onClick={() => {
                      setActiveSave(true);
                      handleSave();
                      setTimeout(() => setActiveSave(false), 3000);
                    }}
                    title='Save changes' 
                    className={`${activeSave ? '' : 'text-slate-900'}`}
                  >
                    <Save size={18} />
                  </button>
                )}
                <button 
                  onClick={() => setFullScreen(!fullScreen)} 
                  title={fullScreen ? "Minimize" : "Maximize"} 
                  className="text-slate-800"
                >
                  {fullScreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                </button>
              </div>
              <div className="flex space-x-2">
                { note.audio && (
                  <button 
                    onClick={() => setPreviewType(previewType==='audio'? null:'audio')} 
                    title="Play audio" 
                    className={`${previewType === 'audio' ? 'text-slate-900' : 'text-slate-500'}`}
                  >
                    <Play size={18}/>
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>
        {/* Preview section */}
        {previewType === 'image' && previewImageUrl && (
          <div className={`mt-4 relative ${fullScreen ? 'justify-center' : ''}`}>
            <img 
              src={previewImageUrl} 
              alt="Note Image" 
              className={fullScreen ? "max-w-[50vw] max-h-[50vh] object-contain" : "w-full rounded"}
            />
            {!fullScreen && (
              <button 
                onClick={() => setPreviewType(null)} 
                title='Close Image' 
                className="absolute top-2 right-2 text-slate-500"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {previewType === 'audio' && previewAudioUrl && (
          <div className="mt-4 relative">
            <div className="flex items-center space-x-2">
              <audio controls src={previewAudioUrl} className="flex-1" />
              <a 
                href={previewAudioUrl} 
                download 
                title='Download audio' 
                onClick={() => {
                  setActiveDownload(true);
                  setTimeout(() => setActiveDownload(false), 3000);
                }}
                className={`ml-2 ${activeDownload ? 'text-slate-900' : 'text-slate-500'}`}
              >
                <ArrowDownToLine size={18} />
              </a>
            </div>
          </div>
        )}
        {/* Multi-image upload section */}
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Images</h3>
          <div className="grid grid-cols-2 gap-4">
            {savedImages.map((img, idx) => (
              <Card key={`saved-${idx}`} className="relative">
                <CardContent className="p-0">
                  <AspectRatio ratio={16/9}>
                    <img
                      src={img.url}
                      alt={`Saved ${idx + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </AspectRatio>
                </CardContent>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 p-1"
                  onClick={() => handleRemoveSavedImage(img.id)}
                  title="Remove image"
                >
                  <Trash2 size={16} />
                </Button>
              </Card>
            ))}
            {uploadedImages.map((file, idx) => (
              <Card key={`uploaded-${idx}`} className="relative">
                <CardContent className="p-0">
                  <AspectRatio ratio={16/9}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${idx + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </AspectRatio>
                </CardContent>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 p-1"
                  onClick={() => handleRemoveImage(idx)}
                  title="Remove image"
                >
                  <Trash2 size={16} />
                </Button>
              </Card>
            ))}
            { ( (savedImages.length + uploadedImages.length) < 2 ) && (
              <div className="flex items-center justify-center border-dashed border-2 border-gray-300 rounded-md cursor-pointer"
                onClick={()=> imageInputRef.current && imageInputRef.current.click()}>
                <Plus size={24} className="text-gray-500" />
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>
        {/* Updated image handling section */}
        <div className="mt-4">
          <h3 className="font-medium">Images</h3>
          { Array.isArray(note.images) && note.images.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {note.images.map((imageId, index) => (
                  <img
                    key={index}
                    src={`/api/notes/file/${imageId}`}
                    alt={`Note image ${index}`}
                    className="w-20 h-20 object-cover rounded"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No images available</p>
            )
          }
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NoteCardDialog;
