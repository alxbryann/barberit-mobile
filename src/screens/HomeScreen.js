import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../theme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.nav}>
            <Text style={styles.logo}>
              BARBER<Text style={styles.logoAccent}>.IT</Text>
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.navBtn}>
              <Text style={styles.navBtnText}>ENTRAR</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroWrap}>
            <LinearGradient
              colors={['#0a0a0a', '#111111', '#181818', '#0a0a0a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.acidBlock} />
            <View style={styles.heroInner}>
              <Text style={styles.kicker}>BOGOTÁ · CALLE</Text>
              <Text style={styles.heroTitle}>CORTES</Text>
              <Text style={styles.heroTitleAccent}>CON CALLE</Text>
              <Text style={styles.sub}>
                La barbería más dura de la ciudad. Estilo, identidad y turno en segundos.
              </Text>
              <TouchableOpacity
                style={styles.cta}
                onPress={() => navigation.navigate('Barberos')}
                activeOpacity={0.9}
              >
                <Text style={styles.ctaText}>VER BARBEROS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondary}
                onPress={() => navigation.navigate('Registro')}
              >
                <Text style={styles.secondaryText}>CREAR CUENTA</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionKicker}>CÓMO FUNCIONA</Text>
            <Text style={styles.sectionTitle}>TRES PASOS</Text>
            {[
              { n: '01', t: 'ELIGE BARBERO', d: 'Explora el catálogo y entra al perfil que te late.' },
              { n: '02', t: 'SERVICIO Y HORA', d: 'Selecciona servicio, día y franja en Bogotá.' },
              { n: '03', t: 'CONFIRMA', d: 'Inicia sesión y listo: tu cita queda registrada.' },
            ].map((row) => (
              <View key={row.n} style={styles.stepRow}>
                <Text style={styles.stepNum}>{row.n}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{row.t}</Text>
                  <Text style={styles.stepDesc}>{row.d}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              BARBER<Text style={styles.logoAccent}>.IT</Text>
            </Text>
            <Text style={styles.footerMeta}>© {new Date().getFullYear()} · Bogotá</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  safe: { flex: 1 },
  scroll: { paddingBottom: 48 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logo: { fontFamily: fonts.display, fontSize: 22, letterSpacing: 2, color: colors.white },
  logoAccent: { color: colors.acid },
  navBtn: {
    borderWidth: 1,
    borderColor: colors.gray,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  navBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.acid,
  },
  heroWrap: {
    minHeight: width * 1.05,
    marginHorizontal: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  acidBlock: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 0.42,
    height: '100%',
    backgroundColor: colors.acid,
    opacity: 0.92,
  },
  heroInner: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    maxWidth: width * 0.58,
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 4,
    color: colors.grayLight,
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 52,
    lineHeight: 48,
    color: colors.white,
    letterSpacing: 1,
  },
  heroTitleAccent: {
    fontFamily: fonts.display,
    fontSize: 52,
    lineHeight: 48,
    color: colors.acid,
    letterSpacing: 1,
    marginBottom: 16,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.grayLight,
    lineHeight: 20,
    marginBottom: 24,
  },
  cta: {
    backgroundColor: colors.acid,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaText: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.black,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.gray,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.white,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  sectionKicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 4,
    color: colors.acid,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.white,
    marginBottom: 28,
    letterSpacing: 1,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
    paddingBottom: 20,
  },
  stepNum: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.acid,
    opacity: 0.8,
    width: 28,
  },
  stepTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.white,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  stepDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.grayLight,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  footerBrand: {
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 2,
    color: colors.white,
    marginBottom: 8,
  },
  footerMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.grayMid,
    letterSpacing: 1,
  },
});
