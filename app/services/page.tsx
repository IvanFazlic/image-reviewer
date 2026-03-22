"use client";

import { useState, useCallback, useEffect } from "react";

interface ServiceCategory {
  name: string;
  items: string[];
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    name: "Chip Tuning / ECU",
    items: [
      "ECU remap – Stage 1",
      "ECU remap – Stage 2",
      "ECU remap – Stage 3",
      "Custom mapiranje",
      "Eco tuning",
      "Pops & bangs / sound tuning",
      "Speed limiter off",
      "Rev limiter podešavanje",
      "DSG / TCU tuning",
      "Launch control",
      "Optimizacija menjanja brzina",
    ],
  },
  {
    name: "Brisanje sistema",
    items: ["DPF OFF", "EGR OFF", "AdBlue OFF"],
  },
  {
    name: "ECU & Dijagnostika",
    items: [
      "Dijagnostika (kompjuterska)",
      "Popravka ECU",
      "ECU kloniranje",
      "Kodiranje modula",
      "Immo OFF / kodiranje ključeva",
    ],
  },
  {
    name: "Dyno & Performanse",
    items: [
      "Merenje snage (pre / posle)",
      "Custom dyno tuning",
      "Analiza performansi",
    ],
  },
  {
    name: "Servis & Održavanje",
    items: [
      "Mali servis (ulje + filteri)",
      "Veliki servis (kaiševi, pumpa vode)",
      "Zamena svećica / grejača",
      "Zamena tečnosti",
      "Kočnice (pločice, diskovi)",
      "Trap i amortizeri",
      "Kvačilo",
      "Popravka motora",
      "Akumulator",
      "Alternator / anlaser",
      "Instalacije i kvarovi",
    ],
  },
  {
    name: "Klima",
    items: ["Punjenje klime", "Dezinfekcija", "Popravka kompresora"],
  },
  {
    name: "Gume",
    items: ["Zamena guma", "Balansiranje", "Krpljenje guma"],
  },
  {
    name: "Performance delovi",
    items: [
      "Sportski filter (intake)",
      "Downpipe / izduv",
      "Intercooler upgrade",
      "Turbo upgrade",
    ],
  },
];

const STORAGE_KEY = "services-checklist";

function loadChecked(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveChecked(checked: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
}

export default function ServicesPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setChecked(loadChecked());
  }, []);

  const toggle = useCallback((item: string) => {
    setChecked((prev) => {
      const updated = { ...prev, [item]: !prev[item] };
      if (!updated[item]) delete updated[item];
      saveChecked(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    if (!confirm("Obrisati sve označene stavke?")) return;
    setChecked({});
    saveChecked({});
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const selectedServices = Object.keys(checked).filter((k) => checked[k]);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "services",
          services: selectedServices,
          submittedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setChecked({});
        saveChecked({});
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Greška pri slanju. Proverite konekciju.");
    }
    setSubmitting(false);
  };

  const totalItems = SERVICE_CATEGORIES.reduce(
    (sum, cat) => sum + cat.items.length,
    0
  );
  const checkedCount = Object.keys(checked).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold">Usluge</h1>
            <p className="text-sm text-zinc-400">
              {checkedCount} / {totalItems} označeno
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              Nazad
            </a>
            <button
              onClick={clearAll}
              disabled={checkedCount === 0}
              className="px-3 py-2 bg-red-900/50 hover:bg-red-800 disabled:bg-zinc-800/50 disabled:text-zinc-600 text-red-300 rounded-lg text-sm font-medium transition-colors"
            >
              Obriši sve
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || checkedCount === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg text-sm font-medium transition-colors"
            >
              {submitting
                ? "Šaljem..."
                : submitted
                  ? "Poslato!"
                  : `Pošalji (${checkedCount})`}
            </button>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-800">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{
            width: `${totalItems ? (checkedCount / totalItems) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Service categories */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {SERVICE_CATEGORIES.map((category) => {
          const catChecked = category.items.filter((i) => checked[i]).length;
          return (
            <section
              key={category.name}
              className="rounded-xl border border-zinc-800 overflow-hidden"
            >
              <div className="bg-zinc-900 px-5 py-3 flex items-center justify-between">
                <h2 className="font-semibold text-base">{category.name}</h2>
                <span className="text-xs text-zinc-500">
                  {catChecked}/{category.items.length}
                </span>
              </div>
              <div className="divide-y divide-zinc-800/60">
                {category.items.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={!!checked[item]}
                        onChange={() => toggle(item)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded border-2 border-zinc-600 peer-checked:border-blue-500 peer-checked:bg-blue-600 transition-colors flex items-center justify-center">
                        {checked[item] && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm transition-colors ${
                        checked[item] ? "text-blue-300" : "text-zinc-300"
                      }`}
                    >
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
