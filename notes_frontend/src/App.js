import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/*
  Color palette from work item:
  primary: #1976d2
  secondary: #424242
  accent: #ffb300
*/
// Utility functions for working with localStorage notes
const NOTES_KEY = "notes_manager_notes_v1";

function getNotesFromStorage() {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}
function setNotesToStorage(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
// Generate unique id
function uuid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  );
}

// PUBLIC_INTERFACE
/**
 * Root notes manager application.
 * - Top nav: app bar + new note button + search.
 * - Left: notes list (filtered).
 * - Right: note details editor panel.
 * - Responsive for mobile (column layout).
 * - All notes stored in browser localStorage.
 */
function App() {
  // Notes state: [{id, title, content, lastModified}]
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false); // true when editing fields
  const detailsRef = useRef(null);

  // On mount, load notes from storage
  useEffect(() => {
    setNotes(getNotesFromStorage());
  }, []);

  // Whenever notes change, update storage
  useEffect(() => {
    setNotesToStorage(notes);
  }, [notes]);

  // If no note is selected, select the first filtered note
  useEffect(() => {
    const filtered = filteredNotes();
    if (
      (!selectedNoteId && filtered.length > 0) ||
      (selectedNoteId && !notes.find((n) => n.id === selectedNoteId))
    ) {
      setSelectedNoteId(filtered[0]?.id ?? null);
    }
    // eslint-disable-next-line
  }, [notes, search]);

  // Filter notes by title/content search
  function filteredNotes() {
    const term = search.trim().toLowerCase();
    if (!term) return notes.slice().sort(sortByModified);
    return notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          n.content.toLowerCase().includes(term)
      )
      .sort(sortByModified);
  }
  // Most recent first
  function sortByModified(a, b) {
    return b.lastModified - a.lastModified;
  }

  // Get note currently selected
  const note = notes.find((n) => n.id === selectedNoteId) || null;

  // PUBLIC_INTERFACE
  function handleNewNote() {
    const note = {
      id: uuid(),
      title: "Untitled",
      content: "",
      lastModified: Date.now(),
    };
    setNotes([note, ...notes]);
    setSelectedNoteId(note.id);
    setEditing(true);
  }
  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    // eslint-disable-next-line no-restricted-globals
    if (window.confirm("Delete this note?")) {
      const idx = notes.findIndex((n) => n.id === id);
      setNotes(notes.filter((n) => n.id !== id));
      // select next note
      if (selectedNoteId === id) {
        const next =
          filteredNotes().find((n) => n.id !== id) ||
          filteredNotes()[0] ||
          null;
        setSelectedNoteId(next?.id ?? null);
      }
      setEditing(false);
    }
  }
  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedNoteId(id);
    setEditing(false);
  }
  // PUBLIC_INTERFACE
  function handleEdit(field, value) {
    if (!note) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? {
              ...n,
              [field]: value,
              lastModified: Date.now(),
            }
          : n
      )
    );
    setEditing(true);
  }
  // PUBLIC_INTERFACE
  function handleBlurSave() {
    setEditing(false);
  }

  // Keyboard shortcut for new note (Cmd/Ctrl+N)
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNewNote();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line
  }, [notes]);

  // Theme toggle
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  // PUBLIC_INTERFACE
  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  // Mobile responsiveness: collapse sidebar if no note
  const isMobile =
    window.matchMedia &&
    window.matchMedia("(max-width: 768px)").matches;

  return (
    <div className="notes-app-root">
      {/* TopNav */}
      <nav className="top-nav">
        <div className="nav-left">
          <span className="logo" style={{ color: "var(--primary)" }}>
            📝 Notes
          </span>
        </div>
        <div className="nav-center">
          <input
            className="search-input"
            type="text"
            placeholder="Search notes..."
            aria-label="Search notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="nav-right">
          <button
            className="btn primary"
            aria-label="Create note"
            onClick={handleNewNote}
            title="New Note (Ctrl+N)"
            style={{ marginRight: 12 }}
          >
            + New Note
          </button>
          <button
            className="btn round"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            title="Toggle light/dark mode"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </nav>

      {/* Main layout: sidebar + details */}
      <div className="notes-main-layout">
        <aside className={`notes-sidebar${isMobile ? " mobile" : ""}`}>
          <div className="sidebar-header">
            <span className="sidebar-title">Your Notes</span>
            <span className="sidebar-count">
              {filteredNotes().length}
            </span>
          </div>
          <ul className="notes-list" aria-label="Notes list">
            {filteredNotes().length === 0 && (
              <li className="notes-list-empty">No notes found.</li>
            )}
            {filteredNotes().map((n) => (
              <li
                key={n.id}
                className={
                  "notes-list-item" +
                  (selectedNoteId === n.id ? " selected" : "")
                }
                tabIndex={0}
                onClick={() => handleSelectNote(n.id)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSelectNote(n.id)
                }
                aria-selected={selectedNoteId === n.id}
              >
                <div className="note-list-info">
                  <span className="note-title">
                    {n.title || <i>Untitled</i>}
                  </span>
                  <span className="note-preview">
                    {truncate(n.content)}
                  </span>
                </div>
                <button
                  className="btn btn-delete"
                  aria-label="Delete note"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(n.id);
                  }}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <main className="note-details-panel" ref={detailsRef}>
          {!note ? (
            <div className="empty-details">
              <span>Select a note on the left or create a new one.</span>
            </div>
          ) : (
            <form className="note-edit-form" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <input
                className="note-title-input"
                type="text"
                placeholder="Title"
                value={note.title}
                aria-label="Note title"
                onChange={(e) => handleEdit("title", e.target.value)}
                onBlur={handleBlurSave}
                maxLength={60}
                required
              />
              <textarea
                className="note-content-input"
                placeholder="Write your note here..."
                value={note.content}
                aria-label="Note content"
                onChange={(e) => handleEdit("content", e.target.value)}
                onBlur={handleBlurSave}
                rows={isMobile ? 8 : 14}
                spellCheck={true}
                required
              />
              <div className="details-footer">
                <span className="timestamp">
                  {formatDate(note.lastModified)}
                </span>
                <button
                  className="btn btn-delete"
                  type="button"
                  aria-label="Delete note"
                  title="Delete"
                  onClick={() => handleDeleteNote(note.id)}
                >
                  Delete
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

// Utility for preview text
function truncate(text, max = 30) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.substring(0, max) + "...";
}

// Format timestamp
function formatDate(ts) {
  const date = new Date(ts);
  return (
    date.toLocaleDateString() + " " + date.toLocaleTimeString().slice(0, 5)
  );
}

export default App;
