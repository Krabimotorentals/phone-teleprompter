const READING_LINE_RATIO = 0.38;

export function getReadingLineY(container: HTMLElement): number {
  return container.clientHeight * READING_LINE_RATIO;
}

/**
 * Smoothly scroll so the element sits near the reading guide line.
 */
export function scrollToTokenElement(
  container: HTMLElement,
  element: HTMLElement,
  smooth = true,
): void {
  const containerRect = container.getBoundingClientRect();
  const elRect = element.getBoundingClientRect();
  const elTopInContainer =
    elRect.top - containerRect.top + container.scrollTop;
  const targetScroll =
    elTopInContainer - getReadingLineY(container) + elRect.height / 2;

  container.scrollTo({
    top: Math.max(0, targetScroll),
    behavior: smooth ? 'smooth' : 'auto',
  });
}

export class ManualScroller {
  private rafId: number | null = null;
  private lastTime = 0;
  private running = false;

  start(
    container: HTMLElement,
    pixelsPerSecond: number,
    onTick?: () => void,
  ): void {
    this.stop();
    this.running = true;
    this.lastTime = performance.now();

    const step = (now: number) => {
      if (!this.running) return;
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      container.scrollTop += pixelsPerSecond * dt;
      onTick?.();
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  stop(): void {
    this.running = false;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
