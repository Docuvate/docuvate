// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type ErrorSceneId = 'offline' | 'unreachable' | 'serverFault' | 'notFound' | 'unexpected';

export interface ErrorSceneIllustrationProps {
  scene: ErrorSceneId;
  animating?: boolean;
  className?: string;
}

export function ErrorSceneIllustration({
  scene,
  animating = false,
  className = '',
}: ErrorSceneIllustrationProps) {
  const sceneClass = `error-scene-illustration--${scene}`;
  const motionClass = animating ? ' error-scene-illustration--animating' : '';

  return (
    <svg
      className={`error-scene-illustration ${sceneClass}${motionClass}${className ? ` ${className}` : ''}`.trim()}
      viewBox="0 0 480 420"
      role="img"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="error-scene-paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--error-scene-paper-top)" />
          <stop offset="100%" stopColor="var(--error-scene-paper-bottom)" />
        </linearGradient>
        <filter id="error-scene-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="var(--error-scene-shadow)" floodOpacity="0.35" />
        </filter>
      </defs>

      <g className="error-scene-float error-scene-float--a">
        <rect x="72" y="48" width="88" height="110" rx="10" fill="url(#error-scene-paper)" filter="url(#error-scene-soft-shadow)" />
        <path className="error-scene-ink" d="M88 78h56M88 96h44M88 114h52" />
      </g>
      <g className="error-scene-float error-scene-float--b">
        <rect x="300" y="62" width="76" height="96" rx="9" fill="url(#error-scene-paper)" filter="url(#error-scene-soft-shadow)" />
        <path className="error-scene-ink" d="M314 88h48M314 104h36" />
      </g>

      <g className="error-scene-character" filter="url(#error-scene-soft-shadow)">
        <rect x="168" y="118" width="144" height="188" rx="16" fill="url(#error-scene-paper)" />
        <circle className="error-scene-face" cx="216" cy="178" r="10" />
        <circle className="error-scene-face" cx="264" cy="178" r="10" />
        <path className="error-scene-mouth" d="M228 208 Q240 220 252 208" />
        <path className="error-scene-ink" d="M192 248h96M192 268h72M192 288h84" />
        <rect className="error-scene-tab" x="228" y="118" width="24" height="14" rx="4" />
      </g>

      {scene === 'unreachable' || scene === 'serverFault' ? (
        <g className="error-scene-cable">
          <path className="error-scene-cable-wire error-scene-cable-wire--left" d="M120 300 C150 300, 155 285, 168 285" />
          <path className="error-scene-cable-wire error-scene-cable-wire--right" d="M312 285 C325 285, 330 300, 360 300" />
          <rect className="error-scene-plug" x="348" y="288" width="28" height="22" rx="6" />
          <path className="error-scene-plug-pin" d="M356 310v10M364 310v10M372 310v10" />
          <g className="error-scene-spark">
            <path d="M238 278 L246 294 M246 278 L238 294" />
          </g>
        </g>
      ) : null}

      {scene === 'offline' ? (
        <g className="error-scene-offline-badge">
          <path d="M240 56 L280 96 L240 136 L200 96 Z" className="error-scene-offline-cloud" />
          <path className="error-scene-offline-slash" d="M218 88 L262 104" />
        </g>
      ) : null}

      {scene === 'serverFault' ? (
        <g className="error-scene-server-puff">
          <circle cx="352" cy="120" r="22" className="error-scene-puff" />
          <path className="error-scene-gear" d="M352 108v8M344 120h16M352 132v-8" />
        </g>
      ) : null}

      {scene === 'notFound' ? (
        <g className="error-scene-magnifier">
          <circle cx="118" cy="300" r="34" className="error-scene-magnifier-lens" />
          <path className="error-scene-magnifier-handle" d="M142 324 L168 352" />
          <text x="118" y="308" textAnchor="middle" className="error-scene-magnifier-q">?</text>
        </g>
      ) : null}

      {scene === 'unexpected' ? (
        <g className="error-scene-unexpected">
          <path className="error-scene-zig" d="M100 320 L120 300 L140 320 L160 300" />
        </g>
      ) : null}
    </svg>
  );
}
