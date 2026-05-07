import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import type { VoiceCommand } from '../types';
import { formatDistance } from '../utils/math';

let _commands: VoiceCommand[] = [];
let _isSpeaking = false;
let _isListening = false;
let _muted = false;

export function setVoiceMuted(muted: boolean): void {
  _muted = muted;
}

export function registerCommands(commands: VoiceCommand[]): void {
  _commands = commands;
}

export async function speak(text: string, rate = 1.0): Promise<void> {
  if (_muted || _isSpeaking) return;
  _isSpeaking = true;
  try {
    await TextToSpeech.speak({ text, rate, lang: 'en-US' });
  } finally {
    _isSpeaking = false;
  }
}

export async function startListening(
  onResult: (transcript: string) => void,
  onError?: (err: string) => void
): Promise<void> {
  if (_isListening) return;

  await SpeechRecognition.requestPermissions();

  _isListening = true;
  try {
    await SpeechRecognition.start({
      language:       'en-US',
      maxResults:     1,
      prompt:         'Listening...',
      partialResults: false,
      popup:          false,
    });

    SpeechRecognition.addListener('partialResults', (data: { matches?: string[] }) => {
      const transcript = data.matches?.[0] ?? '';
      if (transcript) {
        onResult(transcript.toLowerCase().trim());
        stopListening();
      }
    });
  } catch (e: unknown) {
    _isListening = false;
    onError?.(e instanceof Error ? e.message : 'Speech recognition failed');
  }
}

export async function stopListening(): Promise<void> {
  if (!_isListening) return;
  _isListening = false;
  await SpeechRecognition.stop();
  SpeechRecognition.removeAllListeners();
}

export async function processTranscript(transcript: string): Promise<string | null> {
  for (const cmd of _commands) {
    const match = transcript.match(cmd.pattern);
    if (match) {
      const response = await cmd.handler(match);
      return response;
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// Built-in command builders
// ─────────────────────────────────────────────

export interface CommandDeps {
  getMembers: () => Array<{ displayName: string; distanceFromCenter: number; timestamp: number }>;
  getTotalCount: () => number;
  getSeparatedCount: () => number;
  getDestinationName: () => string | null;
  getDestinationDistanceM: () => number | null;
  getCurrentSpeedMs: () => number | null;
  sendPreset: (msg: string) => void;
  stopTracking: () => void;
  dropPin: () => void;
}

export function buildDefaultCommands(deps: CommandDeps): VoiceCommand[] {
  return [
    {
      // "where is [name]"
      pattern: /where is (.+)/i,
      handler: ([, name]) => {
        const member = deps.getMembers().find((m) =>
          m.displayName.toLowerCase().includes(name.toLowerCase())
        );
        if (!member) return `Cannot find ${name} in your group.`;
        const secAgo = Math.round((Date.now() - member.timestamp) / 1000);
        return `${member.displayName} is ${formatDistance(member.distanceFromCenter)} from group center, last updated ${secAgo} seconds ago.`;
      },
    },
    {
      // "how many people"
      pattern: /how many (people|riders|members|hikers|cars)/i,
      handler: () => {
        const total = deps.getTotalCount();
        const sep   = deps.getSeparatedCount();
        return sep > 0
          ? `${total} members in group, ${sep} separated.`
          : `${total} members in group, everyone together.`;
      },
    },
    {
      // "i'm okay" / "im okay"
      pattern: /i'?m okay/i,
      handler: () => {
        deps.sendPreset("I'm okay, just slow");
        return "Message sent.";
      },
    },
    {
      // "stop tracking"
      pattern: /stop tracking/i,
      handler: () => {
        deps.stopTracking();
        return 'Location sharing stopped.';
      },
    },
    {
      // "drop a pin" / "drop pin"
      pattern: /drop a? pin/i,
      handler: () => {
        deps.dropPin();
        return 'Pin dropped at your current location.';
      },
    },
    {
      // "where are we going"
      pattern: /where are we going/i,
      handler: () => {
        const dest  = deps.getDestinationName();
        const distM = deps.getDestinationDistanceM();
        if (!dest) return 'No destination set.';
        const distStr = distM !== null ? `, ${formatDistance(distM)} away` : '';
        return `Destination is ${dest}${distStr}.`;
      },
    },
  ];
}
