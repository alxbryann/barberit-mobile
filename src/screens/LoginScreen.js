import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { colors, fonts } from '../theme';

export default function LoginScreen({ navigation, route }) {
  const redirect = route.params?.redirect;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function afterAuthSuccess(userId) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();

    if (profile?.role === 'barbero') {
      const { data: barbero } = await supabase
        .from('barberos')
        .select('slug')
        .eq('id', userId)
        .maybeSingle();
      if (!barbero?.slug) {
        setError(
          'Tu cuenta no tiene perfil de barbero. Confirma el correo o revisa en Supabase la fila en barberos.'
        );
        return false;
      }
      navigation.reset({ index: 0, routes: [{ name: 'Panel', params: { slug: barbero.slug } }] });
      return true;
    }

    if (redirect?.screen) {
      navigation.reset({
        index: 0,
        routes: [{ name: redirect.screen, params: redirect.params ?? {} }],
      });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
    return true;
  }

  async function handleSubmit() {
    if (!supabaseConfigured) {
      setError('Configura Supabase en las variables de entorno.');
      return;
    }
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
    if (!supabaseConfigured) {
      setError('Configura Supabase en las variables de entorno.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { cancelled } = await signInWithGoogle();
      if (cancelled) {
        setLoading(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('No se pudo obtener la sesión.');
        setLoading(false);
        return;
      }
      const { data: existing } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!existing) {
        const nombre =
          session.user.user_metadata?.full_name ??
          session.user.user_metadata?.name ??
          '';
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'CompletarPerfil',
              params: {
                suggestedNombre: nombre,
                redirect: redirect ?? null,
              },
            },
          ],
        });
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.logo}>
                BARBER<Text style={styles.logoA}>.IT</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.title}>BIENVENIDO</Text>
            <Text style={styles.sub}>
              ¿No tienes cuenta?{' '}
              <Text style={styles.link} onPress={() => navigation.navigate('Registro', { redirect })}>
                Regístrate
              </Text>
            </Text>

            <Field label="CORREO" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Field
              label="CONTRASEÑA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? (
              <View style={styles.errBox}>
                <Text style={styles.err}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primary, loading && styles.primaryOff]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.primaryTxt}>{loading ? 'ENTRANDO...' : 'ENTRAR →'}</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divTxt}>O</Text>
              <View style={styles.divLine} />
            </View>

            <TouchableOpacity
              style={styles.google}
              onPress={handleGoogle}
              disabled={loading}
            >
              <Text style={styles.googleTxt}>CONTINUAR CON GOOGLE</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              ¿Eres barbero?{' '}
              <Text style={styles.link} onPress={() => navigation.navigate('Registro')}>
                Únete →
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({ label, value, onChangeText, keyboardType, secureTextEntry }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.lbl}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor={colors.grayMid}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  safe: { flex: 1 },
  scroll: { padding: 24, paddingTop: 16 },
  logo: {
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: 2,
    color: colors.white,
    marginBottom: 32,
  },
  logoA: { color: colors.acid },
  title: {
    fontFamily: fonts.display,
    fontSize: 42,
    color: colors.white,
    marginBottom: 8,
    letterSpacing: 1,
  },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.grayLight, marginBottom: 28 },
  link: { color: colors.acid, fontFamily: fonts.bodyBold },
  lbl: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.grayLight,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: colors.dark2,
    color: colors.white,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.35)',
    backgroundColor: 'rgba(255,50,50,0.08)',
    padding: 12,
    marginBottom: 12,
  },
  err: { fontFamily: fonts.body, color: colors.danger, fontSize: 14 },
  primary: { backgroundColor: colors.acid, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryOff: { opacity: 0.6 },
  primaryTxt: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.black,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 28 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.gray },
  divTxt: { fontFamily: fonts.body, fontSize: 11, color: colors.grayMid, letterSpacing: 2 },
  google: {
    borderWidth: 1,
    borderColor: colors.gray,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  googleTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 2,
    color: colors.white,
  },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.grayMid, textAlign: 'center' },
});
