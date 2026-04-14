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
import { supabase, supabaseConfigured } from '../lib/supabase';
import { colors, fonts } from '../theme';
import { initialsFromNombre } from '../utils/booking';

const CARD_BGS = ['#1a1a1a', '#141414', '#161616', '#131313'];
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
    const t = setTimeout(() => {
      setLoading(false);
      setFetchError('Tiempo de espera agotado.');
    }, 8000);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('barberos')
          .select('id, slug, especialidades, total_cortes, nombre_barberia, profiles(nombre)');
        clearTimeout(t);
        if (error) {
          setFetchError(error.message);
        } else {
          setBarbers(data ?? []);
        }
      } catch (e) {
        clearTimeout(t);
        setFetchError(String(e));
      } finally {
        setLoading(false);
      }
    })();

    return () => clearTimeout(t);
  }, []);

  function renderItem({ item, index }) {
    const nombrePersona = item.profiles?.nombre?.trim() || item.slug.replace(/-/g, ' ');
    const nombre = item.nombre_barberia?.trim() || nombrePersona;
    const nombreDisplay = nombre.toUpperCase();
    const specialty =
      item.especialidades?.length > 0 ? item.especialidades.join(' · ') : 'Fade · Diseños · Barba';
    const bg = CARD_BGS[index % CARD_BGS.length];
    const ini = initialsFromNombre(nombrePersona, item.slug);

    return (
      <TouchableOpacity
        style={[styles.card, { width: colW }]}
        activeOpacity={0.92}
        onPress={() => navigation.navigate('BarberProfile', { slug: item.slug })}
      >
        <View style={[styles.cardVisual, { backgroundColor: bg }]}>
          <Text style={styles.watermark}>{ini}</Text>
          {item.total_cortes > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.total_cortes.toLocaleString()} cortes</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {nombreDisplay}
          </Text>
          <Text style={styles.cardSub} numberOfLines={2}>
            {specialty}
          </Text>
          <View style={styles.cardBtn}>
            <Text style={styles.cardBtnText}>VER PERFIL</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.back}>
            <Text style={styles.backText}>← INICIO</Text>
          </TouchableOpacity>
          <Text style={styles.kicker}>Barber.it · Bogotá</Text>
          <Text style={styles.title}>CATÁLOGO DE BARBEROS</Text>
          <Text style={styles.desc}>
            Elige tu barbero y entra a su perfil para ver servicios y reservar turno.
          </Text>
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.acid} />
            <Text style={styles.muted}>Cargando barberos…</Text>
          </View>
        )}

        {!loading && fetchError && (
          <View style={styles.center}>
            <Text style={styles.err}>Error: {fetchError}</Text>
          </View>
        )}

        {!loading && !fetchError && barbers.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.muted}>Aún no hay barberos en la plataforma.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registro')} style={styles.linkBtn}>
              <Text style={styles.linkText}>Registrate como barbero</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !fetchError && barbers.length > 0 && (
          <FlatList
            data={barbers}
            keyExtractor={(b) => b.id}
            numColumns={2}
            columnWrapperStyle={{ gap: pad, paddingHorizontal: pad, marginBottom: pad }}
            contentContainerStyle={{ paddingBottom: 40 }}
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
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  back: { marginBottom: 16 },
  backText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.grayMid,
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.acid,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.white,
    letterSpacing: 1,
    lineHeight: 36,
    marginBottom: 10,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.grayLight,
    maxWidth: 400,
    lineHeight: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  muted: { fontFamily: fonts.body, color: colors.grayMid, textAlign: 'center' },
  err: { fontFamily: fonts.body, color: colors.danger, textAlign: 'center' },
  card: {
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  cardVisual: {
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  watermark: {
    fontFamily: fonts.display,
    fontSize: 72,
    color: 'rgba(255,255,255,0.04)',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.acid,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.black,
  },
  cardBody: { padding: 12 },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.white,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.grayLight,
    marginBottom: 12,
    lineHeight: 14,
  },
  cardBtn: {
    borderWidth: 1,
    borderColor: colors.acid,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.acid,
  },
  linkBtn: { marginTop: 8 },
  linkText: { fontFamily: fonts.bodyBold, color: colors.acid, fontSize: 14 },
});
