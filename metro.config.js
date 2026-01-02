const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro"); // make sure this import exists

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("avif");

// Improve stability and connection reliability
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set longer timeout for Metro bundler
      res.setTimeout(120000); // 2 minutes
      return middleware(req, res, next);
    };
  },
};

// Reset cache to prevent update errors
config.resetCache = true;
config.cacheStores = [];

// Improve watchman stability
config.watchFolders = [__dirname];

const uniwindConfig = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});

module.exports = uniwindConfig;
