export const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const useFixtureApi = import.meta.env.MODE === 'test' || import.meta.env.VITE_API_MODE === 'fixture';
