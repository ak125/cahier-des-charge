/**
 * @type {import('@remix-run/dev').AppConfig}
 */
// Fichier de configuration Remix
export default {
  ignoredRouteFiles: ["**/.*"],
  appDirectory: "app",
  serverBuildPath: "build/index.js",
  publicPath: "/build/",
  serverModuleFormat: "esm"
};