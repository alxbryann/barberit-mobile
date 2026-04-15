import { useEffect, useState } from 'react';
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
import { colors, fonts } from '../theme';
import { RESET_MAIN_AGENDA, resetToBarberMainTabs } from '../navigation/resetMainTabs';

export default function CompletarPerfilScreen({ navigation, route }) {
  const suggestedNombre = route.params?.suggestedNombre ?? '';
  const redirect = route.params?.redirect;
  const initialRole = route.params?.role === 'barbero' ? 'barbero' : 'cliente';
  const [role, setRole] = useState(initialRole);
  const [nombre, setNombre] = useState(suggestedNombre);
  const [telefono, setTelefono] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigation.replace('Login');
    });
  }, [navigation]);

  async function handleSubmit() {
    if (!supabaseConfigured) {
      setError('Configura Supabase.');
      return;
    }
    setError('');
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigation.replace('Login');
      setLoading(false);
      return;
    }
    const userId = session.user.id;
    const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      role,
      nombre,
      telefono: telefono || null,
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
      navigation.reset(resetToBarberMainTabs(slugFinal));
    } else if (redirect?.screen) {
      navigation.reset({
        index: 0,
        routes: [{ name: redirect.screen, params: redirect.params ?? {} }],
      });
    } else {
      navigation.reset(RESET_MAIN_AGENDA);
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
            <Text style={styles.title}>UN PASO MÁS</Text>
            <Text style={styles.sub}>Completa tu perfil para continuar</Text>

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
                  </TouchableOpacity>
                );
              })}
            </View>

            <Field label="NOMBRE" value={nombre} onChangeText={setNombre} />
            <Field label="TELÉFONO" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />

            {role === 'barbero' && (
              <View style={{ marginBottom: 14 }}>
                <Field
                  label="URL DE TU PERFIL"
                  value={slug}
                  onChangeText={(v) =>
                    setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                  }
                />
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
              <Text style={styles.primaryTxt}>{loading ? 'GUARDANDO...' : 'CONTINUAR'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({ label, value, onChangeText, keyboardType }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.lbl}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor={colors.grayMid}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  safe: { flex: 1 },
  scroll: { padding: 24 },
  title: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.white,
    marginBottom: 8,
    letterSpacing: 1,
  },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.grayLight, marginBottom: 24 },
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
  },
  roleTitleOn: { color: colors.black },
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
    padding: 12,
    marginBottom: 12,
  },
  err: { fontFamily: fonts.body, color: colors.danger, fontSize: 14 },
  primary: { backgroundColor: colors.acid, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryOff: { opacity: 0.6 },
  primaryTxt: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 2,
    color: colors.black,
  },
});
