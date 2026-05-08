const DEVICE_ID_KEY = 'grouptrace_device_id';
const USER_NAME_KEY = 'grouptrace_user_name';

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getUserName(): string | null {
  return localStorage.getItem(USER_NAME_KEY);
}

export function setUserName(name: string): void {
  localStorage.setItem(USER_NAME_KEY, name);
}

export function clearSession(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}
