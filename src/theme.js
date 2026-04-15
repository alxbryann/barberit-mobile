/** Paleta alineada con web/src/app/globals.css — extendida para app */
export const colors = {
  acid: '#CDFF00',
  acidDim: '#a8cc00',
  acidSoft: 'rgba(205,255,0,0.12)',
  acidGlow: 'rgba(205,255,0,0.06)',
  black: '#080808',
  dark: '#0f0f0f',
  dark2: '#161616',
  dark3: '#1c1c1c',
  gray: '#222222',
  grayMid: '#555555',
  grayLight: '#999999',
  white: '#f0f0f0',
  danger: '#ff6b6b',
  dangerSoft: 'rgba(255,107,107,0.1)',
  overlay: 'rgba(8,8,8,0.92)',
  card: '#111111',
  cardBorder: '#242424',
};

/** Radios para feel de app nativa */
export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

/** Sombras para profundidad */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  acid: {
    shadowColor: '#CDFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};

/** Nombres de familia tras useFonts en App.js */
export const fonts = {
  display: 'BebasNeue_400Regular',
  body: 'BarlowCondensed_400Regular',
  bodySemi: 'BarlowCondensed_600SemiBold',
  bodyBold: 'BarlowCondensed_700Bold',
};
