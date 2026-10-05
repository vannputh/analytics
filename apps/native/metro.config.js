const path = require("path")
const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)
const rootNodeModules = path.resolve(__dirname, "../../node_modules")

// Force Metro to resolve from the workspace root to avoid duplicate local installs
// under apps/native/node_modules after SDK upgrades.
config.resolver.nodeModulesPaths = [rootNodeModules]
config.resolver.disableHierarchicalLookup = true

const workspaceRoot = path.resolve(__dirname, "../..")

config.watchFolders = [
  ...(config.watchFolders ?? []),
  rootNodeModules,
  workspaceRoot,
]

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: path.join(rootNodeModules, "react"),
  "react/jsx-runtime": path.join(rootNodeModules, "react/jsx-runtime"),
  "react/jsx-dev-runtime": path.join(rootNodeModules, "react/jsx-dev-runtime"),
  "expo-symbols": path.join(rootNodeModules, "expo-symbols"),
  "expo-glass-effect": path.join(rootNodeModules, "expo-glass-effect"),
}

module.exports = config
