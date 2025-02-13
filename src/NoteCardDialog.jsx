import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PenLine, Save, X, ArrowDownToLine, Maximize2, Minimize2, Star, Trash2, Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const NoteCardDialog = ({ isOpen, onClose, note, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newContent, setNewContent] = useState(note.content);
  const [previewType, setPreviewType] = useState('image');
  const [fullScreen, setFullScreen] = useState(false);
  const [activeSave, setActiveSave] = useState(false);
  const [activeDownload, setActiveDownload] = useState(false);
  const [isFavourite, setIsFavourite] = useState(note.isFavourite);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState(null);
  const [savedImages, setSavedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [localImages, setLocalImages] = useState(note.images || []);
  const [imageLoading, setImageLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const imageInputRef = useRef(null);

  const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const uploadImage = async (file) => {
    console.log("Checkpoint frontend: Starting upload for file:", file.name);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`/api/notes/upload/image`, formData, {
        headers: { 
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data' 
        }
      });
      console.log("Uploaded image file, received fileId:", response.data.fileId);
      return response.data.fileId;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    console.log("Starting handleSave. Uploaded images:", uploadedImages);
    if (uploadedImages.length === 0) {
      console.log("No files queued for upload.");
    }
    let newImageIds = [];
    if (uploadedImages.length > 0) {
      newImageIds = await Promise.all(uploadedImages.map(uploadImage));
      console.log("New image IDs:", newImageIds);
    }
    const updatedImages = [...localImages, ...newImageIds];
    console.log("Updated images list:", updatedImages);
    setLocalImages(updatedImages);
    onUpdate({ 
      ...note, 
      title: newTitle, 
      content: newContent, 
      images: updatedImages, 
      isFavourite 
    });
    setIsEditing(false);
    setUploadedImages([]);
  };

  const toggleFavourite = () => {
    const updatedFavouriteStatus = !isFavourite;
    setIsFavourite(updatedFavouriteStatus);
    onUpdate({ 
      ...note, 
      title: note.title, 
      content: newContent, 
      images: localImages, 
      isFavourite: updatedFavouriteStatus 
    });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    console.log("Selected file:", file);
    console.log("Current image counts: localImages=", localImages.length, "uploadedImages=", uploadedImages.length);
    if (file && ((localImages.length + uploadedImages.length) < 2)) {
      console.log("Auto-uploading file on selection");
      try {
        const fileId = await uploadImage(file);
        const updatedImages = [...localImages, fileId];
        setLocalImages(updatedImages);
        onUpdate({ ...note, images: updatedImages });
      } catch (error) {
        console.error("Auto-upload failed:", error);
      }
    } else {
      console.log("Not adding file due to count condition");
    }
  };

  const handleRemoveSavedImage = (id) => {
    console.log("Removing saved image with id:", id);
    const updatedImageIds = localImages.filter(imgId => imgId !== id);
    setLocalImages(updatedImageIds);
    onUpdate({ ...note, images: updatedImageIds });
    setSavedImages(savedImages.filter(img => img.id !== id));
  };

  useEffect(() => {
    setLocalImages(note.images || []);
  }, [note]);

  useEffect(() => {
    const fetchSavedImages = async () => {
      const imageIds = Array.isArray(localImages)
        ? localImages
        : localImages
          ? [localImages]
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
  }, [localImages]);

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
      setImageLoading(true);
      fetch(`/api/notes/file/${note.image}`, { headers: getAuthHeader() })
        .then(res => res.blob())
        .then(blob => {
          setPreviewImageUrl(URL.createObjectURL(blob));
          setImageLoading(false);
        })
        .catch(err => {
          console.error(err);
          setImageLoading(false);
        });
    } else if (previewType === 'audio' && note.audio) {
      setAudioLoading(true);
      fetch(`/api/notes/file/${note.audio}`, { headers: getAuthHeader() })
        .then(res => res.blob())
        .then(blob => {
          setPreviewAudioUrl(URL.createObjectURL(blob));
          setAudioLoading(false);
        })
        .catch(err => {
          console.error(err);
          setAudioLoading(false);
        });
    } else {
      // Clear preview URLs when previewType is unset
      setPreviewImageUrl(null);
      setPreviewAudioUrl(null);
    }
  }, [previewType, note.image, note.audio]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`p-6 bg-zinc-50 rounded-lg shadow-lg ${fullScreen ? 'w-screen h-screen m-0 rounded-none max-w-none' : 'rounded-lg sm:max-w-[425px]'}`}>
        <div>
          <button 
            onClick={() => setFullScreen(!fullScreen)}
            title={fullScreen ? "Minimize" : "Maximize"}
            className="absolute top-4 left-6 bg-rose-50 text-slate-700 rounded-full shadow-md p-2"
          >
            {fullScreen ? <Minimize2 className="h-4 w-4"/> : <Maximize2 className="h-4 w-4"/>}
          </button>
          <button 
            onClick={toggleFavourite}
            title="Toggle Favourite"
            className="absolute top-4 right-16 rounded-full bg-rose-50 shadow-md p-2"
          >
            <Star className={`h-4 w-4 ${isFavourite ? "text-yellow-500 fill-yellow-500" : "text-slate-700"} `}/>
          </button>
          <div className="pt-12">
            <DialogHeader>
              <DialogTitle>
                <span className="w-full text-[18px]" title="Title">{note.title}</span>
              </DialogTitle>
              <p className="text-[12px] text-slate-600 truncate">
                {new Date(note.savedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                  timeZone: 'Asia/Kolkata'
                })} • {new Date(note.savedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: 'Asia/Kolkata'
                })}
              </p>
            </DialogHeader>
            <DialogDescription>
              <div className="relative text-[14px]">
                <textarea 
                  value={newContent} 
                  onChange={(e)=>setNewContent(e.target.value)} 
                  className="w-full p-2 border rounded resize-none mt-3" 
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
                    title={isEditing ? "Cancel edit" : "Edit note"} 
                    className="rounded-full bg-rose-50 shadow-md p-2"
                  >
                    {isEditing ? <X className="h-4 w-4 text-red-600"/> : <PenLine className="h-4 w-4 text-slate-700"/>}
                  </button>
                  {isEditing && (
                    <Button 
                      onClick={() => {
                        setActiveSave(true);
                        handleSave();
                        setTimeout(() => setActiveSave(false), 3000);
                      }}
                      title='Save changes' 
                      className={`bg-rose-600 hover:bg-rose-800 px-3 rounded-md ${activeSave ? '' : 'text-slate-900'}`}
                    >
                      <div className="flex items-center space-x-2 text-white">
                        <span>Save</span> 
                        <Save className="h-3 w-3" />
                      </div>
                    </Button>
                  )}
                </div>
                { note.audio && (
                  <Tabs value={previewType} onValueChange={setPreviewType}>
                    <TabsList className="flex space-x-2 bg-rose-50 shadow-md rounded-lg p-1">
                      <TabsTrigger className="shadow-sm" value="image">Images</TabsTrigger>
                      <TabsTrigger className="shadow-sm" value="audio">Recording</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              </div>
              { (!note.audio || previewType==='image') && (
                <>
                  <div className={`relative ${fullScreen ? 'flex items-center justify-center' : ''}`}>
                    {imageLoading ? (
                      <Loader2 className="animate-spin h-8 w-8" />
                    ) : (
                      previewImageUrl && (
                        <img 
                          src={previewImageUrl} 
                          alt="Note Image" 
                          className={fullScreen ? "max-w-[50vw] max-h-[50vh] object-contain" : "w-full rounded"}
                        />
                      )
                    )}
                  </div>
                  {/* Multi-image upload section */}
                  <div className={`mt-4 ${fullScreen ? 'overflow-auto' : ''}`}>
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
                            <Trash2 onClick={() => handleRemoveSavedImage(img.id)} className="absolute top-3 right-3 h-4 w-4 text-gray-400 fill-gray-400 shadow-sm cursor-pointer" />
                        </Card>
                      ))}
                      {((localImages.length + uploadedImages.length) < 2) && (
                        <AspectRatio ratio={16/9}>
                          <div 
                            className="flex flex-col items-center justify-center border-dashed border-2 border-gray-300 rounded-md cursor-pointer h-full w-full"
                            onClick={()=> imageInputRef.current && imageInputRef.current.click()}
                          >
                            <Plus size={24} className="text-gray-600" />
                            <span className="text-gray-600 mt-1">Image</span>
                          </div>
                        </AspectRatio>
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
                </>
              )}
              { (note.audio && previewType==='audio') && (
                <div className="mt-4 relative flex items-center justify-center">
                  {audioLoading ? (
                    <Loader2 className="animate-spin h-8 w-8" />
                  ) : (
                    previewAudioUrl && (
                      <div className="w-full flex items-center space-x-2">
                        <audio controls src={previewAudioUrl} className="flex-1" />
                        <a 
                          href={previewAudioUrl} 
                          download 
                          title='Download audio' 
                          onClick={() => {
                            setActiveDownload(true);
                            setTimeout(() => setActiveDownload(false), 3000);
                          }}
                          className={`rounded-full bg-rose-50 shadow-md p-2 ml-2 ${activeDownload ? 'text-slate-900' : 'text-slate-700'}`}
                        >
                          <ArrowDownToLine className="h-4 w-4" />
                        </a>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NoteCardDialog;
