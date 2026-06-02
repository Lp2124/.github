import { describe, expect, it } from 'vitest';
import { storeSettingsFormSchema } from './settings';

describe('store settings validation', () => {
  it('normalizes and validates supported settings', () => {
    const parsed = storeSettingsFormSchema.parse({ name: 'Ferretería De La O', timezone: 'America/Mexico_City', currency: 'mxn' });
    expect(parsed.currency).toBe('MXN');
  });

  it('rejects unsafe or malformed settings', () => {
    expect(storeSettingsFormSchema.safeParse({ name: 'X', timezone: 'bad', currency: 'MXN' }).success).toBe(false);
    expect(storeSettingsFormSchema.safeParse({ name: 'Ferretería', timezone: 'America/Mexico_City', currency: 'MXN<script>' }).success).toBe(false);
  });
});
