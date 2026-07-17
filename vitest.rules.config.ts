import { defineConfig } from 'vitest/config'

// The Firestore rules suite talks to the running emulator over the network, so it
// needs the node environment (not the jsdom default) and is kept out of the normal
// `npm run test:run` — see the tests/rules exclude in vitest.config.ts.
//
//   npm run emulators   # in another shell
//   npm run test:rules
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
})
