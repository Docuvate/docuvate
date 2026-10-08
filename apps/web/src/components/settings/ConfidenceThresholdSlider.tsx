import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

/** API scale: 0–1 confidence; slider matches historical preset range. */
const CONFIDENCE_THRESHOLD_MIN = 0.55;
const CONFIDENCE_THRESHOLD_MAX = 0.9;
const CONFIDENCE_THRESHOLD_STEP = 0.01;

const SEGMENT_IDS = ['early', 'standard', 'cautious', 'verySure'] as const;

const ZONES = [
  {
    id: 'early',
    zoneKey: 'recognizedFields.gateBreakpointLabelEarly',
    fromPercent: 55,
    toPercent: 62,
  },
  {
    id: 'standard',
    zoneKey: 'recognizedFields.gateBreakpointLabelStandard',
    fromPercent: 62,
    toPercent: 72,
  },
  {
    id: 'cautious',
    zoneKey: 'recognizedFields.gateBreakpointLabelCautious',
    fromPercent: 72,
    toPercent: 85,
  },
  {
    id: 'verySure',
    zoneKey: 'recognizedFields.gateBreakpointLabelVerySure',
    fromPercent: 85,
    toPercent: 90,
  },
] as const;

/** Boundary tick values only (no duplicate zone captions). */
const BOUNDARY_VALUES = [0.55, 0.62, 0.72, 0.85, 0.9] as const;

const SEGMENT_TOKEN_VARS = [
  'var(--dv-color-chart-1)',
  'var(--dv-color-chart-2)',
  'var(--dv-color-chart-3)',
  'var(--dv-color-chart-4)',
] as const;

const MIN_TICK_GAP_PX = 24;

function clampThreshold(value: number): number {
  return Math.min(CONFIDENCE_THRESHOLD_MAX, Math.max(CONFIDENCE_THRESHOLD_MIN, value));
}

function valueToPercent(value: number): number {
  const clamped = clampThreshold(value);
  return (
    ((clamped - CONFIDENCE_THRESHOLD_MIN) / (CONFIDENCE_THRESHOLD_MAX - CONFIDENCE_THRESHOLD_MIN)) *
    100
  );
}

function activeSegmentIndex(value: number): number {
  const v = clampThreshold(value);
  if (v < 0.62) return 0;
  if (v < 0.72) return 1;
  if (v < 0.85) return 2;
  return 3;
}

function zoneKeyForValue(value: number): (typeof ZONES)[number]['zoneKey'] {
  const idx = activeSegmentIndex(value);
  return ZONES[idx]?.zoneKey ?? ZONES[0].zoneKey;
}

interface ConfidenceThresholdSliderProps {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  labelId?: string;
  ariaLabel: string;
}

export function ConfidenceThresholdSlider({
  value,
  disabled = false,
  onChange,
  labelId,
  ariaLabel,
}: ConfidenceThresholdSliderProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const ticksRef = useRef<HTMLDivElement>(null);
  const [hideMaxBoundaryTick, setHideMaxBoundaryTick] = useState(false);
  const clamped = clampThreshold(value);
  const fillPercent = valueToPercent(clamped);
  const activeSegment = activeSegmentIndex(clamped);
  const activeColor = SEGMENT_TOKEN_VARS[activeSegment];
  const zoneLabel = t(zoneKeyForValue(clamped));
  const activeZone = ZONES[activeSegment] ?? ZONES[0];

  const segmentFlex = useMemo(() => {
    const span = CONFIDENCE_THRESHOLD_MAX - CONFIDENCE_THRESHOLD_MIN;
    return [
      (0.62 - CONFIDENCE_THRESHOLD_MIN) / span,
      (0.72 - 0.62) / span,
      (0.85 - 0.72) / span,
      (CONFIDENCE_THRESHOLD_MAX - 0.85) / span,
    ];
  }, []);

  useLayoutEffect(() => {
    const ticksEl = ticksRef.current;
    if (!ticksEl) {
      return undefined;
    }
    function measure() {
      const node = ticksRef.current;
      if (!node) {
        return;
      }
      const width = node.clientWidth;
      if (width <= 0) {
        return;
      }
      const span = CONFIDENCE_THRESHOLD_MAX - CONFIDENCE_THRESHOLD_MIN;
      const gapPx = ((CONFIDENCE_THRESHOLD_MAX - 0.85) / span) * width;
      setHideMaxBoundaryTick(gapPx < MIN_TICK_GAP_PX);
    }
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(ticksEl);
    return () => observer.disconnect();
  }, []);

  const ariaValueText = t('recognizedFields.gateConfidenceAriaValue', {
    percent: Math.round(clamped * 100),
    zone: zoneLabel,
  });

  function formatRange(fromPercent: number, toPercent: number): string {
    return t('recognizedFields.gateZoneRangePercent', { from: fromPercent, to: toPercent });
  }

  return (
    <div className="confidence-threshold-slider">
      <div className="confidence-threshold-slider__header">
        <output htmlFor={inputId} className="confidence-threshold-slider__value">
          {t('recognizedFields.gateConfidenceCurrent', { percent: Math.round(clamped * 100) })}
        </output>
        <span className="confidence-threshold-slider__zone muted">{zoneLabel}</span>
      </div>

      <div
        className="confidence-threshold-slider__track-wrap"
        style={
          {
            '--confidence-fill': `${fillPercent}%`,
            '--confidence-thumb': activeColor,
          } as CSSProperties
        }
      >
        <div className="confidence-threshold-slider__segments" aria-hidden="true">
          {SEGMENT_IDS.map((id, index) => (
            <div
              key={id}
              className={`confidence-threshold-slider__segment${
                index === activeSegment ? ' confidence-threshold-slider__segment--active' : ''
              }`}
              style={{
                flex: segmentFlex[index],
                backgroundColor: SEGMENT_TOKEN_VARS[index],
              }}
            />
          ))}
        </div>
        <div className="confidence-threshold-slider__fill-mask" aria-hidden="true" />
        <input
          id={inputId}
          type="range"
          className="confidence-threshold-slider__input"
          min={CONFIDENCE_THRESHOLD_MIN}
          max={CONFIDENCE_THRESHOLD_MAX}
          step={CONFIDENCE_THRESHOLD_STEP}
          value={clamped}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-labelledby={labelId}
          aria-valuemin={CONFIDENCE_THRESHOLD_MIN}
          aria-valuemax={CONFIDENCE_THRESHOLD_MAX}
          aria-valuenow={clamped}
          aria-valuetext={ariaValueText}
          onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        />
      </div>

      <div className="confidence-threshold-slider__scale" aria-hidden="true">
        <div ref={ticksRef} className="confidence-threshold-slider__ticks">
          {BOUNDARY_VALUES.map((bp, index) => {
            const isMin = index === 0;
            const isMax = index === BOUNDARY_VALUES.length - 1;
            if (isMax && hideMaxBoundaryTick) {
              return null;
            }
            const isMid = !isMin && !isMax;
            return (
              <span
                key={bp}
                className={`confidence-threshold-slider__tick${
                  isMid ? ' confidence-threshold-slider__tick--mid' : ''
                }`}
                style={{ left: `${valueToPercent(bp)}%` }}
              >
                {Math.round(bp * 100)}
              </span>
            );
          })}
        </div>
      </div>

      <ul className="confidence-threshold-slider__legend">
        {ZONES.map((zone, index) => (
          <li
            key={zone.id}
            className={`confidence-threshold-slider__legend-row${
              index === activeSegment ? ' confidence-threshold-slider__legend-row--active' : ''
            }`}
          >
            <span
              className="confidence-threshold-slider__legend-swatch"
              style={{ backgroundColor: SEGMENT_TOKEN_VARS[index] }}
            />
            <span className="confidence-threshold-slider__legend-name">{t(zone.zoneKey)}</span>
            <span className="confidence-threshold-slider__legend-range muted">
              {formatRange(zone.fromPercent, zone.toPercent)}
            </span>
          </li>
        ))}
      </ul>

      <p className="confidence-threshold-slider__legend-compact muted">
        <span
          className="confidence-threshold-slider__legend-swatch"
          style={{ backgroundColor: activeColor }}
          aria-hidden
        />
        <span className="confidence-threshold-slider__legend-compact-text">
          {t(activeZone.zoneKey)} · {formatRange(activeZone.fromPercent, activeZone.toPercent)}
        </span>
      </p>
    </div>
  );
}
