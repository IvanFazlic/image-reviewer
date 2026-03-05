"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Rating = "good" | "bad" | "slight-off" | null;

interface ImageRating {
  rating: Rating;
  comment: string;
}

interface ImageData {
  folder: string;
  filename: string;
  src: string;
}

const STORAGE_KEY = "picker-ratings";
const FOLDER_KEY = "picker-active-folder";

function loadRatings(): Record<string, ImageRating> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveRatings(ratings: Record<string, ImageRating>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
}

export default function Home() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("");
  const [ratings, setRatings] = useState<Record<string, ImageRating>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const historyRef = useRef<{ src: string; prev: ImageRating | undefined }[]>([]);

  useEffect(() => {
    setRatings(loadRatings());
    const saved = localStorage.getItem(FOLDER_KEY);
    if (saved) setActiveFolder(saved);

    fetch("/api/images")
      .then((r) => r.json())
      .then((data) => {
        setImages(data.images);
        setFolders(data.folders);
        if (!saved && data.folders.length > 0) {
          setActiveFolder(data.folders[0]);
        }
        setLoading(false);
      });
  }, []);

  const updateRating = useCallback(
    (src: string, rating: Rating) => {
      const currentRatings = loadRatings();
      historyRef.current = [...historyRef.current, { src, prev: currentRatings[src] }];
      setRatings((prev) => {
        const updated = {
          ...prev,
          [src]: { ...prev[src], rating, comment: prev[src]?.comment || "" },
        };
        saveRatings(updated);
        return updated;
      });
    },
    []
  );

  const undoLast = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const last = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setRatings((prev) => {
      const updated = { ...prev };
      if (last.prev) {
        updated[last.src] = last.prev;
      } else {
        delete updated[last.src];
      }
      saveRatings(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    if (!confirm("Clear all ratings? This cannot be undone.")) return;
    setRatings({});
    historyRef.current = [];
    saveRatings({});
  }, []);

  const updateComment = useCallback(
    (src: string, comment: string) => {
      setRatings((prev) => {
        const updated = {
          ...prev,
          [src]: { ...prev[src], comment, rating: prev[src]?.rating || null },
        };
        saveRatings(updated);
        return updated;
      });
    },
    []
  );

  const handleFolderChange = (folder: string) => {
    setActiveFolder(folder);
    localStorage.setItem(FOLDER_KEY, folder);
  };

  const filteredImages = images.filter((img) => img.folder === activeFolder);
  const reviewedCount = Object.values(ratings).filter((r) => r.rating).length;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratings,
          submittedAt: new Date().toISOString(),
          totalImages: images.length,
          reviewedCount,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(FOLDER_KEY);
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Failed to submit. Check your connection.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Loading images...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold">Watermark QA Review</h1>
            <p className="text-sm text-zinc-400">
              {reviewedCount} / {images.length} reviewed
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={undoLast}
              disabled={historyRef.current.length === 0}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-600 rounded-lg text-sm font-medium transition-colors"
            >
              Undo Last
            </button>
            <button
              onClick={clearAll}
              disabled={reviewedCount === 0}
              className="px-3 py-2 bg-red-900/50 hover:bg-red-800 disabled:bg-zinc-800/50 disabled:text-zinc-600 text-red-300 rounded-lg text-sm font-medium transition-colors"
            >
              Clear All
            </button>
            <a
              href="/reports"
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              View Reports
            </a>
            <button
              onClick={handleSubmit}
              disabled={submitting || reviewedCount === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg text-sm font-medium transition-colors"
            >
              {submitting
                ? "Submitting..."
                : submitted
                  ? "Submitted!"
                  : `Submit Report (${reviewedCount})`}
            </button>
          </div>
        </div>
      </header>

      {/* Folder tabs */}
      <nav className="bg-zinc-900 border-b border-zinc-800 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto py-2">
          {folders.map((folder) => {
            const folderImages = images.filter((i) => i.folder === folder);
            const folderReviewed = folderImages.filter(
              (i) => ratings[i.src]?.rating
            ).length;
            return (
              <button
                key={folder}
                onClick={() => handleFolderChange(folder)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  activeFolder === folder
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                }`}
              >
                {folder.replace(/-/g, " ")}
                <span className="ml-2 text-xs opacity-70">
                  {folderReviewed}/{folderImages.length}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-800">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{
            width: `${images.length ? (reviewedCount / images.length) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Images grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((img) => {
            const r = ratings[img.src];
            return (
              <div
                key={img.src}
                className={`rounded-xl overflow-hidden border transition-colors ${
                  r?.rating === "good"
                    ? "border-green-600"
                    : r?.rating === "bad"
                      ? "border-red-600"
                      : r?.rating === "slight-off"
                        ? "border-yellow-500"
                        : "border-zinc-800"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.filename}
                  loading="lazy"
                  className="w-full h-auto"
                />
                <div className="bg-zinc-900 p-3 space-y-2">
                  <p className="text-xs text-zinc-500 truncate" title={img.filename}>
                    {img.filename}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateRating(img.src, "good")}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                        r?.rating === "good"
                          ? "bg-green-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-green-900 hover:text-green-300"
                      }`}
                    >
                      Good
                    </button>
                    <button
                      onClick={() => updateRating(img.src, "bad")}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                        r?.rating === "bad"
                          ? "bg-red-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-red-900 hover:text-red-300"
                      }`}
                    >
                      Bad
                    </button>
                    <button
                      onClick={() => updateRating(img.src, "slight-off")}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                        r?.rating === "slight-off"
                          ? "bg-yellow-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-yellow-900 hover:text-yellow-300"
                      }`}
                    >
                      Off
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Comment..."
                    value={r?.comment || ""}
                    onChange={(e) => updateComment(img.src, e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
