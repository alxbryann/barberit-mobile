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

export default function RegistroScreen({ navigation, route }) {
  const redirect = route.params?.redirect;
  const [role, setRole] = useState('cliente');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [slugFinalSent, setSlugFinalSent] = useState('');

  async function handleGoogle() {
    if (!supabaseConfigured) {
      setError('Configura Supabase.');
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
      const suggested =
        session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? '';

      if (!existing) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'CompletarPerfil',
              params: { suggestedNombre: suggested, redirect, role },
            },
          ],
        });
      } else if (existing.role === 'barbero') {
        const { data: barbero } = await supabase
          .from('barberos')
          .select('slug')
          .eq('id', session.user.id)
          .maybeSingle();
        if (barbero?.slug) {
          navigation.reset({ index: 0, routes: [{ name: 'Panel', params: { slug: barbero.slug } }] });
        } else {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'CompletarPerfil',
                params: { suggestedNombre: suggested, redirect, role: 'barbero' },
              },
            ],
          });
        }
      } else if (role === 'barbero') {
        // Perfil ya creado como cliente (p. ej. trigger) pero eligió barbero antes de Google
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'CompletarPerfil',
              params: { suggestedNombre: suggested, redirect, role: 'barbero' },
            },
          ],
        });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (e) {
      setError(String(e.message ?? e));
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!supabaseConfigured) {
      setError('Configura Supabase.');
      return;
    }
    setError('');
    setLoading(true);
    const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          role,
          telefono,
          ...(role === 'barbero' ? { slug: slugFinal } : {}),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (signUpData.session && signUpData.user) {
      const userId = signUpData.user.id;
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: userId,
        role,
        nombre,
        telefono,
      });
      if (profileErr) {
        setError(profileErr.message);
        setLoading(false);
        return;
      }
      if (role === 'barbero') {
        const { error: barberErr } = await supabase.from('barberos').upsert({
          id: userId,
          slug: slugFinal,
        });
        if (barberErr) {
          setError(barberErr.message);
          setLoading(false);
          return;
        }
        navigation.reset({
          index: 0,
          routes: [{ name: 'Panel', params: { slug: slugFinal } }],
        });
      } else {
        if (redirect?.screen) {
          navigation.reset({
            index: 0,
            routes: [{ name: redirect.screen, params: redirect.params ?? {} }],
          });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
      }
    } else if (signUpData.user) {
      setSlugFinalSent(slugFinal);
      setEmailSent(true);
    } else {
      setError('Ocurrió un error. Intenta iniciar sesión.');
    }
    setLoading(false);
  }

  if (emailSent) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.logo}>
              BARBER<Text style={styles.logoA}>.IT</Text>
            </Text>
            <Text style={styles.title}>REVISA TU CORREO</Text>
            <Text style={styles.body}>
              Te enviamos un link a{'\n'}
              <Text style={{ color: colors.white, fontFamily: fonts.bodyBold }}>{email}</Text>
              {'\n\n'}
              {role === 'barbero'
                ? `Tras confirmar, tu perfil estará en barber.it/barbero/${slugFinalSent}`
                : 'Tras confirmar, ya puedes iniciar sesión.'}
            </Text>
            <TouchableOpacity
              style={styles.primary}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryTxt}>IR A INICIAR SESIÓN</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEmailSent(false)}>
              <Text style={styles.link}>Volver al registro</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
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

            <Text style={styles.title}>CREAR CUENTA</Text>
            <Text style={styles.sub}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.link} onPress={() => navigation.navigate('Login', { redirect })}>
                Inicia sesión
              </Text>
            </Text>

            <View style={styles.roles}>
              {['cliente', 'barbero'].map((r) => {
                const active = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleBtn, active && styles.roleBtnOn]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.roleTitle, active && styles.roleTitleOn]}>
                      {r === 'barbero' ? 'SOY BARBERO' : 'SOY CLIENTE'}
                    </Text>
                    <Text style={[styles.roleSub, active && styles.roleSubOn]}>
                      {r === 'barbero' ? 'Aliado' : 'Quiero reservar'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.google} onPress={handleGoogle} disabled={loading}>
              <Text style={styles.googleTxt}>CONTINUAR CON GOOGLE</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divTxt}>o</Text>
              <View style={styles.divLine} />
            </View>

            <Field label="NOMBRE" value={nombre} onChangeText={setNombre} />
            <Field label="CORREO" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Field label="TELÉFONO" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
            <Field
              label="CONTRASEÑA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {role === 'barbero' && (
              <View style={{ marginBottom: 14 }}>
                <Field
                  label="URL DE TU PERFIL"
                  value={slug}
                  onChangeText={(v) =>
                    setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                  }
                  placeholder="jovan-rivera"
                />
                <Text style={styles.hintSm}>barber.it/barbero/{slug || 'tu-nombre'}</Text>
              </View>
            )}

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
              <Text style={styles.primaryTxt}>
                {loading ? 'CREANDO...' : role === 'barbero' ? 'CREAR PERFIL BARBERO' : 'CREAR CUENTA'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({ label, value, onChangeText, keyboardType, secureTextEntry, placeholder }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.lbl}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={placeholder ?? undefined}
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
  scroll: { padding: 24 },
  logo: {
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: 2,
    color: colors.white,
    marginBottom: 28,
  },
  logoA: { color: colors.acid },
  title: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.white,
    marginBottom: 8,
    letterSpacing: 1,
  },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.grayLight, marginBottom: 24 },
  link: { color: colors.acid, fontFamily: fonts.bodyBold },
  roles: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: colors.dark2,
    padding: 14,
    alignItems: 'center',
  },
  roleBtnOn: { backgroundColor: colors.acid, borderColor: colors.acid },
  roleTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    letterSpacing: 1,
    color: colors.white,
    marginBottom: 4,
  },
  roleTitleOn: { color: colors.black },
  roleSub: { fontFamily: fonts.body, fontSize: 11, color: colors.grayLight },
  roleSubOn: { color: 'rgba(0,0,0,0.55)' },
  google: {
    borderWidth: 1,
    borderColor: colors.gray,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colors.dark2,
  },
  googleTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.white,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.gray },
  divTxt: { fontFamily: fonts.body, fontSize: 11, color: colors.grayLight },
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
  hintSm: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.grayLight,
    marginTop: 6,
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
    fontSize: 16,
    letterSpacing: 2,
    color: colors.black,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.grayLight,
    lineHeight: 22,
    marginBottom: 24,
  },
});
