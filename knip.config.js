export default {
  // Only analyze actual app source
  project: ['src/**/*.{ts,tsx,js,jsx}'],

  // Ignore parked features and non-source artifacts
  ignore: [
    'src/_planned/**',
    '.github/**',
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    'coverage/**',
  ],
};
