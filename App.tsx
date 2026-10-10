import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { addUserInteractionListener } from 'expo-widgets';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { getState, startRecording, stopRecording, togglePause } from './recorder';

type Phase = 'idle' | 'rec' | 'paused';
const SHOW_DIAG = false;

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function App() {
  const [, tick] = useState(0);
  const mic = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const phase = useRef<Phase>('idle');
  // --- demo diagnostics (shown small at the bottom) ---
  const ticks = useRef(0);
  const [diag, setDiag] = useState('');
  const lastEvt = useRef('none');
  const appState = useRef(AppState.currentState as string);
  useEffect(() => {
    const a = AppState.addEventListener('change', (s) => { appState.current = s; });
    const b = addUserInteractionListener((e) => { lastEvt.current = `${e.target} @ ${new Date().toLocaleTimeString()}`; });
    return () => { a.remove(); b.remove(); };
  }, []);

  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync();
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldPlayInBackground: true, allowsBackgroundRecording: true });
  }, []);

  // Real audio follows the recorder state. Background audio keeps the app (and the
  // Live Activity button listener) alive while the phone is locked.
  useEffect(() => {
    const id = setInterval(async () => {
      tick((n) => n + 1);
      ticks.current += 1;
      setDiag(`app:${appState.current} · ticks:${ticks.current} · mic:${mic.isRecording ? 'on' : 'off'} · evt:${lastEvt.current}`);
      const s = getState();
      const next: Phase = !s ? 'idle' : s.pausedAt ? 'paused' : 'rec';
      const prev = phase.current;
      if (next === prev) return;
      phase.current = next;
      try {
        if (prev === 'idle' && next === 'rec') { await mic.prepareToRecordAsync(); mic.record(); }
        else if (next === 'paused') mic.pause();
        else if (prev === 'paused' && next === 'rec') mic.record();
        else if (next === 'idle') await mic.stop();
      } catch (e) { console.warn(e); }
    }, 250);
    return () => clearInterval(id);
  }, [mic]);

  const st = getState();
  const elapsed = st ? (st.pausedAt ?? Date.now()) - st.startedAt : 0;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Voice Memo</Text>
      <Text style={styles.status}>{!st ? 'Ready' : st.pausedAt ? 'Paused' : 'Recording'}</Text>
      <Text style={styles.time}>{fmt(elapsed)}</Text>
      {!st ? (
        <Pressable testID="record" onPress={startRecording} style={styles.recordOuter}>
          <View style={styles.recordInner} />
        </Pressable>
      ) : (
        <View style={styles.row}>
          <Pressable testID="toggle" onPress={togglePause} style={[styles.btn, { backgroundColor: '#3A3A3C' }]}>
            <Text style={styles.btnText}>{st.pausedAt ? 'Resume' : 'Pause'}</Text>
          </Pressable>
          <Pressable testID="stop" onPress={stopRecording} style={[styles.btn, { backgroundColor: '#FF3B30' }]}>
            <Text style={styles.btnText}>Stop</Text>
          </Pressable>
        </View>
      )}
      {SHOW_DIAG && <Text style={styles.diag}>{diag}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E10', alignItems: 'center', paddingTop: 120 },
  title: { color: '#fff', fontSize: 30, fontWeight: '700' },
  status: { color: '#8E8E93', fontSize: 18, marginTop: 80 },
  time: { color: '#fff', fontSize: 76, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 8 },
  recordOuter: { marginTop: 'auto', marginBottom: 120, width: 96, height: 96, borderRadius: 48, borderWidth: 5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  recordInner: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#FF3B30' },
  row: { flexDirection: 'row', gap: 16, marginTop: 'auto', marginBottom: 120 },
  btn: { paddingHorizontal: 34, paddingVertical: 18, borderRadius: 999 },
  btnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  diag: { position: 'absolute', bottom: 40, color: '#5E6779', fontSize: 11, paddingHorizontal: 12, textAlign: 'center' },
});
