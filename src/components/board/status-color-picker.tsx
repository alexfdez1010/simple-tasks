'use client';

import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  Label,
  parseColor,
} from '@heroui/react';

interface StatusColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const COLOR_PRESETS = [
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
] as const;

/**
 * Renders the controlled HeroUI workflow-colour editor.
 *
 * @param props - Current hex colour and normalized change callback.
 * @returns A swatch trigger with presets, colour area, hue slider, and hex field.
 */
export function StatusColorPicker({ value, onChange }: StatusColorPickerProps) {
  return (
    <ColorPicker
      value={parseColor(value)}
      onChange={(color) => onChange(color.toString('hex').toUpperCase())}
    >
      <ColorPicker.Trigger className="w-full justify-start">
        <ColorSwatch size="sm" />
        <Label>Color</Label>
        <span className="ms-auto font-mono text-xs text-muted">{value}</span>
      </ColorPicker.Trigger>
      <ColorPicker.Popover className="gap-3">
        <ColorSwatchPicker className="justify-center" size="xs">
          {COLOR_PRESETS.map((preset) => (
            <ColorSwatchPicker.Item key={preset} color={preset}>
              <ColorSwatchPicker.Swatch />
            </ColorSwatchPicker.Item>
          ))}
        </ColorSwatchPicker>
        <ColorArea
          aria-label="Color area"
          className="max-w-full"
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
        >
          <ColorArea.Thumb />
        </ColorArea>
        <ColorSlider aria-label="Hue" channel="hue" colorSpace="hsb">
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
        <ColorField aria-label="Hex color">
          <ColorField.Group variant="secondary">
            <ColorField.Prefix>
              <ColorSwatch size="xs" />
            </ColorField.Prefix>
            <ColorField.Input />
          </ColorField.Group>
        </ColorField>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}
