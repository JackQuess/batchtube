import { deleteConfig, getConfigPath } from '../config.js';

export function runLogout(): void {
  const path = getConfigPath();
  const removed = deleteConfig();
  if (removed) {
    console.log('Logged out. Credentials removed from', path);
  } else {
    console.log('Not logged in. No credentials to remove.');
  }
}
