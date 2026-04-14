import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { colors, fonts } from '../theme';
import {
  DEFAULT_SERVICES,
  TIMES_MORNING,
  TIMES_AFTERNOON,
  TIMES_EVENING,
  getDays,
  heroNameLines,
  fmtPrice,
} from '../utils/booking';
import { notifyReservation } from '../api/notify';

const { width: W } = Dimensions.get('window');

export default function BarberProfileScreen({ navigation, route }) {
  const slug = route.params?.slug;
  const [barbero, setBarbero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [galeria, setGaleria] = useState([]);

  const [days] = useState(() => getDays());

  const [selectedService, setSelectedService] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [reservaLoading, setReservaLoading] = useState(false);

  const [pendingReseña, setPendingReseña] = useState(null);
  const [ratingSelected, setRatingSelected] = useState(0);
  const [ratingComentario, setRatingComentario] = useState('');
  const [ratingSending, setRatingSending] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  const loadBarbero = useCallback(async () => {
    if (!slug || !supabaseConfigured) {
      setLoading(false);
      return;
    }
    let { data, error } = await supabase
      .from('barberos')
      .select(
        'id, slug, especialidades, rating, total_cortes, bio, video_url, nombre_barberia, profiles(nombre)'
      )
      .eq('slug', slug)
      .maybeSingle();

    if (error) console.warn('[barbero]', error);
    if (!data) {
      await new Promise((r) => setTimeout(r, 600));
      const retry = await supabase
        .from('barberos')
        .select(
          'id, slug, especialidades, rating, total_cortes, bio, video_url, nombre_barberia, profiles(nombre)'
        )
        .eq('slug', slug)
        .maybeSingle();
      data = retry.data;
    }

    if (!data) {
      setLoading(false);
      return;
    }

    const d = data;
    supabase
      .from('servicios')
      .select('*')
      .eq('barbero_id', d.id)
      .eq('activo', true)
      .then(({ data: svcs }) => {
        if (svcs?.length) {
          setServices(
            svcs.map((s) => ({
              id: s.id,
              label: s.nombre,
              price: s.precio,
              duration: `${s.duracion_min} min`,
              icon: s.icono,
            }))
          );
        }
      });

    setBarbero({
      id: d.id,
      slug: d.slug,
      nombre: d.profiles?.nombre ?? slug,
      nombre_barberia: d.nombre_barberia ?? null,
      especialidades: d.especialidades ?? [],
      rating: d.rating ?? 5,
      total_cortes: d.total_cortes ?? 0,
      desde_año: new Date().getFullYear(),
      bio: d.bio,
      video_url: d.video_url,
    });

    supabase
      .from('galeria_cortes')
      .select('id, imagen_url, tipo')
      .eq('barbero_id', d.id)
      .order('created_at', { ascending: false })
      .then(({ data: gal }) => {
        if (gal) setGaleria(gal);
      });

    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadBarbero();
  }, [loadBarbero]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
        AsyncStorage.getItem(`reserva_draft_${slug}`).then((draft) => {
          if (!draft) return;
          try {
            const { selectedService: s, selectedDay: d, selectedTime: t } = JSON.parse(draft);
            if (s) setSelectedService(s);
            if (d != null) setSelectedDay(d);
            if (t) setSelectedTime(t);
          } catch {}
          AsyncStorage.removeItem(`reserva_draft_${slug}`);
        });
      } else {
        setUser(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [slug]);

  const barberoId = barbero?.id ?? null;

  useEffect(() => {
    if (!user || !barberoId) return;
    async function check() {
      const { data: reservasComp } = await supabase
        .from('reservas')
        .select('id')
        .eq('cliente_id', user.id)
        .eq('barbero_id', barberoId)
        .eq('estado', 'completada');
      if (!reservasComp?.length) return;
      const ids = reservasComp.map((r) => r.id);
      const { data: reseñasExist } = await supabase
        .from('reseñas')
        .select('reserva_id')
        .in('reserva_id', ids);
      const reseñadas = new Set((reseñasExist ?? []).map((r) => r.reserva_id));
      const sinReseña = ids.find((id) => !reseñadas.has(id));
      if (sinReseña) setPendingReseña({ reservaId: sinReseña });
    }
    check();
  }, [user, barberoId]);

  async function handleEnviarReseña() {
    if (!user || !barbero || !pendingReseña || ratingSelected === 0) return;
    setRatingSending(true);
    await supabase.from('reseñas').insert({
      reserva_id: pendingReseña.reservaId,
      cliente_id: user.id,
      barbero_id: barbero.id,
      estrellas: ratingSelected,
      comentario: ratingComentario.trim() || null,
    });
    const { data: updated } = await supabase
      .from('barberos')
      .select('rating, total_cortes')
      .eq('id', barbero.id)
      .single();
    if (updated) {
      setBarbero((prev) =>
        prev ? { ...prev, rating: updated.rating, total_cortes: updated.total_cortes } : prev
      );
    }
    setRatingSending(false);
    setRatingDone(true);
    setTimeout(() => {
      setPendingReseña(null);
      setRatingDone(false);
      setRatingSelected(0);
      setRatingComentario('');
    }, 2000);
  }

  const service = services.find((s) => s.id === selectedService);
  const day = days[selectedDay] ?? null;

  const nowBogota = () =>
    new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));

  async function handleConfirmar() {
    if (!selectedService || selectedDay == null || !selectedTime || !barbero) return;
    if (!user) {
      await AsyncStorage.setItem(
        `reserva_draft_${slug}`,
        JSON.stringify({ selectedService, selectedDay, selectedTime })
      );
      navigation.navigate('Login', {
        redirect: { screen: 'BarberProfile', params: { slug } },
      });
      return;
    }

    setReservaLoading(true);
    const d = days[selectedDay];
    const fecha = d.fullDate.toISOString().split('T')[0];

    const { error: insertError } = await supabase.from('reservas').insert({
      cliente_id: user.id,
      barbero_id: barbero.id,
      servicio_id: service?.id ?? null,
      fecha,
      hora: selectedTime,
      precio: service?.price ?? null,
      estado: 'pendiente',
    });

    if (insertError) {
      console.warn(insertError);
      setReservaLoading(false);
      return;
    }

    await notifyReservation({
      barberoId: barbero.id,
      barbero: barbero.nombre_barberia || barbero.nombre,
      servicio: service?.label ?? selectedService,
      fecha,
      hora: selectedTime,
      precio: service?.price ? service.price.toLocaleString('es-CO') : '—',
      cliente: user.email,
    });

    setReservaLoading(false);
    setConfirmed(true);
  }

  if (loading) {
    return (
      <View style={styles.centerFill}>
        <Text style={styles.loadingText}>CARGANDO...</Text>
      </View>
    );
  }

  if (!barbero) {
    return (
      <SafeAreaView style={styles.centerFill}>
        <Text style={styles.hero404}>BARBERO 404</Text>
        <Text style={styles.muted}>No encontramos este perfil</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.link}>← Volver al inicio</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const nombreBarberiaTrim = barbero.nombre_barberia?.trim() ?? '';
  const heroTitleSource = nombreBarberiaTrim || barbero.nombre;
  const { primary: heroPrimary, secondary: heroSecondary } = heroNameLines(heroTitleSource);

  if (confirmed) {
    return (
      <View style={styles.centerFill}>
        <Text style={styles.okTitle}>RESERVA CONFIRMADA</Text>
        <Text style={styles.okBody}>
          {service?.label} con {barbero.nombre}
          {'\n'}
          {day && `${day.day} ${day.label} ${day.month}`} · {selectedTime}
          {'\n'}${service ? fmtPrice(service.price) : '—'}
        </Text>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => setConfirmed(false)}>
          <Text style={styles.ghostBtnText}>NUEVA RESERVA</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = user && user.id === barbero.id;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {barbero.video_url ? (
            <Video
              source={{ uri: barbero.video_url }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <LinearGradient colors={[colors.dark2, colors.black]} style={styles.video} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.heroGrad}
          />
          <SafeAreaView edges={['top']} style={styles.heroTop}>
            <TouchableOpacity style={styles.backPill} onPress={() => navigation.goBack()}>
              <Text style={styles.backPillText}>← VOLVER</Text>
            </TouchableOpacity>
            {isOwner && (
              <View style={styles.ownerRow}>
                <TouchableOpacity
                  style={styles.ownerGhost}
                  onPress={() => navigation.navigate('Panel', { slug })}
                >
                  <Text style={styles.ownerGhostText}>PANEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ownerSolid}
                  onPress={() => navigation.navigate('Editar', { slug })}
                >
                  <Text style={styles.ownerSolidText}>EDITAR</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>Barbero · Bogo</Text>
            <Text style={styles.heroName}>{heroPrimary}</Text>
            <Text style={styles.heroNameAcid}>{heroSecondary}</Text>
            {nombreBarberiaTrim ? (
              <Text style={styles.personName}>{barbero.nombre}</Text>
            ) : null}
            <View style={styles.stats}>
              <View>
                <Text style={styles.statVal}>
                  {barbero.total_cortes > 0 ? `${barbero.total_cortes}+` : 'Nuevo'}
                </Text>
                <Text style={styles.statLbl}>Cortes</Text>
              </View>
              <View>
                <Text style={styles.statVal}>★ {String(barbero.rating)}</Text>
                <Text style={styles.statLbl}>Rating</Text>
              </View>
              <View>
                <Text style={styles.statVal}>{String(barbero.desde_año)}</Text>
                <Text style={styles.statLbl}>Desde</Text>
              </View>
            </View>
          </View>
          <View style={styles.acidLine} />
        </View>

        <View style={styles.body}>
          {galeria.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.stepKicker}>TRABAJOS</Text>
              <View style={styles.galGrid}>
                {galeria.map((foto) => (
                  <View key={foto.id} style={styles.galCell}>
                    {foto.tipo === 'video' ? (
                      <Video
                        source={{ uri: foto.imagen_url }}
                        style={styles.galImg}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted
                      />
                    ) : (
                      <Image source={{ uri: foto.imagen_url }} style={styles.galImg} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          <Step n="01" label="ELIGE EL SERVICIO" />
          {services.map((s) => {
            const active = selectedService === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.svc, active && styles.svcOn]}
                onPress={() => {
                  setSelectedService(s.id);
                  setSelectedTime(null);
                }}
              >
                <Text style={[styles.svcIcon, active && styles.svcIconOn]}>{s.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.svcLabel, active && styles.svcLabelOn]}>{s.label}</Text>
                  <Text style={[styles.svcDur, active && styles.svcDurOn]}>{s.duration}</Text>
                </View>
                <Text style={[styles.svcPrice, active && styles.svcPriceOn]}>
                  ${fmtPrice(s.price)}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Step n="02" label="DÍA Y HORA" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
            {days.map((d, i) => {
              const active = selectedDay === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayChip, active && styles.dayChipOn]}
                  onPress={() => {
                    setSelectedDay(i);
                    setSelectedTime(null);
                  }}
                >
                  <Text style={[styles.dayNum, active && styles.dayNumOn]}>{d.label}</Text>
                  <Text style={[styles.dayWd, active && styles.dayWdOn]}>{d.day}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {[
            { label: 'Mañana', times: TIMES_MORNING },
            { label: 'Tarde', times: TIMES_AFTERNOON },
            { label: 'Noche', times: TIMES_EVENING },
          ].map((group) => {
            const isToday = selectedDay === 0;
            const bog = nowBogota();
            const available = isToday
              ? group.times.filter((t) => {
                  const [h, m] = t.split(':').map(Number);
                  return h * 60 + m > bog.getHours() * 60 + bog.getMinutes();
                })
              : group.times;
            if (!available.length) return null;
            return (
              <View key={group.label} style={{ marginBottom: 12 }}>
                <Text style={styles.slotGrp}>{group.label}</Text>
                <View style={styles.slotWrap}>
                  {available.map((t) => {
                    const active = selectedTime === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.slot, active && styles.slotOn]}
                        onPress={() => setSelectedTime(t)}
                      >
                        <Text style={[styles.slotTxt, active && styles.slotTxtOn]}>{t}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}

          <Step n="03" label="TU RESUMEN" />
          <View style={styles.summary}>
            <Row label="Barbero" value={barbero.nombre.toUpperCase()} />
            <View style={styles.sep} />
            <Row
              label="Fecha y hora"
              value={
                day && selectedTime ? `${day.day} ${day.label} ${day.month} · ${selectedTime}` : '—'
              }
              dim={!day || !selectedTime}
            />
            <View style={styles.sep} />
            <Row label="Servicio" value={service ? service.label : '—'} dim={!service} />
            <View style={styles.sep} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLbl}>Total</Text>
              <Text style={[styles.totalVal, !service && { color: colors.grayMid }]}>
                {service ? `$${fmtPrice(service.price)}` : '—'}
              </Text>
            </View>
          </View>

          {!user && selectedService && selectedDay != null && selectedTime && (
            <View style={styles.loginHint}>
              <Text style={styles.loginHintText}>
                Debes iniciar sesión o registrarte para confirmar.
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.confirm,
              (!selectedService || selectedTime == null || !selectedTime || reservaLoading) &&
                styles.confirmOff,
            ]}
            disabled={!selectedService || selectedTime == null || !selectedTime || reservaLoading}
            onPress={handleConfirmar}
          >
            <Text style={styles.confirmText}>
              {reservaLoading
                ? 'RESERVANDO...'
                : selectedService && selectedTime
                  ? user
                    ? 'CONFIRMAR RESERVA'
                    : 'INICIA SESIÓN PARA RESERVAR'
                  : 'COMPLETA LOS PASOS'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={Boolean(pendingReseña)} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            {ratingDone ? (
              <Text style={styles.modalOk}>GRACIAS POR TU RESEÑA</Text>
            ) : (
              <>
                <TouchableOpacity style={styles.modalClose} onPress={() => setPendingReseña(null)}>
                  <Text style={styles.modalCloseTxt}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.modalK}>¿QUÉ TAL EL CORTE?</Text>
                <Text style={styles.modalTitle}>
                  CALIFICA A{'\n'}
                  <Text style={{ color: colors.acid }}>{barbero.nombre.toUpperCase()}</Text>
                </Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setRatingSelected(n)}>
                      <Text style={styles.star}>{n <= ratingSelected ? '★' : '☆'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.ta}
                  placeholder="Comentario (opcional)..."
                  placeholderTextColor={colors.grayMid}
                  value={ratingComentario}
                  onChangeText={setRatingComentario}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.modalBtn, ratingSelected === 0 && styles.confirmOff]}
                  disabled={ratingSelected === 0 || ratingSending}
                  onPress={handleEnviarReseña}
                >
                  <Text style={styles.modalBtnTxt}>
                    {ratingSending ? 'ENVIANDO...' : 'ENVIAR RESEÑA'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Step({ n, label }) {
  return (
    <View style={styles.stepHead}>
      <Text style={styles.stepNum}>{n}</Text>
      <Text style={styles.stepTitle}>{label}</Text>
    </View>
  );
}

function Row({ label, value, dim }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLbl}>{label}</Text>
      <Text style={[styles.rowVal, dim && { color: colors.grayMid }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  centerFill: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 4,
    color: colors.acid,
  },
  hero404: {
    fontFamily: fonts.display,
    fontSize: 48,
    color: colors.white,
    marginBottom: 8,
  },
  muted: { fontFamily: fonts.body, color: colors.grayLight, marginBottom: 16 },
  link: { fontFamily: fonts.bodyBold, color: colors.acid, fontSize: 14 },
  hero: { height: W * 1.1, position: 'relative' },
  video: { ...StyleSheet.absoluteFillObject },
  heroGrad: { ...StyleSheet.absoluteFillObject },
  heroTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 4 },
  backPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.white,
  },
  ownerRow: { flexDirection: 'row', gap: 8 },
  ownerGhost: {
    borderWidth: 1,
    borderColor: colors.acid,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.dark2,
  },
  ownerGhostText: {
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.acid,
  },
  ownerSolid: {
    backgroundColor: colors.acid,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  ownerSolidText: {
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.black,
  },
  heroText: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    left: 20,
    alignItems: 'flex-end',
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 4,
    color: colors.acid,
    marginBottom: 8,
  },
  heroName: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 50,
    color: colors.white,
    textAlign: 'right',
  },
  heroNameAcid: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 50,
    color: colors.acid,
    textAlign: 'right',
    marginBottom: 8,
  },
  personName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 2,
    color: colors.grayLight,
    textAlign: 'right',
    marginBottom: 12,
  },
  stats: { flexDirection: 'row', gap: 20, marginTop: 8, justifyContent: 'flex-end' },
  statVal: { fontFamily: fonts.display, fontSize: 22, color: colors.white },
  statLbl: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.grayLight,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  acidLine: { height: 3, backgroundColor: colors.acid, marginTop: -3 },
  body: { padding: 20, paddingBottom: 48, maxWidth: 720, alignSelf: 'center', width: '100%' },
  block: { marginBottom: 24 },
  stepKicker: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.white,
    marginBottom: 12,
    letterSpacing: 1,
  },
  galGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galCell: { width: (W - 56) / 3, aspectRatio: 1, overflow: 'hidden' },
  galImg: { width: '100%', height: '100%' },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 14 },
  stepNum: { fontFamily: fonts.display, fontSize: 12, color: colors.acid, opacity: 0.8 },
  stepTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.white, flex: 1 },
  svc: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: colors.dark2,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  svcOn: { backgroundColor: colors.acid, borderColor: colors.acid },
  svcIcon: { fontFamily: fonts.display, fontSize: 22, color: colors.acid },
  svcIconOn: { color: colors.black },
  svcLabel: { fontFamily: fonts.display, fontSize: 18, color: colors.white },
  svcLabelOn: { color: colors.black },
  svcDur: { fontFamily: fonts.body, fontSize: 11, color: colors.grayLight, marginTop: 4 },
  svcDurOn: { color: 'rgba(0,0,0,0.55)' },
  svcPrice: { fontFamily: fonts.display, fontSize: 20, color: colors.white },
  svcPriceOn: { color: colors.black },
  dayRow: { marginBottom: 16 },
  dayChip: {
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: colors.dark2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    alignItems: 'center',
  },
  dayChipOn: { backgroundColor: colors.acid, borderColor: colors.acid },
  dayNum: { fontFamily: fonts.display, fontSize: 22, color: colors.white },
  dayNumOn: { color: colors.black },
  dayWd: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.grayLight, marginTop: 4 },
  dayWdOn: { color: 'rgba(0,0,0,0.55)' },
  slotGrp: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.grayLight,
    marginBottom: 8,
  },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: colors.dark2,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  slotOn: { backgroundColor: colors.acid, borderColor: colors.acid },
  slotTxt: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.white },
  slotTxtOn: { color: colors.black },
  summary: {
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: colors.dark2,
    padding: 18,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLbl: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.grayLight,
    textTransform: 'uppercase',
  },
  rowVal: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white, flex: 1, textAlign: 'right' },
  sep: { height: 1, backgroundColor: colors.gray, marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLbl: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.grayLight,
    textTransform: 'uppercase',
  },
  totalVal: { fontFamily: fonts.display, fontSize: 32, color: colors.acid },
  loginHint: {
    borderWidth: 1,
    borderColor: colors.gray,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.dark2,
  },
  loginHintText: { fontFamily: fonts.body, fontSize: 13, color: colors.grayLight },
  confirm: { backgroundColor: colors.acid, paddingVertical: 16, alignItems: 'center' },
  confirmOff: { backgroundColor: colors.gray },
  confirmText: {
    fontFamily: fonts.display,
    fontSize: 16,
    letterSpacing: 3,
    color: colors.black,
  },
  okTitle: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.acid,
    textAlign: 'center',
    marginBottom: 16,
  },
  okBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.grayLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.gray,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  ghostBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.grayLight,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: colors.dark2,
    borderWidth: 1,
    borderColor: colors.gray,
    padding: 24,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  modalClose: { position: 'absolute', top: 12, right: 12, zIndex: 2 },
  modalCloseTxt: { color: colors.grayLight, fontSize: 18 },
  modalK: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.acid,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.white,
    marginBottom: 16,
    lineHeight: 28,
  },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  star: { fontSize: 36, color: colors.acid },
  ta: {
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.gray,
    color: colors.white,
    fontFamily: fonts.body,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalBtn: { backgroundColor: colors.acid, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  modalBtnTxt: {
    fontFamily: fonts.display,
    fontSize: 16,
    letterSpacing: 2,
    color: colors.black,
  },
  modalOk: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.white,
    textAlign: 'center',
  },
});
