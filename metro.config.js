const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = withNativewind(getDefaultConfig(__dirname));

// NativeWind swaps `react-native` for a wrapper whose export list lacks `AssetRegistry`.
// expo-asset reads it from `react-native`, so font and image assets fail to load on native
// ("Cannot read property 'getAssetByID' of undefined"). Give expo-asset the real module.
const resolveWithNativewind = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fromExpoAsset = context.originModulePath.includes(`${path.sep}expo-asset${path.sep}`);
  if (moduleName === 'react-native' && fromExpoAsset) {
    return context.resolveRequest(context, moduleName, platform);
  }
  return resolveWithNativewind
    ? resolveWithNativewind(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
