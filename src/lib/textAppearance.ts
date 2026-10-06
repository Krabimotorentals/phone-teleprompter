import type { CSSProperties } from 'react';
import type { AppSettings, FontFamilyId, TextRotation } from './types';

export const FONT_OPTIONS: {
  id: FontFamilyId;
  label: string;
  stack: string;
}[] = [
  {
    id: 'system',
    label: 'System Default',
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  { id: 'roboto', label: 'Roboto', stack: '"Roboto", system-ui, sans-serif' },
  {
    id: 'open-sans',
    label: 'Open Sans',
    stack: '"Open Sans", system-ui, sans-serif',
  },
  { id: 'lato', label: 'Lato', stack: '"Lato", system-ui, sans-serif' },
  { id: 'inter', label: 'Inter', stack: '"Inter", system-ui, sans-serif' },
  {
    id: 'georgia',
    label: 'Georgia',
    stack: 'Georgia, "Times New Roman", serif',
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    stack: '"Merriweather", Georgia, serif',
  },
  {
    id: 'arial',
    label: 'Arial',
    stack: 'Arial, Helvetica, sans-serif',
  },
  {
    id: 'verdana',
    label: 'Verdana',
    stack: 'Verdana, Geneva, sans-serif',
  },
  {
    id: 'times',
    label: 'Times New Roman',
    stack: '"Times New Roman", Times, serif',
  },
];

export function fontStackFor(id: FontFamilyId): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.stack ?? FONT_OPTIONS[0].stack;
}

export function buildTextTransform(
  mirror: boolean,
  rotation: TextRotation,
): string | undefined {
  const parts: string[] = [];
  if (rotation !== 0) parts.push(`rotate(${rotation}deg)`);
  if (mirror) parts.push('scaleX(-1)');
  return parts.length ? parts.join(' ') : undefined;
}

export function getScriptTypographyStyle(
  settings: AppSettings,
): CSSProperties {
  return {
    fontSize: `${settings.fontSize}px`,
    color: settings.fontColor,
    lineHeight: settings.lineHeight,
    textAlign: settings.textAlignment,
    width: `${settings.textWidthPercent}%`,
    fontFamily: fontStackFor(settings.fontFamily),
    transform: buildTextTransform(settings.mirror, settings.textRotation),
  };
}

export function isRotatedSideways(rotation: TextRotation): boolean {
  return rotation === 90 || rotation === -90;
}
