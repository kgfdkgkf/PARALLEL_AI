import { Platform } from 'react-native';

/**
 * ПАРАЛЛЕЛЬ — визуальная система.
 * Глубокий космос, тонкие светящиеся поверхности, широкие разрядки в подписях.
 */

export const palette = {
  ink: '#05050C',
  ink2: '#08070F',
  ink3: '#0C0A18',
  void: '#030308',
  panel: 'rgba(255,255,255,0.045)',
  panelSolid: '#0E0C1A',
  panelRaised: 'rgba(24,20,44,0.86)',
  line: 'rgba(196,180,255,0.16)',
  lineSoft: 'rgba(255,255,255,0.075)',
  lineStrong: 'rgba(196,180,255,0.32)',
  text: '#F6F3FF',
  textSoft: '#DDD8F2',
  muted: '#B6B1D0',
  faint: '#8F8AAE',
  ghost: 'rgba(246,243,255,0.06)',
  violet: '#8B6CFF',
  violetHi: '#C3ACFF',
  violetDeep: '#4A2E9E',
  cyan: '#6FE3F2',
  cyanDeep: '#1C6E86',
  gold: '#FFC98B',
  goldDeep: '#7A4A16',
  rose: '#FF8FA8',
  green: '#7BE3B3',
  white: '#FFFFFF',
} as const;

export const font = {
  display: 'UnboundedLight',
  displayBook: 'Unbounded',
  displayBold: 'UnboundedSemi',
  body: 'Manrope',
  bodySemi: 'ManropeSemi',
  bodyBold: 'ManropeBold',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 26,
  xl: 34,
  pill: 999,
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 44,
} as const;

/** Акцентные схемы вселенных. */
export type AccentKey = 'violet' | 'cyan' | 'gold' | 'rose' | 'green';

export const accents: Record<
  AccentKey,
  { core: string; hi: string; glow: string; tint: [string, string]; text: string }
> = {
  violet: {
    core: '#8B6CFF',
    hi: '#C3ACFF',
    glow: 'rgba(139,108,255,0.55)',
    tint: ['rgba(89,52,196,0.62)', 'rgba(10,8,26,0.0)'],
    text: '#D9CDFF',
  },
  cyan: {
    core: '#4FD6EC',
    hi: '#B6F4FF',
    glow: 'rgba(79,214,236,0.5)',
    tint: ['rgba(20,110,140,0.6)', 'rgba(6,10,22,0.0)'],
    text: '#C4F5FF',
  },
  gold: {
    core: '#FFB35C',
    hi: '#FFE0B4',
    glow: 'rgba(255,179,92,0.45)',
    tint: ['rgba(140,80,20,0.6)', 'rgba(14,10,6,0.0)'],
    text: '#FFE3C2',
  },
  rose: {
    core: '#FF7F9C',
    hi: '#FFC5D2',
    glow: 'rgba(255,127,156,0.45)',
    tint: ['rgba(140,30,64,0.55)', 'rgba(14,6,12,0.0)'],
    text: '#FFD4DE',
  },
  green: {
    core: '#57DFA6',
    hi: '#BDF7DC',
    glow: 'rgba(87,223,166,0.42)',
    tint: ['rgba(20,110,80,0.55)', 'rgba(6,12,10,0.0)'],
    text: '#D2FBE8',
  },
};

export type CoverId = 'citadel' | 'crossroads' | 'islands' | 'neon' | 'memory' | 'nebula';

export const covers: Record<CoverId, number> = {
  citadel: require('../assets/covers/citadel.jpg'),
  crossroads: require('../assets/covers/crossroads.jpg'),
  islands: require('../assets/covers/islands.jpg'),
  neon: require('../assets/covers/neon.jpg'),
  memory: require('../assets/covers/memory.jpg'),
  nebula: require('../assets/covers/nebula.jpg'),
};

export const grain = require('../assets/covers/grain.png');

/**
 * RN-web задаёт картинке собственные размеры, если их нет в стиле,
 * поэтому фон-изображениям нужны явные 100% и позиционирование.
 */
export const fillImage = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  width: '100%' as const,
  height: '100%' as const,
};

export const text = {
  display: {
    fontFamily: font.display,
    color: palette.text,
    letterSpacing: -0.6,
  },
  overline: {
    fontFamily: font.bodySemi,
    color: palette.muted,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontFamily: font.bodySemi,
    color: palette.textSoft,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  body: {
    fontFamily: font.body,
    color: palette.muted,
    fontSize: 14.5,
    lineHeight: 23,
  },
  quote: {
    fontFamily: font.body,
    color: palette.textSoft,
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic' as const,
  },
  mono: {
    fontFamily: font.mono,
    color: palette.faint,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
};

export const shadow = {
  soft: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.45,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
    },
    android: { elevation: 8 },
    default: {},
  }) as object,
  glow: (color: string) =>
    Platform.select({
      ios: {
        shadowColor: color,
        shadowOpacity: 0.75,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 6 },
      default: {},
    }) as object,
};

export const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
