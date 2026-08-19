const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const rootNodeModules = path.resolve(workspaceRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// 1. Watch only what Metro must resolve from: the hoisted root node_modules and
//    the shared workspace packages.  Watching all of `workspaceRoot` also crawled
//    .git, apps/api/.wrangler and apps/web/dist — tens of thousands of files that
//    can never be imported, which slowed every cold start and rebuild.
config.watchFolders = [
  ...new Set([
    ...(config.watchFolders ?? []),
    rootNodeModules,
    path.resolve(workspaceRoot, 'packages'),
  ]),
];

// 2. pnpm + node-linker=hoisted: deps live in repo root — check root first
config.resolver.nodeModulesPaths = [
  rootNodeModules,
  path.resolve(projectRoot, 'node_modules'),
];

// 3. Never crawl or watch build output, VCS internals, or the transient files a
//    package manager writes into node_modules.  Metro's Windows fallback watcher
//    throws ENOENT and kills the dev server when a file it enumerated disappears
//    before it can attach a watch — which is exactly what `*_tmp_*` entries do.
//    A plain RegExp is used rather than metro-config's `exclusionList` helper:
//    Metro 0.83 no longer exports that path publicly.
const SEP = '[/\\\\]';
config.resolver.blockList = new RegExp(
  [
    `.*${SEP}node_modules${SEP}[^/\\\\]*_tmp_[^/\\\\]*(${SEP}.*)?$`,
    `.*${SEP}node_modules${SEP}\\.cache${SEP}.*`,
    `.*${SEP}\\.git${SEP}.*`,
    `.*${SEP}\\.wrangler${SEP}.*`,
    `.*${SEP}\\.turbo${SEP}.*`,
    `.*${SEP}apps${SEP}web${SEP}dist${SEP}.*`,
  ].join('|')
);

// 4. Web / SSR bundling still resolves from package dir — force hoisted native modules
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  'expo-speech': path.join(rootNodeModules, 'expo-speech'),
};

module.exports = config;
