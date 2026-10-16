import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup);

// Browser database emulation only; real browser persistence is verified separately.
import 'fake-indexeddb/auto';

// jsdom has no pointer capture/scrolling layout. Real pointer behavior is covered
// by Playwright; these no-op DOM methods allow Radix's keyboard paths to mount.
HTMLElement.prototype.hasPointerCapture ??= () => false;
HTMLElement.prototype.setPointerCapture ??= () => {};
HTMLElement.prototype.releasePointerCapture ??= () => {};
HTMLElement.prototype.scrollIntoView ??= () => {};
