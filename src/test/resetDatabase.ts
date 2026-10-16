import { DATABASE_NAME } from 'shared/api/localAPI';
export function resetDatabase(): Promise<void> {
 return new Promise((resolve,reject)=>{const req=indexedDB.deleteDatabase(DATABASE_NAME);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('Test database blocked'));});
}
