"use client";

import { useEffect, useRef, useState } from "react";

export default function InfoButtonModal() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const openModal = () => {
    console.log('Opening modal');
    setOpen(true);
  };
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="Open info"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        title="About this app"
      >
        {/* Info icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.02M12 6.75h.008v.008H12V6.75zm9 5.25a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-title"
        >
          <div
            ref={dialogRef}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex justify-end">
                <button
                  onClick={close}
                  aria-label="Close"
                  className="-m-1.5 rounded-md p-1.5 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-3 space-y-3 text-sm text-gray-700">
                <p>
                  BookBlend is a personal project by{" "}
                  <a
                    href="https://x.com/DJbennyBuff"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Ben Wallace
                  </a>{" "}
                  and is not affiliated with Goodreads in any way.
                </p>
                <p>
                  Check out the Githubs to see how it was built:{" "}
                  <a
                    href="https://github.com/benfwalla/book-blend"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Frontend
                  </a>{" "}
                  |{" "}
                  <a
                    href="https://github.com/benfwalla/book-blend-backend"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Backend
                  </a>
                  .
                </p>
                <p>
                  If you're so inclined,{" "}
                  <a
                    href="https://account.venmo.com/u/BenWallace4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Venmo me
                  </a>{" "}
                  $2 to cover app costs lol
                </p>
              </div>
            </div>
          </div>
      )}
    </>
  );
}
