export const useFixtureApi = import.meta.env.MODE === 'test' || import.meta.env.VITE_API_MODE === 'fixture';
// Optional metadata lookup only; the URL library and embedded player need no key.
export const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY ?? '';
