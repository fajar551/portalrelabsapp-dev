const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const os = require('os');

// Polyfill untuk os.availableParallelism() jika tidak tersedia
if (typeof os.availableParallelism !== 'function') {
  os.availableParallelism = () => {
    return os.cpus().length || 1;
  };
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
