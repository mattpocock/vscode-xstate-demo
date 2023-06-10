const path = require('path');
const { spawnSync } = require('child_process');

const pkgJson = require(path.join(
  __dirname,
  '..',
  'apps',
  'extension',
  'client',
  'package.json',
));

const tag = `${pkgJson.name}@${pkgJson.version}`;

const { status, stdout } = spawnSync('git', [
  'ls-remote',
  'https://github.com/statelyai/xstate-tools.git',
  tag,
]);

if (status !== 0) {
  process.exit(status);
}

const exists = stdout.toString().trim() !== '';

if (!exists) {
  console.log(`\nNew tag: ${tag}`);
}
