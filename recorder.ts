import { addUserInteractionListener, type LiveActivity } from 'expo-widgets';
import RecorderActivity, { type RecorderProps } from './widgets/RecorderActivity';

let activity: LiveActivity<RecorderProps> | null = null;
let state: RecorderProps = { startedAt: 0, pausedAt: null };

export function startRecording() {
  state = { startedAt: Date.now(), pausedAt: null };
  activity = RecorderActivity.start(state, 'myrecorder://recording');
}

export function togglePause() {
  if (!activity) return;
  if (state.pausedAt === null) {
    state = { ...state, pausedAt: Date.now() };
  } else {
    const pausedFor = Date.now() - state.pausedAt;
    state = { startedAt: state.startedAt + pausedFor, pausedAt: null };
  }
  activity.update(state);
}

export async function stopRecording() {
  await activity?.end('immediate');
  activity = null;
}

addUserInteractionListener((event) => {
  if (!activity || event.source !== activity.getId()) return;
  if (event.target === 'toggle') togglePause();
  if (event.target === 'stop') stopRecording();
});

// (demo only) lets the screen read the current state
export const getState = () => (activity ? state : null);
