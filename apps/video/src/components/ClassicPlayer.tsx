import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';

interface ClassicPlayerProps {
  src: string;
  poster: string;
  title: string;
  onEnded?: () => void;
}

type SafariVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

export function playerTime(value: number): string {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const tail = String(seconds % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${tail}` : `${minutes}:${tail}`;
}

/** Original geometric icons, drawn for this player; no external assets. */
function Icon({ kind }: { kind: 'play' | 'pause' | 'sound' | 'mute' | 'fullscreen' | 'exit' }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      {kind === 'play' ? <path fill="currentColor" d="M7 4 20 12 7 20Z" /> : null}
      {kind === 'pause' ? <path fill="currentColor" d="M5 4h5v16H5zm9 0h5v16h-5z" /> : null}
      {kind === 'sound' || kind === 'mute' ? <>
        <path fill="currentColor" d="M3 9h4l6-5v16l-6-5H3z" />
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          d={kind === 'mute' ? 'm17 8 5 8m0-8-5 8' : 'M16 8q5 4 0 8m3-11q8 7 0 14'} />
      </> : null}
      {kind === 'fullscreen' || kind === 'exit' ? <path fill="none" stroke="currentColor" strokeWidth="2"
        d={kind === 'fullscreen' ? 'M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5' : 'M4 9h5V4m6 0v5h5M9 20v-5H4m16 0h-5v5'} /> : null}
    </svg>
  );
}

/** Media events, not timers or optimistic button state, drive the controls. */
export function ClassicPlayer(props: ClassicPlayerProps) {
  return <PlayerSession key={props.src} {...props} />;
}

function PlayerSession({ src, poster, title, onEnded }: ClassicPlayerProps) {
  const videoRef = useRef<SafariVideo>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const loadFailed = useRef(false);
  const helpId = useId();
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [message, setMessage] = useState('');
  const [nativeControls, setNativeControls] = useState(false);
  const [deviceVolume] = useState(() =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
  );

  useEffect(() => {
    const video = videoRef.current;
    const syncFullscreen = () => setFullscreen(
      document.fullscreenElement === frameRef.current || Boolean(video?.webkitDisplayingFullscreen),
    );
    document.addEventListener('fullscreenchange', syncFullscreen);
    video?.addEventListener('webkitbeginfullscreen', syncFullscreen);
    video?.addEventListener('webkitendfullscreen', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      video?.removeEventListener('webkitbeginfullscreen', syncFullscreen);
      video?.removeEventListener('webkitendfullscreen', syncFullscreen);
    };
  }, []);

  const syncTime = () => {
    const video = videoRef.current;
    if (!video) return;
    setTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
    setDuration(Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0);
  };
  const syncVolume = () => {
    if (!videoRef.current) return;
    setVolume(videoRef.current.volume);
    setMuted(videoRef.current.muted);
  };
  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) { video.pause(); return; }
    // Firefox can emit `play` but leave its promise pending when a <source>
    // already failed. Preserve an honest Play/error state in that case.
    if (loadFailed.current) {
      setPlaying(false);
      setMessage('This video could not be loaded or decoded. Try device controls or another supported file.');
      return;
    }
    setMessage('');
    try {
      if (video.ended) video.currentTime = 0;
      await video.play();
    } catch (error) {
      // Navigation/pause may legitimately interrupt a pending play request.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setPlaying(false);
      setWaiting(false);
      setMessage('Playback could not start. Try Play again or use device controls. This browser may not support the file.');
    }
  };
  const seek = (value: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    try { video.currentTime = Math.min(duration, Math.max(0, value)); syncTime(); }
    catch { setMessage('This part of the video is not available to seek yet.'); }
  };
  const changeVolume = (value: number) => {
    if (!videoRef.current || deviceVolume) return;
    videoRef.current.volume = Math.min(1, Math.max(0, value));
    videoRef.current.muted = value === 0;
    syncVolume();
  };
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const wasSilent = video.muted || video.volume === 0;
    if (video.volume === 0 && !deviceVolume) video.volume = 0.5;
    video.muted = !wasSilent;
    syncVolume();
  };
  const toggleFullscreen = async () => {
    const frame = frameRef.current;
    const video = videoRef.current;
    if (!frame || !video) return;
    try {
      if (document.fullscreenElement === frame) await document.exitFullscreen();
      else if (video.webkitDisplayingFullscreen && video.webkitExitFullscreen) video.webkitExitFullscreen();
      else if (document.fullscreenEnabled && frame.requestFullscreen) await frame.requestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      else {
        setNativeControls(true);
        setMessage('Fullscreen is unavailable here. Device controls are enabled.');
      }
    } catch {
      setMessage('Fullscreen could not open. Try the fullscreen button in device controls.');
      setNativeControls(true);
    }
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (nativeControls) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    // Buttons and sliders keep their native keyboard semantics. Shortcuts never
    // reach document-level handlers or interfere with forms elsewhere.
    if ((event.target as HTMLElement).closest('button, input, select, textarea, a, summary, [contenteditable="true"]')) return;
    switch (event.key.toLowerCase()) {
      case ' ': case 'k': event.preventDefault(); if (!event.repeat) void togglePlay(); break;
      case 'arrowleft': event.preventDefault(); seek(time - 5); break;
      case 'arrowright': event.preventDefault(); seek(time + 5); break;
      case 'arrowup': event.preventDefault(); changeVolume(volume + 0.1); break;
      case 'arrowdown': event.preventDefault(); changeVolume(volume - 0.1); break;
      case 'm': event.preventDefault(); if (!event.repeat) toggleMute(); break;
      case 'f': event.preventDefault(); if (!event.repeat) void toggleFullscreen(); break;
      case 'home': event.preventDefault(); seek(0); break;
      case 'end': event.preventDefault(); seek(duration); break;
    }
  };
  const played = duration ? Math.min(100, time / duration * 100) : 0;
  const silent = muted || volume === 0;

  return (
    <div className="classic-player" ref={frameRef} role="group" aria-label={`${title} video player`}
      aria-describedby={helpId} tabIndex={0} onKeyDown={keyboard}>
      <video className="player" ref={videoRef} controls={nativeControls} playsInline preload="metadata"
        poster={poster} aria-label={title} tabIndex={0}
        onClick={() => { if (!nativeControls) void togglePlay(); }}
        onLoadedMetadata={() => { loadFailed.current = false; syncTime(); }} onDurationChange={syncTime} onTimeUpdate={syncTime}
        onPlay={() => { setPlaying(true); setMessage(''); }}
        onPlaying={() => { setWaiting(false); setPlaying(true); }}
        onPause={() => { setPlaying(false); setWaiting(false); }}
        onWaiting={() => setWaiting(true)} onCanPlay={() => setWaiting(false)}
        onVolumeChange={syncVolume}
        onErrorCapture={() => { loadFailed.current = true; setWaiting(false); setPlaying(false); setMessage('This video could not be loaded or decoded. Try device controls or another supported file.'); }}
        onEnded={() => { setPlaying(false); setWaiting(false); syncTime(); onEnded?.(); }}>
        <source src={src} />
        Your browser cannot play this file. Try another browser or download the video.
      </video>
      {!nativeControls ? (
        <div className="classic-player__controls" role="group" aria-label="Playback controls">
          <button type="button" className="classic-player__button classic-player__play"
            aria-label={playing ? 'Pause' : 'Play'} title={playing ? 'Pause (Space / K)' : 'Play (Space / K)'}
            onClick={() => void togglePlay()}><Icon kind={playing ? 'pause' : 'play'} /></button>
          <input type="range" className="classic-player__range classic-player__seek" aria-label="Seek video"
            min={0} max={duration || 1} step="0.1" value={Math.min(time, duration || 0)} disabled={!duration}
            aria-valuetext={`${playerTime(time)} of ${duration ? playerTime(duration) : 'unknown duration'}`}
            style={{ '--level': `${played}%` } as CSSProperties}
            onChange={event => seek(Number(event.target.value))} />
          <span className="classic-player__time" aria-label="Playback time">
            {playerTime(time)} <span aria-hidden="true">/</span> {duration ? playerTime(duration) : '--:--'}
          </span>
          <button type="button" className="classic-player__button classic-player__mute" aria-label={silent ? 'Unmute' : 'Mute'}
            aria-pressed={silent} title="Mute / unmute (M)" onClick={toggleMute}><Icon kind={silent ? 'mute' : 'sound'} /></button>
          {deviceVolume ? <span className="classic-player__device-volume" title="Use your device volume buttons">Device volume</span> : (
            <input type="range" className="classic-player__range classic-player__volume" aria-label="Volume"
              min={0} max={1} step="0.05" value={muted ? 0 : volume} aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)} percent`}
              style={{ '--level': `${(muted ? 0 : volume) * 100}%` } as CSSProperties}
              onChange={event => changeVolume(Number(event.target.value))} />
          )}
          <button type="button" className="classic-player__button classic-player__fullscreen" aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title="Fullscreen (F)" onClick={() => void toggleFullscreen()}><Icon kind={fullscreen ? 'exit' : 'fullscreen'} /></button>
        </div>
      ) : null}
      <div className="classic-player__footer">
        <details className="classic-player__help">
          <summary>Keyboard shortcuts</summary>
          <p id={helpId}>Focus the video or player: Space / K play or pause; Left / Right seek 5 seconds; Home / End seek to start / end; M mute; F fullscreen; Up / Down adjust volume. On iPhone and iPad, use device volume buttons. Tab moves between controls; arrow keys adjust a focused slider.</p>
        </details>
        <button type="button" className="classic-player__fallback" onClick={() => setNativeControls(value => !value)}>
          {nativeControls ? 'Use classic controls' : 'Use device controls'}
        </button>
      </div>
      <p className="classic-player__status" role="status" aria-live="polite">{message || (waiting ? 'Buffering…' : '')}</p>
    </div>
  );
}
