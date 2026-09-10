import { describe, expect, it } from 'vitest';
import { PROD_MAIN_SRC, PROD_STYLES_HREF } from '../src/constants.js';
import { injectHeadAssets } from '../src/template.js';

describe('injectHeadAssets', () => {
  it('injects link + script before </head>', () => {
    const out = injectHeadAssets('<html><head></head></html>', {
      stylesHref: `{{ 'assets/styles.css' | asset_url }}`,
      mainSrc: `{{ 'assets/main.js' | asset_url }}`
    });
    expect(out).toContain(`<link rel="stylesheet" href="{{ 'assets/styles.css' | asset_url }}">`);
    expect(out).toContain(`<script type="module" src="{{ 'assets/main.js' | asset_url }}"></script>`);
    expect(out.indexOf('<link')).toBeLessThan(out.indexOf('</head>'));
  });

  it('omits script when mainSrc is null', () => {
    const out = injectHeadAssets('<head></head>', {
      stylesHref: `{{ 'assets/styles.css' | asset_url }}`,
      mainSrc: null
    });
    expect(out).toContain(`<link rel="stylesheet" href="{{ 'assets/styles.css' | asset_url }}">`);
    expect(out).not.toContain('<script');
  });

  it('appends tags when no </head> exists', () => {
    const out = injectHeadAssets('<html></html>', {
      stylesHref: 's.css',
      mainSrc: null
    });
    expect(out.endsWith('<link rel="stylesheet" href="s.css">')).toBe(true);
  });

  it('emits no bare relative asset refs for prod constants', () => {
    const out = injectHeadAssets('<head></head>', { stylesHref: PROD_STYLES_HREF, mainSrc: PROD_MAIN_SRC });
    expect(out).not.toMatch(/href="assets\//);
    expect(out).not.toMatch(/src="assets\//);
    expect(out).toContain('| asset_url');
  });
});
