export const DEFAULT_SERVICES = [
  { id: 'corte', label: 'CORTE CLÁSICO', price: 40000, duration: '45 min', icon: '✦' },
  { id: 'barba', label: 'BARBA', price: 30000, duration: '30 min', icon: '◈' },
  { id: 'combo', label: 'COMBO FULL', price: 65000, duration: '75 min', icon: '◉' },
];

export const TIMES_MORNING = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
export const TIMES_AFTERNOON = [
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
];
export const TIMES_EVENING = ['17:00', '17:30', '18:00', '18:30', '19:00'];

export function getTodayBogota() {
  const now = new Date();
  const bogota = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  bogota.setHours(12, 0, 0, 0);
  return bogota;
}

export function getDays() {
  const days = [];
  const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const monthNames = [
    'ENE',
    'FEB',
    'MAR',
    'ABR',
    'MAY',
    'JUN',
    'JUL',
    'AGO',
    'SEP',
    'OCT',
    'NOV',
    'DIC',
  ];
  const today = getTodayBogota();
  for (let i = 0; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: String(d.getDate()).padStart(2, '0'),
      day: dayNames[d.getDay()],
      month: monthNames[d.getMonth()],
      fullDate: d,
    });
  }
  return days;
}

export function heroNameLines(raw) {
  const s = raw.trim().replace(/-/g, ' ');
  if (!s) return { primary: '', secondary: 'BARBER' };
  const upper = s.toUpperCase();
  const parts = upper.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { primary: parts[0], secondary: parts.slice(1).join(' ') };
  }
  const one = parts[0];
  if (one.length > 6 && one.endsWith('BARBER')) {
    return { primary: one.slice(0, -6), secondary: 'BARBER' };
  }
  return { primary: one, secondary: 'BARBER' };
}

export function fmtPrice(price) {
  return price.toLocaleString('es-CO');
}

export function initialsFromNombre(nombre, slug) {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return slug.slice(0, 2).toUpperCase();
}
