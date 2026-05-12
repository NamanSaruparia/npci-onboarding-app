"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFPageProxy } from "pdfjs-dist";
import { Document, Page, pdfjs } from "react-pdf";
import { Maximize2, Minimize2 } from "lucide-react";
import { useRouter } from "next/navigation";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { PageHeader } from "../../../components/PageHeader";
import { SessionLoading } from "../../../components/SessionLoading";
import { useRequireSession } from "../../../hooks/useRequireSession";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDF_URL = "/induction/npci-culture-playbook.pdf";

const LAYOUT_STORAGE_KEY = "npci-culture-playbook-layout";

type ReaderLayout = "full" | "embedded";

/** Full-page reader: upper bound so ultra-wide screens do not allocate huge canvases. */
const MAX_PAGE_WIDTH_FULL_PX = 2000;
/** Embedded card: upper bound for the same reason. */
const MAX_PAGE_WIDTH_EMBEDDED_PX = 1080;

type PageIntrinsic = { w: number; h: number };

function readStoredLayout(): ReaderLayout {
  if (typeof window === "undefined") return "full";
  const v = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
  return v === "embedded" ? "embedded" : "full";
}

export default function CulturePlaybookPage() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();
  const fitRef = useRef<HTMLDivElement>(null);
  const [readerLayout, setReaderLayout] = useState<ReaderLayout>("full");
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageWidth, setPageWidth] = useState(960);
  /** PDF page size at scale 1 — used to fit the whole page inside the viewer (may scale down). */
  const [pageIntrinsic, setPageIntrinsic] = useState<PageIntrinsic | null>(null);

  useEffect(() => {
    // Intentionally after mount so SSR stays "full" and client can read localStorage without hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync external persisted layout preference
    setReaderLayout(readStoredLayout());
  }, []);

  const setLayout = useCallback((next: ReaderLayout) => {
    setReaderLayout(next);
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, next);
    } catch {
      /* ignore quota */
    }
  }, []);

  const measureWidth = useCallback(() => {
    const el = fitRef.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const padX =
      (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const padY =
      (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const innerW = Math.floor(el.clientWidth - padX);
    let innerH = Math.floor(el.clientHeight - padY);
    if (innerH < 120) {
      const rect = el.getBoundingClientRect();
      innerH = Math.max(
        200,
        Math.floor(window.innerHeight - rect.top - 16),
      );
    }
    const cap =
      readerLayout === "full" ? MAX_PAGE_WIDTH_FULL_PX : MAX_PAGE_WIDTH_EMBEDDED_PX;
    const margin = 6;
    const availW = Math.max(120, innerW - margin);
    const availH = Math.max(120, innerH - margin);

    let next: number;
    if (pageIntrinsic && pageIntrinsic.w > 0 && pageIntrinsic.h > 0) {
      const aspectHOverW = pageIntrinsic.h / pageIntrinsic.w;
      const widthIfHeightLimited = Math.floor(availH / aspectHOverW);
      next = Math.min(availW, widthIfHeightLimited, cap);
    } else {
      next = Math.min(cap, Math.max(280, innerW - 4));
    }
    setPageWidth(Math.max(160, next));
  }, [readerLayout, pageIntrinsic]);

  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;

    const runMeasure = () => {
      queueMicrotask(() => {
        measureWidth();
      });
    };

    runMeasure();
    const ro = new ResizeObserver(runMeasure);
    ro.observe(el);
    window.addEventListener("resize", runMeasure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", runMeasure);
    };
  }, [measureWidth, readerLayout, pageIntrinsic]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      setPageNumber(1);
      setLoadError(null);
      requestAnimationFrame(measureWidth);
    },
    [measureWidth],
  );

  const onPdfPageLoadSuccess = useCallback(
    (page: PDFPageProxy) => {
      const vp = page.getViewport({ scale: 1 });
      setPageIntrinsic({ w: vp.width, h: vp.height });
      requestAnimationFrame(measureWidth);
    },
    [measureWidth],
  );

  const onLoadError = useCallback((err: Error) => {
    setLoadError(err.message || "Could not load PDF.");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && pageNumber > 1) {
        e.preventDefault();
        setPageNumber((p) => Math.max(1, p - 1));
      }
      if (e.key === "ArrowRight" && numPages > 0 && pageNumber < numPages) {
        e.preventDefault();
        setPageNumber((p) => Math.min(numPages, p + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages, pageNumber]);

  const pageNav = (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      <div
        className={[
          "flex items-center gap-1.5 rounded-xl p-1",
          readerLayout === "full"
            ? "border border-white/10 bg-white/5"
            : "border border-slate-200 bg-slate-50",
        ].join(" ")}
      >
        <button
          type="button"
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          className={[
            "rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35",
            readerLayout === "full"
              ? "text-white hover:bg-white/10"
              : "text-slate-800 hover:bg-white",
          ].join(" ")}
        >
          Prev
        </button>
        <button
          type="button"
          disabled={numPages === 0 || pageNumber >= numPages}
          onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))}
          className={[
            "rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35",
            readerLayout === "full"
              ? "text-white hover:bg-white/10"
              : "text-slate-800 hover:bg-white",
          ].join(" ")}
        >
          Next
        </button>
      </div>
      <p
        className={[
          "min-w-[5.5rem] text-right text-sm font-medium tabular-nums",
          readerLayout === "full" ? "text-slate-300" : "text-slate-600",
        ].join(" ")}
      >
        {numPages > 0 ? (
          <>
            <span className={readerLayout === "full" ? "text-white" : "text-slate-900"}>
              {pageNumber}
            </span>
            <span className="text-slate-500"> / </span>
            <span>{numPages}</span>
          </>
        ) : (
          <span className="text-slate-500">…</span>
        )}
      </p>
    </div>
  );

  const layoutToggle = (
    <button
      type="button"
      onClick={() => setLayout(readerLayout === "full" ? "embedded" : "full")}
      className={[
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition",
        readerLayout === "full"
          ? "border-white/15 bg-white/5 text-slate-100 hover:border-white/25 hover:bg-white/10"
          : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
      title={readerLayout === "full" ? "Standard layout" : "Full page view"}
      aria-label={readerLayout === "full" ? "Switch to standard layout" : "Switch to full page view"}
    >
      {readerLayout === "full" ? (
        <Minimize2 className="h-5 w-5" aria-hidden />
      ) : (
        <Maximize2 className="h-5 w-5" aria-hidden />
      )}
    </button>
  );

  const pdfBlock = (
    <div className="mx-auto flex w-full justify-center">
      <Document
        file={PDF_URL}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onLoadError}
        loading={
          <div
            className={[
              "flex min-h-[50vh] w-full items-center justify-center rounded-lg border text-sm",
              readerLayout === "full"
                ? "max-w-3xl border-white/10 bg-white/[0.03] text-slate-400"
                : "max-w-3xl border-slate-200 bg-white text-slate-500",
            ].join(" ")}
          >
            Loading document…
          </div>
        }
        className="flex w-full flex-col items-center"
      >
        <Page
          key={`${pageNumber}-${pageWidth}`}
          pageNumber={pageNumber}
          width={pageWidth}
          onLoadSuccess={onPdfPageLoadSuccess}
          renderTextLayer
          renderAnnotationLayer
          className={[
            "w-auto max-w-full bg-white",
            readerLayout === "full"
              ? "shadow-2xl shadow-black/50 ring-1 ring-white/20"
              : "shadow-md ring-1 ring-slate-200/80",
          ].join(" ")}
        />
      </Document>
    </div>
  );

  if (!ready || !sessionUser) return <SessionLoading />;

  const isFull = readerLayout === "full";

  return (
    <div
      className={[
        "flex h-dvh min-h-0 flex-col overflow-hidden",
        isFull ? "bg-[#0f1419] text-slate-100" : "bg-slate-50 text-slate-800",
      ].join(" ")}
    >
      <header
        className={[
          "sticky top-0 z-30 flex shrink-0 flex-wrap items-center gap-3 px-3 py-3 backdrop-blur-md sm:gap-4 sm:px-5 sm:py-3.5",
          isFull
            ? "border-b border-white/10 bg-[#0f1419]/95"
            : "border-b border-slate-200/90 bg-white/95",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => router.push("/learn/hr-induction")}
          className={[
            "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition",
            isFull
              ? "border-white/15 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10"
              : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50",
          ].join(" ")}
        >
          <span aria-hidden className="text-base leading-none">
            ←
          </span>
          <span className="hidden sm:inline">Induction</span>
        </button>

        <div
          className={["hidden h-8 w-px sm:block", isFull ? "bg-white/10" : "bg-slate-200"].join(" ")}
          aria-hidden
        />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-lg" aria-hidden>
            📘
          </span>
          <div className="min-w-0">
            <h1
              className={[
                "truncate text-sm font-semibold tracking-tight sm:text-base",
                isFull ? "text-white" : "text-slate-900",
              ].join(" ")}
            >
              Culture playbook
            </h1>
            <p className={["hidden text-xs sm:block", isFull ? "text-slate-400" : "text-slate-500"].join(" ")}>
              {isFull
                ? "Whole page fits the view (scaled down if needed) · Arrow keys change pages"
                : "Use full page for more space"}
            </p>
          </div>
        </div>

        {isFull ? pageNav : null}

        {layoutToggle}
      </header>

      {isFull && loadError ? (
        <p className="mx-auto max-w-xl shrink-0 px-4 py-3 text-center text-sm text-rose-300">{loadError}</p>
      ) : null}

      <div
        className={[
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          isFull ? "w-full" : "mx-auto w-full max-w-[90rem] overflow-y-auto px-2 py-4 sm:px-4 sm:py-6",
        ].join(" ")}
      >
        <div
          className={[
            "flex min-h-0 flex-1 flex-col",
            isFull
              ? ""
              : "app-page-base min-h-0 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-6",
          ].join(" ")}
        >
          {!isFull ? (
            <>
              <PageHeader
                title="Culture playbook"
                subtitle="The full page fits in the viewer. Use the arrows to change pages."
                titleEmoji="📘"
              />
              <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                  >
                    Previous page
                  </button>
                  <button
                    type="button"
                    disabled={numPages === 0 || pageNumber >= numPages}
                    onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                  >
                    Next page
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {numPages > 0 ? (
                    <>
                      Page <span className="tabular-nums text-slate-900">{pageNumber}</span>
                      <span className="text-slate-400"> / </span>
                      <span className="tabular-nums text-slate-900">{numPages}</span>
                    </>
                  ) : (
                    <span className="text-slate-500">Loading…</span>
                  )}
                </p>
              </div>
            </>
          ) : null}

          {!isFull && loadError ? (
            <p className="mt-3 shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {loadError}
            </p>
          ) : null}

          <div
            ref={fitRef}
            className={[
              "flex min-h-0 flex-1 flex-col overflow-auto overscroll-contain",
              isFull
                ? "items-center justify-center px-2 pb-6 pt-2 sm:px-5 sm:pb-8 sm:pt-3"
                : "items-center justify-center mt-4 rounded-2xl border border-slate-200 bg-slate-100/90 p-2 shadow-inner sm:p-4",
            ].join(" ")}
          >
            {pdfBlock}
          </div>

          {!isFull ? (
            <div className="flex shrink-0 flex-wrap gap-3 pt-3">
              <button
                type="button"
                onClick={() => router.push("/learn/hr-induction")}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-gray-300 hover:text-slate-900"
              >
                <span aria-hidden>←</span>
                Back to Induction
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
