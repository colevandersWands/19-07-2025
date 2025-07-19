// crawl-dir.js
import { readdir, stat, readFile, writeFile } from 'fs/promises';
import path, { basename, extname, dirname, join, resolve } from 'path';

/**
 * Recursively crawls a directory and builds a virtual JSON representation.
 * @param {string} relativePath - The relative path to the root directory.
 * @returns {Promise<object>} - The virtual JSON directory tree.
 */
export async function crawlDirectory(relativePath) {
  const absRoot = resolve(relativePath);
  const baseName = basename(absRoot);

  async function crawl(dirPath, virtualPath = '/') {
    const stats = await stat(dirPath);

    if (stats.isDirectory()) {
      const entries = await readdir(dirPath);
      const children = (
        await Promise.all(
          entries.map(async (entry) => {
            const absChild = join(dirPath, entry);
            const relChild = join(virtualPath, entry).replace(/\\/g, '/');
            return crawl(absChild, relChild);
          }),
        )
      ).filter((entry) => entry !== undefined);
      return {
        name: basename(dirPath),
        type: 'directory',
        path: virtualPath,
        children,
      };
    } else {
      const ext = extname(dirPath);
      const base = basename(dirPath, ext);
      const dir = dirname(virtualPath).replace(/^\//, '');

      let content = '';
      try {
        content = await readFile(dirPath, 'utf8');
      } catch (err) {
        console.warn(`Could not read file: ${dirPath}`, err.message);
      }

      if (
        ext === '.png' ||
        ext === '.jpg' ||
        ext === '.svg' ||
        ext === '.mp4' ||
        base === '.DS_Store'
      ) {
        return undefined;
      }

      return {
        name: basename(dirPath),
        type: 'file',
        ext,
        base,
        dir,
        path: virtualPath,
        lang: ext,
        content,
      };
    }
  }

  const result = await crawl(absRoot);
  result.name = baseName;
  result.path = '/';
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const relPathIn = process.argv[2];
  if (!relPathIn) {
    console.error(
      'Usage: node crawl-dir.js <relative-path-input>',
    );
    process.exit(1);
  }

  const absPathIn = resolve(relPathIn);
  // const baseName = basename(absRoot);
  const virDir = await crawlDirectory(absPathIn);

  const absPathOut = resolve(join('public', relPathIn + '.json'));
  await writeFile(absPathOut, JSON.stringify(virDir, null, ''), 'utf-8');
}
