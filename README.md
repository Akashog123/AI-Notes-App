# AI Notes App

A full-stack note-taking application that incorporates modern features and integrations.

## Features

- **Authentication:**  
  - Sign up and Login flows for secure access.
  
- **Dashboard:**  
  - Displays all user notes with search, filtering (by favourites), and sorting (newest/oldest).  
  - Clickable note cards show previews for text, images, and audio files.  

- **Note Creation:**  
  - Create new notes using a dialog with speech recognition support for recording content.
  - Multi-modal uploads: upload images and record audio while creating notes.
  
- **Note Editing:**  
  - Edit note title and content in a dedicated dialog.
  - Rename notes using an inline form.
  - Toggle favourite status for quick reference.
  - Delete notes with a confirmation prompt.
  - Copy note content with a single click.
  
- **Media Handling:**  
  - Support for live preview and download of uploaded media (images and audio).
  - Auto-upload selected images with count validation.
  
- **Backend & API:**  
  - Express server with CRUD endpoints for notes.
  - Multer integration for handling file uploads (images/audio).
  - MongoDB and Mongoose for storage and retrieval of user data and notes.

## Setup & Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server and the API server concurrently:
   ```bash
   npm run dev
   ```

3. Access the app at [http://localhost:5173](http://localhost:5173)

## Project Structure

- **/src:**  
  Contains React components for the Dashboard, Note dialogs, and Authentication views.

- **/server:**  
  Contains Express server code, API routes, controllers, and database models.

- **/d:/new app/package.json:**  
  Contains npm scripts to run the project and project dependencies.

## Additional Information

- Built with React, Express, and MongoDB.
- Uses Tailwind CSS for styling and various UI component libraries like Shadcn.
- Features speech recognition and live media preview functionalities.

Enjoy using AI Notes App!
