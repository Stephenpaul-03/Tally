const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('../../scripts/test-support/load-ts.cjs');
const load = loader();
const { expressiveSurfaces } = load('theme/expressivePalette.ts');
const { sageTheme } = load('theme/sage.ts');
const luminance = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
test('every accent tints Expressive surfaces while retaining readable text and tonal depth', () => {
  for (const seed of ['#006B5B','#3730A3','#9D5F6A','#A67C3A','#0F5C78','#6B4E9B','#000000','#FFFFFF']) {
    for (const dark of [false,true]) {
      const palette = expressiveSurfaces(seed,dark);
      const levels = ['background','surface','surfaceVariant'].map(key=>luminance(palette[key]));
      assert.ok(dark ? levels[0]<levels[1]&&levels[1]<levels[2] : levels[1]>levels[0]&&levels[0]>levels[2]);
      for(const key of ['background','surface','surfaceVariant']) assert.ok(contrast(palette[key],palette.onSurface)>=4.5);
    }
  }
  assert.notEqual(expressiveSurfaces('#006B5B',false).surface,expressiveSurfaces('#3730A3',false).surface);
  assert.equal(expressiveSurfaces('#86D6C1',true,true).background,'#000000');
});
test('the selected accent and its foreground/container pairs remain intact throughout Expressive', () => {
  const colors = { primary:'#3730A3',onPrimary:'#FFFFFF',primaryContainer:'#E0DFFF',onPrimaryContainer:'#0D0B4F',secondaryContainer:'#E8E7F8',onSecondaryContainer:'#1A174B',elevation:{} };
  const theme = sageTheme({ dark:false,colors,fonts:{ bodyLarge:{fontFamily:'Switzer-Regular'} },semantic:{} });
  for(const key of ['primary','onPrimary','primaryContainer','onPrimaryContainer','secondaryContainer','onSecondaryContainer']) assert.equal(theme.colors[key],colors[key]);
  assert.equal(theme.expressive,true);
  assert.equal(theme.fonts.bodyLarge.fontFamily,'Figtree-400');
});

test('custom categories keep their chosen color while maintaining readable tile labels', () => {
  const { categoryTone } = load('theme/sage.ts');
  assert.notEqual(categoryTone('A custom category',false,'#E53935')[0],categoryTone('A custom category',false,'#1565C0')[0]);
  for(const seed of ['#FFFFFF','#000000','#FFFF00','#FF0000','#0000FF']) for(const dark of [false,true]) {
    const [background,foreground] = categoryTone('A custom category',dark,seed);
    assert.ok(contrast(background,foreground)>=4.5);
  }
});

test('the twelve accents include complete, readable Terracotta and Citrus themes in both modes', () => {
  const loadTheme = loader({ './typography': { paperFonts:{} }, 'react-native': { Appearance:{getColorScheme:()=> 'light'} }, 'react-native-paper':{ MD3LightTheme:{colors:{}}, MD3DarkTheme:{colors:{}} } });
  const { THEME_PRESETS, buildPaperTheme } = loadTheme('theme/buildPaperTheme.ts');
  assert.equal(Object.keys(THEME_PRESETS).length,12);
  assert.equal(new Set(Object.values(THEME_PRESETS).map(preset=>preset.primarySeed)).size,12);
  for(const themeId of ['terracotta','citrus']) for(const mode of ['light','dark']) {
    const { colors } = buildPaperTheme({mode,themeId});
    assert.ok(contrast(colors.primary,colors.onPrimary)>=4.5);
    assert.ok(contrast(colors.primaryContainer,colors.onPrimaryContainer)>=4.5);
    assert.notEqual(colors.primary,buildPaperTheme({mode,themeId:'sage'}).colors.primary);
  }
});
