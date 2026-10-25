// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

import { buildErrorSceneSrcSet, errorSceneFallbackSrc } from './errorSceneImages';
import type { ErrorSceneId } from './errorSceneManifest.generated';
import { ERROR_SCENE_MANIFEST } from './errorSceneManifest.generated';

export type { ErrorSceneId };

export interface ErrorSceneIllustrationProps {
  scene: ErrorSceneId;
  animating?: boolean;
  className?: string;
}

const MASCOT_SIZES = '(max-width: 40rem) 92vw, (max-width: 72rem) 50vw, 28rem';

export function ErrorSceneIllustration({
  scene,
  animating = false,
  className = '',
}: ErrorSceneIllustrationProps) {
  const { t } = useTranslation();
  const { width, height } = ERROR_SCENE_MANIFEST[scene];
  const alt = t(`errors.pages.scene.${scene}.imageAlt`);
  const motionClass = animating ? ' error-scene-mascot--animating' : '';
  const rootClass = `error-scene-mascot error-scene-mascot--${scene}${motionClass}${className ? ` ${className}` : ''}`.trim();

  return (
    <div className={rootClass}>
      <picture className="error-scene-mascot__picture error-scene-mascot__picture--light">
        <source type="image/avif" srcSet={buildErrorSceneSrcSet(scene, 'light', 'avif')} sizes={MASCOT_SIZES} />
        <source type="image/webp" srcSet={buildErrorSceneSrcSet(scene, 'light', 'webp')} sizes={MASCOT_SIZES} />
        <img
          alt={alt}
          className="error-scene-mascot__img"
          decoding="async"
          height={height}
          loading="lazy"
          sizes={MASCOT_SIZES}
          src={errorSceneFallbackSrc(scene, 'light')}
          width={width}
        />
      </picture>
      <picture className="error-scene-mascot__picture error-scene-mascot__picture--dark">
        <source type="image/avif" srcSet={buildErrorSceneSrcSet(scene, 'dark', 'avif')} sizes={MASCOT_SIZES} />
        <source type="image/webp" srcSet={buildErrorSceneSrcSet(scene, 'dark', 'webp')} sizes={MASCOT_SIZES} />
        <img
          alt={alt}
          className="error-scene-mascot__img"
          decoding="async"
          height={height}
          loading="lazy"
          sizes={MASCOT_SIZES}
          src={errorSceneFallbackSrc(scene, 'dark')}
          width={width}
        />
      </picture>
    </div>
  );
}
