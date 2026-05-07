import { useVoice } from '../../hooks/useVoice';

export function VoiceCommandBar() {
  const { voiceState, lastTranscript, listen, cancel } = useVoice();

  const isActive = voiceState !== 'idle' && voiceState !== 'error';

  return (
    <div className="voice-bar">
      {lastTranscript && voiceState !== 'idle' && (
        <div className="voice-transcript">{lastTranscript}</div>
      )}
      <button
        className={`voice-btn ${isActive ? 'voice-btn--active' : ''}`}
        onClick={isActive ? cancel : listen}
        type="button"
        aria-label={isActive ? 'Cancel voice command' : 'Start voice command'}
      >
        {voiceState === 'listening'  && '🎙 Listening…'}
        {voiceState === 'processing' && '⏳ Processing…'}
        {voiceState === 'speaking'   && '🔊 Speaking…'}
        {voiceState === 'error'      && '❌ Try again'}
        {voiceState === 'idle'       && '🎙 Voice'}
      </button>
    </div>
  );
}
