import { describe, expect, it, beforeEach } from 'vitest';
import { DevAuthGateway, DEV_USERS } from './DevAuthGateway';

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

  it('switches identity via signInAs, without requiring signIn() first', async () => {
    const gateway = new DevAuthGateway();
    const wmoriyama = DEV_USERS.find((option) => option.user.login === 'wmoriyama')!.user;

    await gateway.signInAs(wmoriyama);

    expect(gateway.getCurrentUser()).toEqual(wmoriyama);
  });

  it('lists exactly the two known dev identities, Claudio and wmoriyama', () => {
    expect(DEV_USERS.map((option) => option.user.login).sort()).toEqual(['claudio.dev', 'wmoriyama']);
  });
});
