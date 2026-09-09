import { describe, expect, it } from 'vitest';
import { injectHeadAssets } from '../src/template.js';

describe('injectHeadAssets', () => {
  it('injects link + script before </head>', () => {
    const out = injectHeadAssets('<html><head></head></html>', {
      stylesHref: 'assets/styles.css',
      mainSrc: 'assets/main.js'
    });
    expect(out).toContain('<link rel="stylesheet" href="assets/styles.css">');
    expect(out).toContain('<script type="module" src="assets/main.js"></script>');
    expect(out.indexOf('<link')).toBeLessThan(out.indexOf('</head>'));
  });

  it('omits script when mainSrc is null', () => {
    const out = injectHeadAssets('<head></head>', {
      stylesHref: 'assets/styles.css',
      mainSrc: null
    });
    expect(out).toContain('<link rel="stylesheet" href="assets/styles.css">');
    expect(out).not.toContain('<script');
  });

  it('appends tags when no </head> exists', () => {
    const out = injectHeadAssets('<html></html>', {
      stylesHref: 's.css',
      mainSrc: null
    });
    expect(out.endsWith('<link rel="stylesheet" href="s.css">')).toBe(true);
  });
});
