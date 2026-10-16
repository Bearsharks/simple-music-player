import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup);

// Browser database emulation only; real browser persistence is verified separately.
import 'fake-indexeddb/auto';
