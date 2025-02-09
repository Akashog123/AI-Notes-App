import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Star, Home, LogOut, Trash2, Play, Image, NotebookPen, Copy, EllipsisVertical } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import NoteCreatorDialog from './NoteCreatorDialog';
import NoteCardDialog from './NoteCardDialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/toaster";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const [showFavourites, setShowFavourites] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingNote, setRenamingNote] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [noteToDelete, setNoteToDelete] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/auth/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        const data = await response.json();
        setUser(data.user);
        fetchNotes(token);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        navigate("/login");
      }
    };
    fetchDashboardData();
  }, [navigate]);

  // Redirect to login page for logout button.
  const handleLogout = (navigate) => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const fetchNotes = async (token) => {
    try {
      const response = await fetch("/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      // console.error("Error fetching notes:", error);
      return;
    }
  };

  const handleDelete = async (noteId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if(response.ok) {
         setNotes((prev) => prev.filter((note) => note._id !== noteId));
      } else {
         alert("Failed to delete note");
      }
    } catch(error) {
      //  console.error("Error deleting note:", error);
      return;
    }
  };

  const handleDeleteConfirmed = () => {
    if (!noteToDelete) return;
    handleDelete(noteToDelete._id);
    setNoteToDelete(null);
  };

  const handleCardClick = (note) => {
    setSelectedNote(note);
    setIsNoteDialogOpen(true);
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    
    // Format date parts for IST timezone
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });

    // Format time parts for IST timezone
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });

    return (<div>
      {formattedDate} • {formattedTime}
    </div>);

  };

  // Toggle between newest and oldest
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "newest" ? "oldest" : "newest");
  };

  // Add note based on current sortOrder
  const addNote = (newNote) => {
    if (sortOrder === "newest") {
      setNotes((prev) => [newNote, ...prev]);
    } else {
      setNotes((prev) => [...prev, newNote]);
    }
  };

  // Filter notes based on favourites flag and search bar, then sort them.
  const notesToDisplay = [...(showFavourites ? notes.filter(note => note.isFavourite) : notes)]
    .filter(note => (note.title && note.title.toLowerCase().includes(search.toLowerCase())) || (note.content && note.content.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => sortOrder === "newest" 
      ? new Date(b.savedAt) - new Date(a.savedAt) 
      : new Date(a.savedAt) - new Date(b.savedAt));

  const handleUpdateNote = (updatedNote) => {
    const token = localStorage.getItem("token");
    fetch(`/api/notes/${updatedNote._id}`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updatedNote)
    })
      .then(response => response.json())
      .then(data => {
        setNotes(notes.map(note => (note._id === data._id ? data : note)));
      })
      .catch(error => console.error('Error updating note:', error));
  };

  // helper functions for renaming note title
  const handleRenameNote = (note) => {
    setRenamingNote(note);
    setNewTitle(note.title);
    setRenameDialogOpen(true);
  };

  const handleRenameSave = () => {
    const updatedNote = { ...renamingNote, title: newTitle };
    // Reuse the update functionality
    fetch(`/api/notes/${renamingNote._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(updatedNote)
    })
      .then(response => response.json())
      .then(data => {
        setNotes(notes.map(note => (note._id === data._id ? data : note)));
        // toast updated note if needed.
      })
      .catch(error => console.error('Error updating note:', error));
    setRenamingNote(null);
    setRenameDialogOpen(false);
  };

  const handleRenameCancel = () => {
    setRenamingNote(null);
    setNewTitle("");
    setRenameDialogOpen(false);
  };

  return (
    <div className="flex h-screen">
      <Toaster className="bg-rose-50" />
      {/* Sidebar */}
      <div className="w-64 bg-[#F7F6FA] p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center space-x-2">
            <span className="bg-rose-500 hover:bg-rose-600 p-2 rounded-full text-white">AI</span>
            <span>Notes</span>
          </h1>
          <nav className="mt-6">
            <button onClick={() => setShowFavourites(false)}
              className={`flex items-center space-x-2 p-2 rounded-lg w-full ${!showFavourites ? "bg-purple-100" : ""}`}>
              <Home size={18} />
              <span>Home</span>
            </button>
            <button onClick={() => setShowFavourites(true)}
              className={`flex items-center space-x-2 p-2 mt-2 w-full ${showFavourites ? "bg-purple-100" : ""}`}>
              <Star size={18} />
              <span>Favourites</span>
            </button>
          </nav>
        </div>
        <div className="relative flex items-center justify-between space-x-2 p-2 border-t">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <span>{user ? user.username : "User"}</span>
          </div>
            <button onClick={() => handleLogout(navigate)}>
              <LogOut size={20} color="#ff0000" className="cursor-pointer" />
            </button>
          </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6">

        {/* Search Bar */}
        <div className="flex items-center bg-gray-100 px-4 py-2 rounded-lg ">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            className="flex-1 bg-transparent outline-none px-2"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Filter 
            size={18} 
            onClick={toggleSortOrder}
            className="text-gray-500 cursor-pointer" />
        </div>
        
        {/* Notes */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {notesToDisplay.map((note) => (
            <Card key={note._id} className="p-3 bg-rose-50 relative" onClick={()=>handleCardClick(note)}>
              {/* Icons at bottom left if audio or image available */}
              <div className="absolute bottom-2 left-2 flex flex-row space-x-1">
                {note.audio && <Play size={14} className="text-gray-500"/>}
                {Array.isArray(note.images) && note.images.length > 0 && <Image size={14} className="text-gray-500" />}
              </div>
              {/* Dropdown menu at top right */}
              <div className="absolute top-2 right-2" onClick={(e)=>e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button title="Actions Menu" className="text-gray-500">
                      <EllipsisVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-50">
                    {/* RenameTitle menu item */}
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); handleRenameNote(note); }} 
                      className="flex items-center">
                      Rename
                      <NotebookPen size={10} className="text-gray-500 ml-1" />
                    </DropdownMenuItem>
                    {/* Delete option */}
                    <DropdownMenuItem 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setNoteToDelete(note);
                      }} 
                      className="flex items-center">
                      Delete
                      <Trash2 size={10} className="text-gray-500" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardContent>
                <p className="text-[10px] text-gray-500">{formatDateTime(note.savedAt)}</p>
                <h2 className="font-semibold">{note.title}</h2>
                <p className="text-xs text-gray-700">{note.content}</p>
              </CardContent>
              {/* Copy to clipboard button */}
              <div className="absolute bottom-1 right-2" onClick={(e)=>e.stopPropagation()}>
                <button 
                  onClick={() => navigator.clipboard.writeText(note.content)}
                  title="Copy note content">
                  <Copy size={14} className="text-gray-500" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Note Create Button */}
      <div className="absolute bottom-6 right-6">
        <Button title='Create Note' className="bg-rose-600 hover:bg-rose-800 text-white flex items-center px-6 py-3 rounded-full" onClick={() => setIsRecordingOpen(true)}>
          <span>Create Note</span><NotebookPen size={20} />
        </Button>
        <NoteCreatorDialog isOpen={isRecordingOpen} onClose={() => setIsRecordingOpen(false)} onAddNote={addNote} />
      </div>

      {/* Note editing dialog */}
      {selectedNote && (
        <NoteCardDialog 
          isOpen={isNoteDialogOpen} 
          onClose={() => { 
            setIsNoteDialogOpen(false); 
            setSelectedNote(null); 
          }} 
          note={selectedNote}
          onUpdate={handleUpdateNote} 
          className="cursor-pointer"
        />
      )}

      {/* Rename Dialog */}
      {renamingNote && (
        <AlertDialog open={renameDialogOpen} onOpenChange={(open) => { if (!open) handleRenameCancel(); }}>
          <AlertDialogContent className="bg-rose-50">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Note Title</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a new title for your note.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4">
              <input 
                type="text" 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)} 
                className="border rounded px-2 py-1 w-full" 
              />
            </div>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel onClick={handleRenameCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRenameSave} className="bg-rose-600 hover:bg-rose-800 text-white px-4 py-2 rounded-md">
                Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Deletion confirmation dialog */}
      {noteToDelete && (
        <AlertDialog open={true} onOpenChange={(open) => { if (!open) setNoteToDelete(null); }}>
          <AlertDialogContent className="bg-rose-50">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this note?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-rose-600 hover:bg-rose-800 text-white px-4 py-2 rounded-md">
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
