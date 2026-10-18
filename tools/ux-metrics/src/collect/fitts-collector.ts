import type { Locator } from 'playwright';
import { fittsSegment, sumFittsSegments } from '../metrics/fitts.js';
import type { Box, FittsTaskResult, ViewportLabel } from '../metrics/types.js';

export class FittsCollector {
  private last: Box | null = null;
  private lastHint = 'pointer-origin';
  private segments: ReturnType<typeof fittsSegment>[] = [];

  constructor(private readonly initial: Box) {
    this.last = initial;
  }

  static initialPointer(viewportWidth: number, viewportHeight: number): Box {
    return {
      x: viewportWidth / 2 - 1,
      y: viewportHeight / 2 - 1,
      width: 2,
      height: 2,
    };
  }

  recordTarget(box: Box, hint: string): void {
    if (!this.last) {
      this.last = box;
      this.lastHint = hint;
      return;
    }
    this.segments.push(fittsSegment(this.last, box, this.lastHint, hint));
    this.last = box;
    this.lastHint = hint;
  }

  async recordLocator(locator: Locator, hint?: string): Promise<void> {
    await locator.scrollIntoViewIfNeeded().catch(() => undefined);
    const result = await locator
      .evaluate((el) => {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) {
          return null;
        }
        const label =
          el.getAttribute('data-ux') ??
          el.getAttribute('aria-label') ??
          el.textContent?.trim()?.slice(0, 60) ??
          el.tagName.toLowerCase();
        return {
          box: { x: r.x, y: r.y, width: r.width, height: r.height },
          label,
        };
      })
      .catch(() => null);
    if (result) {
      this.recordTarget(result.box, hint ?? result.label);
    }
  }

  finish(taskId: string, label: string, viewport: ViewportLabel): FittsTaskResult {
    const totals = sumFittsSegments(this.segments);
    return {
      taskId,
      label,
      viewport,
      segments: this.segments,
      ...totals,
    };
  }
}
