import { apiBaseUrl } from 'shared/config/env';
export async function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
    if (!apiBaseUrl) throw new Error('VITE_API_URL을 설정해 주세요.');
    const response = await fetch(`${apiBaseUrl}${path}`, { ...init, credentials: 'include' });
    if (!response.ok) throw new Error(`서버 요청 실패 (${response.status})`);
    return response;
}
