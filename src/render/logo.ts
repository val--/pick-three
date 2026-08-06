/**
 * Pick Three logo: a plectrum carrying the three triad dots — third and
 * fifth on the shoulders, root at the tip (the root is the lowest note).
 * Same colors as the diagrams: the logo IS the method.
 */
import { DEGREE_COLORS } from './svg.js';

const INK = '#2c3e50';

/** The pick mark alone. `withLabels` is disabled at small sizes (favicon). */
export function pickMark(size: number, { withLabels = size >= 40 } = {}): string {
  const dot = (cx: number, cy: number, color: string, label: string) =>
    `<circle cx="${cx}" cy="${cy}" r="14.5" fill="${color}"/>` +
    (withLabels
      ? `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" ` +
        `fill="#fff" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="700">${label}</text>`
      : '');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.16)}" viewBox="0 0 100 116" role="img" aria-label="Pick Three">
    <path d="M50 112 C22 88 6 58 6 33 C6 10 26 3 50 3 C74 3 94 10 94 33 C94 58 78 88 50 112 Z" fill="${INK}"/>
    ${dot(29, 31, DEGREE_COLORS.third, '3')}
    ${dot(71, 31, DEGREE_COLORS.fifth, '5')}
    ${dot(50, 76, DEGREE_COLORS.root, 'R')}
  </svg>`;
}

/** Favicon as a data URI (SVG, no labels). */
export function faviconDataUri(): string {
  return `data:image/svg+xml,${encodeURIComponent(pickMark(32, { withLabels: false }))}`;
}
