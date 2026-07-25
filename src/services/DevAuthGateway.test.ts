import { describe, expect, it, beforeEach } from 'vitest';
import { DevAuthGateway } from './DevAuthGateway';

describe('DevAuthGateway (scenario: login local)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('has no current user before signing in', () => {
    const gateway = new DevAuthGateway();
    expect(gateway.getCurrentUser()).toBeNull();
  });

  it('signs in and persists the dev user across gateway instances', async () => {
    const gateway = new DevAuthGateway();
    const user = await gateway.signIn();
    expect(user.name).toBe('Claudio');

    const anotherInstance = new DevAuthGateway();
    expect(anotherInstance.getCurrentUser()).toEqual(user);
  });

  it('clears the session on sign out', async () => {
    const gateway = new DevAuthGateway();
    await gateway.signIn();
    await gateway.signOut();
    expect(gateway.getCurrentUser()).toBeNull();
  });

  it('never claims a Microsoft/MSAL session', async () => {
    const gateway = new DevAuthGateway();
    const user = await gateway.signIn();
    expect(JSON.stringify(user).toLowerCase()).not.toContain('msal');
    expect(JSON.stringify(user).toLowerCase()).not.toContain('microsoft');
  });
});
