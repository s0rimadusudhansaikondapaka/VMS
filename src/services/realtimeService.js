/**
 * Real-Time Intimation & Audio/Desktop Alert Service for Sathya Sai Grama VMS
 */

let audioCtx = null;

export function playAudioChime(type = 'default') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    if (type === 'urgent') {
      // High pitch double chime for VVIP / Overstay / Gate Alert
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(1174.66, now + 0.12); // D6
      osc2.frequency.setValueAtTime(1318.51, now + 0.24); // E6
    } else {
      // Pleasant dual-tone chime for normal guest arrival/approval
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.15); // A5
    }

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now + 0.15);

    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch (err) {
    console.warn('[realtimeService] Audio chime failed:', err);
  }
}

export async function requestDesktopNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  const permission = await Notification.requestPermission();
  return permission;
}

export function triggerDesktopNotification(title, body, icon = '/madhu_sudhan_sai.jpg') {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon,
        badge: icon,
        vibrate: [200, 100, 200],
        silent: false,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    }
  } catch (err) {
    console.warn('[realtimeService] Desktop notification error:', err);
  }
}
