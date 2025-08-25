/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { ColorUtils } from './colorUtils';

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
    primaryColor: string;
    accentColor: string;
    enableColorfulResponses: boolean;
    statusBarColor: 'auto' | 'primary' | 'accent';
    highContrast: boolean;
}

/**
 * Manages colors and theming for JoshBot extension
 */
export class ThemeManager {
    private static instance: ThemeManager;
    private _config: ThemeConfig;
    private _isLightTheme: boolean = true;

    private constructor() {
        this._config = this.loadConfig();
        this._isLightTheme = this.detectVSCodeTheme();
        
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(this.onConfigurationChanged, this);
        
        // Listen for color theme changes
        vscode.window.onDidChangeActiveColorTheme(this.onThemeChanged, this);
    }

    static getInstance(): ThemeManager {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }

    /**
     * Load configuration from VS Code settings
     */
    private loadConfig(): ThemeConfig {
        const config = vscode.workspace.getConfiguration('joshbot');
        return {
            primaryColor: config.get('theme.primaryColor', '#007ACC'),
            accentColor: config.get('theme.accentColor', '#FF6B6B'),
            enableColorfulResponses: config.get('theme.enableColorfulResponses', true),
            statusBarColor: config.get('theme.statusBarColor', 'auto'),
            highContrast: config.get('accessibility.highContrast', false)
        };
    }

    /**
     * Detect if VS Code is using a light or dark theme
     */
    private detectVSCodeTheme(): boolean {
        const currentTheme = vscode.window.activeColorTheme;
        return currentTheme.kind === vscode.ColorThemeKind.Light || 
               currentTheme.kind === vscode.ColorThemeKind.HighContrastLight;
    }

    /**
     * Handle configuration changes
     */
    private onConfigurationChanged(event: vscode.ConfigurationChangeEvent): void {
        if (event.affectsConfiguration('joshbot.theme') || event.affectsConfiguration('joshbot.accessibility')) {
            this._config = this.loadConfig();
        }
    }

    /**
     * Handle theme changes
     */
    private onThemeChanged(theme: vscode.ColorTheme): void {
        this._isLightTheme = theme.kind === vscode.ColorThemeKind.Light || 
                            theme.kind === vscode.ColorThemeKind.HighContrastLight;
    }

    /**
     * Get current theme configuration
     */
    get config(): ThemeConfig {
        return { ...this._config };
    }

    /**
     * Check if currently using light theme
     */
    get isLightTheme(): boolean {
        return this._isLightTheme;
    }

    /**
     * Get the primary color adjusted for current theme
     */
    getPrimaryColor(): string {
        if (this._config.highContrast) {
            return this._isLightTheme ? '#000000' : '#FFFFFF';
        }
        return this._config.primaryColor;
    }

    /**
     * Get the accent color adjusted for current theme
     */
    getAccentColor(): string {
        if (this._config.highContrast) {
            return this._isLightTheme ? '#000000' : '#FFFFFF';
        }
        return this._config.accentColor;
    }

    /**
     * Get status bar color based on configuration
     */
    getStatusBarColor(): string {
        if (this._config.highContrast) {
            return this._isLightTheme ? '#000000' : '#FFFFFF';
        }

        switch (this._config.statusBarColor) {
            case 'primary':
                return this._config.primaryColor;
            case 'accent':
                return this._config.accentColor;
            case 'auto':
            default:
                return this._isLightTheme ? '#0066CC' : '#4FC3F7';
        }
    }

    /**
     * Create themed markdown with colors
     */
    createThemedMarkdown(content: string, useColors: boolean = true): string {
        if (!this._config.enableColorfulResponses || !useColors) {
            return content;
        }

        // Add theme-appropriate styling
        const primaryColor = this.getPrimaryColor();
        const accentColor = this.getAccentColor();
        
        return content
            .replace(/\*\*(.*?)\*\*/g, `<span style="color: ${primaryColor}; font-weight: bold;">$1</span>`)
            .replace(/\*(.*?)\*/g, `<span style="color: ${accentColor}; font-style: italic;">$1</span>`);
    }

    /**
     * Get icon path for light/dark theme variants
     */
    getThemedIconPath(context: vscode.ExtensionContext, iconName: string): vscode.Uri | { light: vscode.Uri; dark: vscode.Uri } {
        const lightPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'icons', 'light', `${iconName}.svg`);
        const darkPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'icons', 'dark', `${iconName}.svg`);
        
        return { light: lightPath, dark: darkPath };
    }

    /**
     * Get seasonal theme colors based on current date
     */
    getSeasonalColors(): { primary: string; accent: string } {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        
        // Spring (March-May)
        if (month >= 3 && month <= 5) {
            return { primary: '#4CAF50', accent: '#8BC34A' };
        }
        // Summer (June-August)
        else if (month >= 6 && month <= 8) {
            return { primary: '#FF9800', accent: '#FFC107' };
        }
        // Fall/Autumn (September-November)
        else if (month >= 9 && month <= 11) {
            return { primary: '#FF5722', accent: '#E91E63' };
        }
        // Winter (December-February)
        else {
            return { primary: '#2196F3', accent: '#00BCD4' };
        }
    }

    /**
     * Apply seasonal theme
     */
    async applySeasonalTheme(): Promise<void> {
        const seasonalColors = this.getSeasonalColors();
        const config = vscode.workspace.getConfiguration('joshbot');
        
        await config.update('theme.primaryColor', seasonalColors.primary, vscode.ConfigurationTarget.Global);
        await config.update('theme.accentColor', seasonalColors.accent, vscode.ConfigurationTarget.Global);
    }

    /**
     * Preset color schemes
     */
    static readonly PRESET_THEMES = {
        'Ocean Blue': { primary: '#0277BD', accent: '#0288D1' },
        'Sunset Orange': { primary: '#FF6D00', accent: '#FF8F00' },
        'Forest Green': { primary: '#2E7D32', accent: '#388E3C' },
        'Purple Galaxy': { primary: '#7B1FA2', accent: '#8E24AA' },
        'Cherry Blossom': { primary: '#C2185B', accent: '#E91E63' },
        'Midnight Dark': { primary: '#37474F', accent: '#455A64' }
    } as const;

    /**
     * Apply a preset theme
     */
    async applyPresetTheme(themeName: keyof typeof ThemeManager.PRESET_THEMES): Promise<void> {
        const theme = ThemeManager.PRESET_THEMES[themeName];
        if (!theme) return;

        const config = vscode.workspace.getConfiguration('joshbot');
        await config.update('theme.primaryColor', theme.primary, vscode.ConfigurationTarget.Global);
        await config.update('theme.accentColor', theme.accent, vscode.ConfigurationTarget.Global);
    }
}