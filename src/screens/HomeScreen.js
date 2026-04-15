import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radii, shadows } from '../theme';

/** Pantalla de bienvenida (sin tab bar): primer arranque o usuario sin sesión. */
export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0d0f08', '#080808']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>

          <View style={styles.top}>
            <Text style={styles.logo}>
              BARBER<Text style={styles.accent}>.IT</Text>
            </Text>
          </View>

          <View style={styles.middle}>
            <Text style={styles.phrase}>TU CORTE,{'\n'}TU IDENTIDAD.</Text>
            <Text style={styles.sub}>Reserva con tu barbero en segundos.</Text>
          </View>

          <View style={styles.bottom}>
            <TouchableOpacity
              style={styles.primaryWrap}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[colors.acid, colors.acidDim]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primary}
              >
                <Text style={styles.primaryText}>INICIAR SESIÓN</Text>
                <Text style={styles.primaryArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondary}
              onPress={() => navigation.navigate('Registro')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryText}>CREAR CUENTA</Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  safe: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },

  top: {
    paddingTop: 20,
  },
  logo: {
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: 3,
    color: colors.white,
  },
  accent: { color: colors.acid },

  middle: {
    flex: 1,
    justifyContent: 'center',
  },
  phrase: {
    fontFamily: fonts.display,
    fontSize: 48,
    lineHeight: 56,
    color: colors.white,
    letterSpacing: 1,
    marginBottom: 16,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.grayLight,
    lineHeight: 22,
  },

  bottom: { gap: 12 },
  primaryWrap: {
    borderRadius: radii.sm,
    overflow: 'hidden',
    ...shadows.acid,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  primaryText: {
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 3,
    color: colors.black,
  },
  primaryArrow: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.black,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.sm,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryText: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.white,
  },
});
