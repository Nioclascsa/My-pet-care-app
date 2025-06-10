const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1) Metro debe entender archivos .cjs
config.resolver.sourceExts.push('cjs');
// 2) Desactivar el chequeo de exports en package.json
config.resolver.unstable_enablePackageExports = false;

module.exports = config;