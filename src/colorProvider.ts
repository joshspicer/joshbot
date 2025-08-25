/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { createColorFromHex, formatColor, Color } from './colorUtils';

/**
 * Provides hover information for color values in text
 */
export class ColorHoverProvider implements vscode.HoverProvider {
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Hover> {
		const range = document.getWordRangeAtPosition(position, /#[0-9A-Fa-f]{6}\b/);
		if (!range) {
			return null;
		}

		const word = document.getText(range);
		const color = createColorFromHex(word);
		
		if (!color) {
			return null;
		}

		const config = vscode.workspace.getConfiguration('joshbot');
		const enableColorPreview = config.get<boolean>('enableColorPreview', true);
		
		if (!enableColorPreview) {
			return null;
		}

		const markdownString = new vscode.MarkdownString();
		markdownString.isTrusted = true;
		
		// Create a colored square preview
		const colorPreview = `<span style="display: inline-block; width: 20px; height: 20px; background-color: ${color.hex}; border: 1px solid #ccc; margin-right: 8px; vertical-align: middle;"></span>`;
		
		markdownString.appendMarkdown(`${colorPreview}**Color Preview**\n\n`);
		markdownString.appendMarkdown(`**Hex**: ${color.hex}\n\n`);
		markdownString.appendMarkdown(`**RGB**: rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})\n\n`);
		markdownString.appendMarkdown(`**HSL**: hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)\n\n`);
		markdownString.appendMarkdown(`**HSV**: hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)`);

		return new vscode.Hover(markdownString, range);
	}
}

/**
 * Provides color-related completions
 */
export class ColorCompletionProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
		const linePrefix = document.lineAt(position).text.slice(0, position.character);
		
		// Check if we're typing a color value
		if (!linePrefix.endsWith('#')) {
			return undefined;
		}

		const completions: vscode.CompletionItem[] = [];

		// Common colors
		const commonColors = [
			{ name: 'Red', hex: '#FF0000' },
			{ name: 'Green', hex: '#00FF00' },
			{ name: 'Blue', hex: '#0000FF' },
			{ name: 'Yellow', hex: '#FFFF00' },
			{ name: 'Magenta', hex: '#FF00FF' },
			{ name: 'Cyan', hex: '#00FFFF' },
			{ name: 'Orange', hex: '#FFA500' },
			{ name: 'Purple', hex: '#800080' },
			{ name: 'Pink', hex: '#FFC0CB' },
			{ name: 'Brown', hex: '#A52A2A' },
			{ name: 'Gray', hex: '#808080' },
			{ name: 'Black', hex: '#000000' },
			{ name: 'White', hex: '#FFFFFF' },
		];

		commonColors.forEach(color => {
			const item = new vscode.CompletionItem(color.hex, vscode.CompletionItemKind.Color);
			item.label = `${color.hex} (${color.name})`;
			item.insertText = color.hex.slice(1); // Remove the # since it's already typed
			item.documentation = new vscode.MarkdownString(`Color: ${color.name}\n\nHex: ${color.hex}`);
			item.sortText = `0${color.name}`; // Ensure they appear at the top
			completions.push(item);
		});

		return completions;
	}
}

/**
 * Provides document color information for VS Code's built-in color picker
 */
export class ColorDocumentColorProvider implements vscode.DocumentColorProvider {
	provideDocumentColors(
		document: vscode.TextDocument,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.ColorInformation[]> {
		const colors: vscode.ColorInformation[] = [];
		const text = document.getText();
		const hexColorRegex = /#[0-9A-Fa-f]{6}\b/g;
		
		let match;
		while ((match = hexColorRegex.exec(text)) !== null) {
			const color = createColorFromHex(match[0]);
			if (color) {
				const startPos = document.positionAt(match.index);
				const endPos = document.positionAt(match.index + match[0].length);
				const range = new vscode.Range(startPos, endPos);
				
				const vscodeColor = new vscode.Color(
					color.rgb.r / 255,
					color.rgb.g / 255,
					color.rgb.b / 255,
					1
				);
				
				colors.push(new vscode.ColorInformation(range, vscodeColor));
			}
		}
		
		return colors;
	}

	provideColorPresentations(
		color: vscode.Color,
		context: { document: vscode.TextDocument; range: vscode.Range },
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.ColorPresentation[]> {
		const r = Math.round(color.red * 255);
		const g = Math.round(color.green * 255);
		const b = Math.round(color.blue * 255);
		
		const colorObj = createColorFromHex(`#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`);
		
		if (!colorObj) {
			return [];
		}

		const presentations: vscode.ColorPresentation[] = [];

		// Hex format
		presentations.push(new vscode.ColorPresentation(colorObj.hex.toUpperCase()));
		presentations.push(new vscode.ColorPresentation(colorObj.hex.toLowerCase()));

		// RGB format
		presentations.push(new vscode.ColorPresentation(`rgb(${r}, ${g}, ${b})`));

		// HSL format
		presentations.push(new vscode.ColorPresentation(formatColor(colorObj, 'hsl')));

		return presentations;
	}
}

/**
 * Registers all color-related providers
 */
export function registerColorProviders(context: vscode.ExtensionContext): void {
	// Register hover provider for hex colors
	const hoverProvider = vscode.languages.registerHoverProvider(
		'*', // All file types
		new ColorHoverProvider()
	);

	// Register completion provider for colors
	const completionProvider = vscode.languages.registerCompletionItemProvider(
		'*', // All file types
		new ColorCompletionProvider(),
		'#' // Trigger character
	);

	// Register document color provider for VS Code's built-in color picker
	const colorProvider = vscode.languages.registerColorProvider(
		'*', // All file types
		new ColorDocumentColorProvider()
	);

	context.subscriptions.push(hoverProvider, completionProvider, colorProvider);
}