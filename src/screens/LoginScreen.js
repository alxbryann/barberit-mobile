import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { colors, fonts, radii, shadows } from '../theme';
import { RESET_MAIN_AGENDA, resetToBarberMainTabs } from '../navigation/resetMainTabs';

export default function LoginScreen({ navigation, route }) {
  const redirect = route.params?.redirect;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  async function afterAuthSuccess(userId) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();

    if (profile?.role === 'barbero') {
      const { data: barbero } = await supabase
        .from('barberos')
        .select('slug')
        .eq('id', userId)
        .maybeSingle();
      if (!barbero?.slug) {
        setError('Tu cuenta no tiene perfil de barbero. Confirma el correo o revisa en Supabase la fila en barberos.');
        return false;
      }
      navigation.reset(resetToBarberMainTabs(barbero.slug));
      return true;
    }

    if (redirect?.screen) {
      navigation.reset({ index: 0, routes: [{ name: redirect.screen, params: redirect.params ?? {} }] });
    } else {
      navigation.reset(RESET_MAIN_AGENDA);
    }
    return true;
  }

  async function handleSubmit() {
    if (!supabaseConfigured) { setError('Configura Supabase en las variables de entorno.'); return; }
    setError('');
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : signInError.message);
      setLoading(false);
      return;
    }
    await afterAuthSuccess(data.user.id);
    setLoading(false);
  }

  async function handleGoogle() {
    if (!supabaseConfigured) { setError('Configura Supabase en las variables de entorno.'); return; }
    setError('');
    setLoading(true);
    try {
      const { cancelled, session } = await signInWithGoogle();
      if (cancelled) { setLoading(false); return; }
      if (!session?.user) { setError('No se pudo obtener la sesión.'); setLoading(false); return; }
      const { data: existing } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
      if (!existing) {
        const nombre = session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? '';
        navigation.reset({ index: 0, routes: [{ name: 'CompletarPerfil', params: { suggestedNombre: nombre, redirect: redirect ?? null } }] });
        setLoading(false);
        return;
      }
      await afterAuthSuccess(session.user.id);
    } catch (e) {
      setError(String(e.message ?? e));
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Welcome')}
                style={styles.backBtn}
              >
                <Text style={styles.backText}>← INICIO</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
                <Text style={styles.logo}>BARBER<Text style={styles.logoA}>.IT</Text></Text>
              </TouchableOpacity>
            </View>

            {/* Hero text */}
            <View style={styles.heroBlock}>
              <Text style={styles.title}>BIENVENIDO</Text>
              <Text style={styles.sub}>
                ¿No tienes cuenta?{' '}
                <Text style={styles.link} onPress={() => navigation.navigate('Registro', { redirect })}>
                  Regístrate
                </Text>
              </Text>
            </View>

            {/* Card form */}
            <View style={styles.card}>
              <Field
                label="CORREO"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                focused={focusedField === 'email'}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
              />
              <Field
                label="CONTRASEÑA"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                focused={focusedField === 'pass'}
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
              />

              {error ? (
                <View style={styles.errBox}>
                  <Text style={styles.errIcon}>⚠</Text>
                  <Text style={styles.err}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primary, loading && styles.primaryOff]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={loading ? [colors.gray, colors.gray] : [colors.acid, colors.acidDim]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGrad}
                >
                  <Text style={styles.primaryTxt}>{loading ? 'ENTRANDO...' : 'ENTRAR →'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divTxt}>O CONTINÚA CON</Text>
              <View style={styles.divLine} />
            </View>

            {/* Google */}
            <TouchableOpacity style={styles.google} onPress={handleGoogle} disabled={loading} activeOpacity={0.8}>
              <View style={styles.googleInner}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleTxt}>CONTINUAR CON GOOGLE</Text>
              </View>
            </TouchableOpacity>

            {/* Barbero hint */}
            <View style={styles.hintRow}>
              <Text style={styles.hint}>¿Eres barbero? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
                <Text style={styles.link}>Únete →</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({ label, value, onChangeText, keyboardType, secureTextEntry, focused, onFocus, onBlur, autoCapitalize }) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.lbl}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[fieldStyles.input, focused && fieldStyles.inputFocused]}
        placeholderTextColor={colors.grayMid}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'none'}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  lbl: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.grayLight,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.dark3,
    color: colors.white,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.sm,
  },
  inputFocused: {
    borderColor: colors.acid,
    backgroundColor: '#131500',
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.grayMid,
  },
  logo: { fontFamily: fonts.display, fontSize: 22, letterSpacing: 2, color: colors.white },
  logoA: { color: colors.acid },

  heroBlock: { marginBottom: 28 },
  title: {
    fontFamily: fonts.display,
    fontSize: 48,
    color: colors.white,
    marginBottom: 8,
    letterSpacing: 1,
    lineHeight: 46,
  },
  sub: { fontFamily: fonts.body, fontSize: 15, color: colors.grayLight },
  link: { color: colors.acid, fontFamily: fonts.bodyBold },

  card: {
    backgroundColor: colors.dark2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: 20,
    marginBottom: 24,
    ...shadows.sm,
  },

  errBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    backgroundColor: colors.dangerSoft,
    padding: 12,
    borderRadius: radii.sm,
    marginBottom: 14,
  },
  errIcon: { fontSize: 14, color: colors.danger },
  err: { fontFamily: fonts.body, color: colors.danger, fontSize: 13, flex: 1, lineHeight: 18 },

  primary: {
    borderRadius: radii.sm,
    overflow: 'hidden',
    marginTop: 4,
    ...shadows.acid,
  },
  primaryOff: { opacity: 0.55 },
  primaryGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryTxt: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.black,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  divLine: { flex: 1, height: 1, backgroundColor: colors.gray },
  divTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.grayMid,
    letterSpacing: 2,
  },

  google: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.dark2,
    marginBottom: 28,
    ...shadows.sm,
  },
  googleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  googleIcon: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0,
  },
  googleTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 2,
    color: colors.white,
  },

  hintRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.grayMid },
});
