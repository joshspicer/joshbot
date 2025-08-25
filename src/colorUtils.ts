/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Represents a color in different formats
 */
export interface Color {
	hex: string;
	rgb: { r: number; g: number; b: number };
	hsl: { h: number; s: number; l: number };
	hsv: { h: number; s: number; v: number };
}

/**
 * Converts a hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

/**
 * Converts RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Converts RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0, s = 0;
	const l = (max + min) / 2;

	if (max === min) {
		h = s = 0; // achromatic
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100)
	};
}

/**
 * Converts HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
	h /= 360;
	s /= 100;
	l /= 100;

	const hue2rgb = (p: number, q: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1/6) return p + (q - p) * 6 * t;
		if (t < 1/2) return q;
		if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		return p;
	};

	let r, g, b;

	if (s === 0) {
		r = g = b = l; // achromatic
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255)
	};
}

/**
 * Converts RGB to HSV
 */
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	const v = max;
	const d = max - min;
	const s = max === 0 ? 0 : d / max;

	if (max === min) {
		h = 0; // achromatic
	} else {
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		v: Math.round(v * 100)
	};
}

/**
 * Converts HSV to RGB
 */
export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
	h /= 360;
	s /= 100;
	v /= 100;

	const c = v * s;
	const x = c * (1 - Math.abs((h * 6) % 2 - 1));
	const m = v - c;

	let r = 0, g = 0, b = 0;

	if (0 <= h && h < 1/6) {
		r = c; g = x; b = 0;
	} else if (1/6 <= h && h < 2/6) {
		r = x; g = c; b = 0;
	} else if (2/6 <= h && h < 3/6) {
		r = 0; g = c; b = x;
	} else if (3/6 <= h && h < 4/6) {
		r = 0; g = x; b = c;
	} else if (4/6 <= h && h < 5/6) {
		r = x; g = 0; b = c;
	} else if (5/6 <= h && h < 1) {
		r = c; g = 0; b = x;
	}

	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255)
	};
}

/**
 * Creates a complete Color object from a hex string
 */
export function createColorFromHex(hex: string): Color | null {
	const rgb = hexToRgb(hex);
	if (!rgb) return null;

	const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
	const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

	return {
		hex,
		rgb,
		hsl,
		hsv
	};
}

/**
 * Generates a random color
 */
export function generateRandomColor(): Color {
	const r = Math.floor(Math.random() * 256);
	const g = Math.floor(Math.random() * 256);
	const b = Math.floor(Math.random() * 256);
	const hex = rgbToHex(r, g, b);
	
	return createColorFromHex(hex)!;
}

/**
 * Gets the complementary color
 */
export function getComplementaryColor(color: Color): Color {
	const compR = 255 - color.rgb.r;
	const compG = 255 - color.rgb.g;
	const compB = 255 - color.rgb.b;
	const hex = rgbToHex(compR, compG, compB);
	
	return createColorFromHex(hex)!;
}

/**
 * Generates triadic color harmony
 */
export function getTriadicColors(color: Color): Color[] {
	const hsl = color.hsl;
	const color1Hue = (hsl.h + 120) % 360;
	const color2Hue = (hsl.h + 240) % 360;
	
	const rgb1 = hslToRgb(color1Hue, hsl.s, hsl.l);
	const rgb2 = hslToRgb(color2Hue, hsl.s, hsl.l);
	
	return [
		createColorFromHex(rgbToHex(rgb1.r, rgb1.g, rgb1.b))!,
		createColorFromHex(rgbToHex(rgb2.r, rgb2.g, rgb2.b))!
	];
}

/**
 * Generates analogous color harmony
 */
export function getAnalogousColors(color: Color): Color[] {
	const hsl = color.hsl;
	const colors: Color[] = [];
	
	for (let i = -30; i <= 30; i += 15) {
		if (i === 0) continue; // skip the original color
		const hue = (hsl.h + i + 360) % 360;
		const rgb = hslToRgb(hue, hsl.s, hsl.l);
		colors.push(createColorFromHex(rgbToHex(rgb.r, rgb.g, rgb.b))!);
	}
	
	return colors;
}

/**
 * Calculates contrast ratio between two colors
 */
export function getContrastRatio(color1: Color, color2: Color): number {
	const getLuminance = (rgb: { r: number; g: number; b: number }) => {
		const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
			c = c / 255;
			return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
		});
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};

	const lum1 = getLuminance(color1.rgb);
	const lum2 = getLuminance(color2.rgb);
	const brightest = Math.max(lum1, lum2);
	const darkest = Math.min(lum1, lum2);

	return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Checks if colors meet WCAG accessibility standards
 */
export function checkAccessibility(color1: Color, color2: Color): {
	ratio: number;
	aa: boolean;
	aaa: boolean;
} {
	const ratio = getContrastRatio(color1, color2);
	
	return {
		ratio,
		aa: ratio >= 4.5,
		aaa: ratio >= 7
	};
}

/**
 * Predefined color palette
 */
export const DEFAULT_COLOR_PALETTE: Color[] = [
	createColorFromHex('#FF0000')!, // Red
	createColorFromHex('#00FF00')!, // Green
	createColorFromHex('#0000FF')!, // Blue
	createColorFromHex('#FFFF00')!, // Yellow
	createColorFromHex('#FF00FF')!, // Magenta
	createColorFromHex('#00FFFF')!, // Cyan
	createColorFromHex('#FFA500')!, // Orange
	createColorFromHex('#800080')!, // Purple
	createColorFromHex('#FFC0CB')!, // Pink
	createColorFromHex('#A52A2A')!, // Brown
	createColorFromHex('#808080')!, // Gray
	createColorFromHex('#000000')!, // Black
	createColorFromHex('#FFFFFF')!, // White
];

/**
 * Formats a color according to the specified format
 */
export function formatColor(color: Color, format: 'hex' | 'rgb' | 'hsl' | 'hsv'): string {
	switch (format) {
		case 'hex':
			return color.hex;
		case 'rgb':
			return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
		case 'hsl':
			return `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;
		case 'hsv':
			return `hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)`;
		default:
			return color.hex;
	}
}