import * as migration_20260715_123712_initial from './20260715_123712_initial';
import * as migration_20260715_132725_add_settings from './20260715_132725_add_settings';

export const migrations = [
  {
    up: migration_20260715_123712_initial.up,
    down: migration_20260715_123712_initial.down,
    name: '20260715_123712_initial',
  },
  {
    up: migration_20260715_132725_add_settings.up,
    down: migration_20260715_132725_add_settings.down,
    name: '20260715_132725_add_settings'
  },
];
