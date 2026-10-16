import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        testTimeout: 60_000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
        },
    },
});
