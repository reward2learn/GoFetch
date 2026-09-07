/**
 * Client-side passport OCR using Tesseract.js.
 *
 * Why client-side:
 *  - Tesseract.js ships ~43MB of WASM + language data. Pulling that into
 *    a Vercel serverless function blows past cold-start budgets and the
 *    10s Hobby / 60s Pro execution timeout.
 *  - The /api/scan/passport route already accepts a pre-extracted OCR
 *    string (it used to be a no-op server-side stub), so we run the
 *    heavy work in the browser and ship the resulting text alongside
 *    the image.
 *
 * Usage:
 *  - `runPassportOcr(image)` returns the raw OCR text.
 *  - Worker is cached and re-used across calls; terminated on page unload.
 *
 * This file is browser-only. The dynamic import of `tesseract.js` is
 * intentional — it keeps the ~43MB worker + WASM out of the initial
 * client bundle and only loads it when the user actually triggers
 * passport scanning.
 */
'use client';

import type TesseractType from 'tesseract.js';

export interface PassportOcrOptions {
  /** Languages to load (defaults to English). Multiple codes can be joined with `+`. */
  langs?: string;
  /**
   * Page segmentation mode. `SINGLE_BLOCK` (6) is the safest default for a
   * passport bio page that contains a mixture of printed fields and the
   * two-line MRZ. Other useful modes: `SINGLE_COLUMN` (4) for portrait
   * pages with one main block, `SPARSE_TEXT` (11) if the page has lots of
   * background graphics.
   */
  psm?: TesseractType.PSM;
  /**
   * Optional progress callback fired by Tesseract while it processes
   * the image. Useful for "Scanning… 42%" UI feedback.
   */
  onProgress?: (pct: number) => void;
}

type Worker = TesseractType.Worker;

let workerPromise: Promise<Worker> | null = null;
let currentLangs: string | null = null;
let currentPsm: TesseractType.PSM | null = null;

/**
 * Get (or create) a Tesseract worker. Cached per page so the language
 * pack + WASM are loaded exactly once. If the requested langs or PSM
 * differ from the cached worker's config, the worker is reinitialized.
 */
async function getWorker(
  langs: string,
  psm: TesseractType.PSM,
): Promise<Worker> {
  // Dynamic import keeps tesseract.js out of the initial client bundle.
  // It is ~1MB of JS + ~43MB of worker/WASM that we only want to load
  // when the user opens the passport scanner.
  const Tesseract = (await import('tesseract.js')) as unknown as typeof TesseractType;

  if (
    workerPromise &&
    currentLangs === langs &&
    currentPsm === psm
  ) {
    return workerPromise;
  }

  if (workerPromise) {
    // Tear down the stale worker before creating a new one with a
    // different config. terminate() releases the Web Worker.
    try {
      const old = await workerPromise;
      await old.terminate();
    } catch {
      // Ignore terminate errors — the worker may already be gone.
    }
    workerPromise = null;
  }

  currentLangs = langs;
  currentPsm = psm;

  workerPromise = Tesseract.createWorker(langs, Tesseract.OEM.LSTM_ONLY, {
    // Tesseract.js downloads its worker script (worker.min.js), WASM core
    // (tesseract-core.wasm) and trained language data (eng.traineddata.gz)
    // from the jsDelivr CDN at runtime. This means the *first* scan pulls
    // ~10MB of assets from cdn.jsdelivr.net; subsequent scans are served
    // from the browser cache.
    //
    // For self-hosted production deployments, set workerPath, corePath
    // and langPath to your own CDN:
    //   workerPath: 'https://your-cdn/tesseract/worker.min.js'
    //   corePath:   'https://your-cdn/tesseract/'
    //   langPath:   'https://your-cdn/tessdata/'
    logger: (m: { status: string; progress: number }) => {
      // eslint-disable-next-line no-console
      console.debug('[tesseract]', m.status, m.progress);
    },
  });

  const worker = await workerPromise;
  // Apply PSM after initialization — setParameters requires a live worker.
  await worker.setParameters({ tessedit_pageseg_mode: psm });
  return worker;
}

/**
 * Run OCR on the supplied image and return the extracted text.
 *
 * @param image  Anything Tesseract accepts: data URL, HTMLImageElement,
 *               File, Blob, Canvas, etc. We forward whatever the caller
 *               gives us unchanged.
 * @param opts   Optional language, page-segmentation, and progress hooks.
 */
export async function runPassportOcr(
  image: string | Blob | File | HTMLImageElement | HTMLCanvasElement,
  opts: PassportOcrOptions = {},
): Promise<string> {
  const langs = opts.langs ?? 'eng';
  const psm = opts.psm ?? ('6' as TesseractType.PSM); // PSM.SINGLE_BLOCK

  const worker = await getWorker(langs, psm);

  const result = await worker.recognize(image, {}, {
    text: true,
  });
  return (result.data.text ?? '').trim();
}

/**
 * Tear down the cached worker. Call this from a `useEffect` cleanup
 * to release the Web Worker when the component unmounts.
 */
export async function terminatePassportOcr(): Promise<void> {
  if (!workerPromise) return;
  try {
    const worker = await workerPromise;
    await worker.terminate();
  } catch {
    // Ignore — worker may already be terminated.
  } finally {
    workerPromise = null;
    currentLangs = null;
    currentPsm = null;
  }
}
