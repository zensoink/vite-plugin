import fs from 'node:fs';
import path from 'node:path';
import {
    ASSETS_DIR,
    DOC_FILES,
    MAIN_SRC,
    MANIFEST_FILENAME,
    OUT_DIR,
    PROD_MAIN_SRC,
    PROD_STYLES_HREF,
    ROOT,
    STYLES_SRC,
    TEMPLATE_FILENAME,
    TEMPLATE_SRC
} from './constants.js';
import { buildManifestJson, hasScriptCapability } from './manifest.js';
import { injectHeadAssets } from './template.js';

/**
 * Contributes the build defaults via Vite's `config()` hook.
 * User `build` values in `vite.config.ts` merge over these automatically
 * (Vite `mergeConfig` semantics: user config wins).
 *
 * @param outDir - Build output directory, also the zip input.
 * @returns The Vite plugin object. Defaults: `outDir` with `emptyOutDir`,
 * `styles` + conditional `main` rollup inputs, `assets/[name]` outputs.
 */
export function zensoConfigPlugin(outDir: string = OUT_DIR) {
    return {
        name: 'zenso-config',
        config() {
            return {
                build: {
                    outDir,
                    emptyOutDir: true,
                    rollupOptions: {
                        input: {
                            styles: STYLES_SRC,
                            ...(hasScriptCapability() ? { main: MAIN_SRC } : {})
                        },
                        output: {
                            entryFileNames: `${ASSETS_DIR}/[name].js`,
                            assetFileNames: `${ASSETS_DIR}/[name].[ext]`
                        }
                    }
                }
            };
        }
    };
}

/**
 * Emits the backend-facing files into the bundle: the merged `manifest.json`,
 * the production `index.liquid` (prod asset references injected), and the
 * root doc files (`README.md`, `LICENSE`) when present — a missing doc logs
 * a build warning and is skipped.
 * The `script` capability is captured once at plugin creation.
 *
 * @returns The Vite plugin object.
 */
export function zensoBuildPlugin() {
    const allowJavaScript = hasScriptCapability();
    return {
        name: 'zenso-plugin-build',
        generateBundle(this: any) {
            this.emitFile({
                type: 'asset',
                fileName: MANIFEST_FILENAME,
                source: JSON.stringify(buildManifestJson(), null, 2)
            });
            this.emitFile({
                type: 'asset',
                fileName: TEMPLATE_FILENAME,
                source: injectHeadAssets(
                    fs.readFileSync(TEMPLATE_SRC, 'utf-8'),
                    { stylesHref: PROD_STYLES_HREF, mainSrc: allowJavaScript ? PROD_MAIN_SRC : null }
                )
            });
            for (const file of DOC_FILES) {
                const src = path.join(ROOT, file);
                if (fs.existsSync(src)) {
                    this.emitFile({ type: 'asset', fileName: file, source: fs.readFileSync(src) });
                } else {
                    this.warn(`[zenso]: ${file} not found at project root, skipping`);
                }
            }
        }
    };
}
