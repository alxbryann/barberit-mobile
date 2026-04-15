import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { colors, fonts, radii, shadows } from '../theme';
import { initialsFromNombre } from '../utils/booking';

const CARD_ACCENTS = [colors.acid, '#00CFFF', '#FF6B35', '#A855F7'];
const { width } = Dimensions.get('window');
const pad = 12;
const colW = (width - pad * 3) / 2;

export default function BarberosScreen({ navigation }) {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      setFetchError('Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setFetchError('Tiempo de espera agotado.');
      }
    }, 8000);

    const selectCols =
      'id, slug, especialidades, total_cortes, nombre_barberia, profiles(nombre)';

    async function fetchCatalog() {
      try {
        const { data, error } = await supabase.from('barberos').select(selectCols);
        clearTimeout(t);
        if (cancelled) return;

        if (error) {
          setFetchError(error.message);
          setBarbers([]);
          return;
        }

        let list = data ?? [];
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (uid) {
          const { data: mine, error: mineErr } = await supabase
            .from('barberos')
            .select(selectCols)
            .eq('id', uid)
            .maybeSingle();
          if (!cancelled && !mineErr && mine && !list.some((b) => b.id === mine.id)) {
            list = [mine, ...list];
          }
        }

        setFetchError(null);
        setBarbers(list);
      } catch (e) {
        clearTimeout(t);
        if (!cancelled) {
          setFetchError(String(e));
          setBarbers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCatalog();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') return;
      fetchCatalog();
    });

    return () => {
      cancelled = true;
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  function renderItem({ item, index }) {
    const nombrePersona = item.profiles?.nombre?.trim() || item.slug.replace(/-/g, ' ');
    const nombre = item.nombre_barberia?.trim() || nombrePersona;
    const nombreDisplay = nombre.toUpperCase();
    const specialty = item.especialidades?.length > 0 ? item.especialidades.join(' · ') : 'Fade · Diseños · Barba';
    const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
    const ini = initialsFromNombre(nombrePersona, item.slug);

    return (
      <TouchableOpacity
        style={[styles.card, { width: colW }]}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('BarberProfile', { slug: item.slug })}
      >
        {/* Visual area */}
        <View style={styles.cardVisual}>
          <LinearGradient
            colors={['#111111', '#0d0d0d']}
            style={StyleSheet.absoluteFill}
          />
          {/* Accent top bar */}
          <View style={[styles.cardAccentBar, { backgroundColor: accent }]} />
          {/* Big initials */}
          <Text style={[styles.watermark, { color: accent }]}>{ini}</Text>
          {/* Cortes badge */}
          {item.total_cortes > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.total_cortes.toLocaleString()}</Text>
              <Text style={styles.badgeSub}>cortes</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{nombreDisplay}</Text>
          <Text style={styles.cardSub} numberOfLines={2}>{specialty}</Text>
          <View style={[styles.cardBtn, { borderColor: accent }]}>
            <Text style={[styles.cardBtnText, { color: accent }]}>VER PERFIL →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <View style={styles.kickerRow}>
              <View style={styles.kickerDot} />
              <Text style={styles.kicker}>Barber.it · Bogotá</Text>
            </View>
            <Text style={styles.title}>CATÁLOGO{'\n'}DE BARBEROS</Text>
          </View>
          <Text style={styles.desc}>
            Elige tu barbero y entra a su perfil para ver servicios y reservar turno.
          </Text>
          {/* Count pill */}
          {barbers.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{barbers.length} barberos disponibles</Text>
            </View>
          )}
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.acid} />
            <Text style={styles.muted}>Cargando barberos…</Text>
          </View>
        )}

        {!loading && fetchError && (
          <View style={styles.center}>
            <View style={styles.errCard}>
              <Text style={styles.errIcon}>⚠</Text>
              <Text style={styles.err}>{fetchError}</Text>
            </View>
          </View>
        )}

        {!loading && !fetchError && barbers.length === 0 && (
          <View style={styles.center}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✦</Text>
              <Text style={styles.emptyTitle}>AÚN NO HAY BARBEROS</Text>
              <Text style={styles.muted}>Sé el primero en unirte a la plataforma.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Registro')} style={styles.linkBtn}>
                <Text style={styles.linkText}>Registrate como barbero →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!loading && !fetchError && barbers.length > 0 && (
          <FlatList
            data={barbers}
            keyExtractor={(b) => b.id}
            numColumns={2}
            columnWrapperStyle={{ gap: pad, paddingHorizontal: pad, marginBottom: pad }}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  safe: { flex: 1 },

  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { marginBottom: 8, paddingTop: 4 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  kickerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.acid },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 3, color: colors.acid },
  title: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.white,
    letterSpacing: 1,
    // lineHeight debe ser ≥ fontSize; si no, RN recorta ascensores (Bebas Neue)
    lineHeight: 44,
  },
  desc: { fontFamily: fonts.body, fontSize: 14, color: colors.grayLight, lineHeight: 20, marginBottom: 12 },
  countPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.dark2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  countText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.grayLight, letterSpacing: 1 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  muted: { fontFamily: fonts.body, color: colors.grayMid, textAlign: 'center', fontSize: 14 },

  errCard: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    borderRadius: radii.md,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    maxWidth: 320,
  },
  errIcon: { fontSize: 24, color: colors.danger },
  err: { fontFamily: fonts.body, color: colors.danger, textAlign: 'center', fontSize: 14 },

  emptyCard: {
    backgroundColor: colors.dark2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    maxWidth: 320,
  },
  emptyIcon: { fontSize: 28, color: colors.acid, marginBottom: 4 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.white, letterSpacing: 1 },
  linkBtn: { marginTop: 8 },
  linkText: { fontFamily: fonts.bodyBold, color: colors.acid, fontSize: 13, letterSpacing: 1 },

  // Card
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardVisual: {
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  watermark: {
    fontFamily: fonts.display,
    fontSize: 80,
    opacity: 0.08,
  },
  badge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  badgeText: { fontFamily: fonts.display, fontSize: 14, color: colors.white },
  badgeSub: { fontFamily: fonts.body, fontSize: 9, color: colors.grayLight, letterSpacing: 1 },
  cardBody: { padding: 12 },
  cardTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.white, marginBottom: 6, letterSpacing: 0.5 },
  cardSub: { fontFamily: fonts.body, fontSize: 11, color: colors.grayLight, marginBottom: 12, lineHeight: 14 },
  cardBtn: {
    borderWidth: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: radii.xs,
  },
  cardBtnText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 2 },
});
