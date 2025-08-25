/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Color utility functions for JoshBot extension
 */
export class ColorUtils {
    
    /**
     * Validates if a string is a valid hex color
     */
    static isValidHexColor(color: string): boolean {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }

    /**
     * Converts hex color to RGB values
     */
    static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        if (!this.isValidHexColor(hex)) {
            return null;
        }
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Gets the luminance of a color to determine if it's light or dark
     */
    static getLuminance(hex: string): number {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return 0;
        
        const { r, g, b } = rgb;
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    /**
     * Determines if a color is light (returns true) or dark (returns false)
     */
    static isLightColor(hex: string): boolean {
        return this.getLuminance(hex) > 0.5;
    }

    /**
     * Gets a contrasting color (black or white) for the given color
     */
    static getContrastColor(hex: string): string {
        return this.isLightColor(hex) ? '#000000' : '#FFFFFF';
    }

    /**
     * Status color constants for consistent theming
     */
    static readonly StatusColors = {
        SUCCESS: '#22863a',
        WARNING: '#f9c513',
        ERROR: '#d73a49',
        INFO: '#0366d6',
        NEUTRAL: '#6a737d'
    } as const;

    /**
     * Gets an appropriate status color with markdown formatting
     */
    static getStatusColorMarkdown(status: 'success' | 'warning' | 'error' | 'info' | 'neutral', text: string): string {
        const colors = this.StatusColors;
        let color: string;
        let icon: string;

        switch (status) {
            case 'success':
                color = colors.SUCCESS;
                icon = '✅';
                break;
            case 'warning':
                color = colors.WARNING;
                icon = '⚠️';
                break;
            case 'error':
                color = colors.ERROR;
                icon = '❌';
                break;
            case 'info':
                color = colors.INFO;
                icon = 'ℹ️';
                break;
            default:
                color = colors.NEUTRAL;
                icon = '💬';
        }

        return `<span style="color: ${color};">${icon} ${text}</span>`;
    }

    /**
     * Generates rainbow text for special effects
     */
    static rainbowText(text: string): string {
        const colors = ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080'];
        const chars = text.split('');
        
        return chars.map((char, index) => {
            if (char === ' ') return char;
            const color = colors[index % colors.length];
            return `<span style="color: ${color};">${char}</span>`;
        }).join('');
    }

    /**
     * Creates a color palette display as markdown
     */
    static createColorPalette(colors: string[]): string {
        return colors.map(color => {
            const isValid = this.isValidHexColor(color);
            const display = isValid ? `<span style="background-color: ${color}; color: ${this.getContrastColor(color)}; padding: 2px 8px; border-radius: 3px;">${color}</span>` : color;
            return `- ${display}`;
        }).join('\n');
    }
}