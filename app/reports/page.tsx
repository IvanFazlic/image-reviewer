"use client";

import { useState, useEffect } from "react";

interface Report {
  _id: string;
  ratings: Record<string, { rating: string | null; comment: string }>;
  submittedAt: string;
  totalImages: number;
  reviewedCount: number;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => {
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const downloadJson = (report: Report) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${report._id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    const blob = new Blob([JSON.stringify(reports, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all-reports.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStats = (report: Report) => {
    const entries = Object.values(report.ratings);
    const good = entries.filter((e) => e.rating === "good").length;
    const bad = entries.filter((e) => e.rating === "bad").length;
    const off = entries.filter((e) => e.rating === "slight-off").length;
    const commented = entries.filter((e) => e.comment).length;
    return { good, bad, off, commented };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              Back to Review
            </a>
            <h1 className="text-xl font-bold">Reports</h1>
            <span className="text-sm text-zinc-500">
              {reports.length} report{reports.length !== 1 ? "s" : ""}
            </span>
          </div>
          {reports.length > 0 && (
            <button
              onClick={downloadAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
            >
              Download All JSON
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        {reports.length === 0 && (
          <p className="text-zinc-500 text-center py-20">
            No reports submitted yet.
          </p>
        )}

        {reports.map((report) => {
          const stats = getStats(report);
          const isExpanded = expanded === report._id;
          return (
            <div
              key={report._id}
              className="border border-zinc-800 rounded-xl overflow-hidden"
            >
              <div
                className="bg-zinc-900 p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() =>
                  setExpanded(isExpanded ? null : report._id)
                }
              >
                <div>
                  <p className="font-medium">
                    {new Date(report.submittedAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {report.reviewedCount} / {report.totalImages} reviewed
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-400">{stats.good} good</span>
                    <span className="text-red-400">{stats.bad} bad</span>
                    <span className="text-yellow-400">{stats.off} off</span>
                    {stats.commented > 0 && (
                      <span className="text-blue-400">
                        {stats.commented} comments
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadJson(report);
                    }}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-zinc-800 p-4 max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-zinc-500 text-left">
                        <th className="pb-2">Image</th>
                        <th className="pb-2">Rating</th>
                        <th className="pb-2">Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(report.ratings).map(([src, data]) => (
                        <tr key={src} className="border-t border-zinc-800/50">
                          <td className="py-1.5 pr-4 text-xs text-zinc-400 max-w-xs truncate">
                            {src}
                          </td>
                          <td className="py-1.5 pr-4">
                            <span
                              className={`text-xs font-medium ${
                                data.rating === "good"
                                  ? "text-green-400"
                                  : data.rating === "bad"
                                    ? "text-red-400"
                                    : data.rating === "slight-off"
                                      ? "text-yellow-400"
                                      : "text-zinc-600"
                              }`}
                            >
                              {data.rating || "—"}
                            </span>
                          </td>
                          <td className="py-1.5 text-xs text-zinc-400">
                            {data.comment || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
