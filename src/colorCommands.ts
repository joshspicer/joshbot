/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import {
	Color,
	createColorFromHex,
	generateRandomColor,
	DEFAULT_COLOR_PALETTE,
	formatColor,
	getComplementaryColor,
	getTriadicColors,
	getAnalogousColors,
	checkAccessibility
} from './colorUtils';

/**
 * Opens a color picker dialog and shows the selected color
 */
export async function pickColorCommand(): Promise<void> {
	try {
		const options: vscode.InputBoxOptions = {
			prompt: 'Enter a color (hex format, e.g., #FF0000)',
			placeHolder: '#FF0000',
			validateInput: (value: string) => {
				if (!value) {
					return 'Please enter a color value';
				}
				if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
					return 'Please enter a valid hex color (e.g., #FF0000)';
				}
				return null;
			}
		};

		const colorInput = await vscode.window.showInputBox(options);
		
		if (colorInput) {
			const color = createColorFromHex(colorInput);
			if (color) {
				const config = vscode.workspace.getConfiguration('joshbot');
				const defaultFormat = config.get<string>('defaultColorFormat', 'hex');
				const formattedColor = formatColor(color, defaultFormat as any);
				
				vscode.window.showInformationMessage(
					`Color picked: ${formattedColor}`,
					'Copy to Clipboard',
					'Show Details'
				).then(selection => {
					if (selection === 'Copy to Clipboard') {
						vscode.env.clipboard.writeText(formattedColor);
						vscode.window.showInformationMessage('Color copied to clipboard!');
					} else if (selection === 'Show Details') {
						showColorDetails(color);
					}
				});
			}
		}
	} catch (error) {
		vscode.window.showErrorMessage(`Error picking color: ${error}`);
	}
}

/**
 * Generates and displays a random color
 */
export function randomColorCommand(): void {
	try {
		const color = generateRandomColor();
		const config = vscode.workspace.getConfiguration('joshbot');
		const defaultFormat = config.get<string>('defaultColorFormat', 'hex');
		const formattedColor = formatColor(color, defaultFormat as any);
		
		vscode.window.showInformationMessage(
			`Random color: ${formattedColor}`,
			'Copy to Clipboard',
			'Show Details',
			'Generate Another'
		).then(selection => {
			if (selection === 'Copy to Clipboard') {
				vscode.env.clipboard.writeText(formattedColor);
				vscode.window.showInformationMessage('Color copied to clipboard!');
			} else if (selection === 'Show Details') {
				showColorDetails(color);
			} else if (selection === 'Generate Another') {
				randomColorCommand();
			}
		});
	} catch (error) {
		vscode.window.showErrorMessage(`Error generating random color: ${error}`);
	}
}

/**
 * Shows a predefined color palette
 */
export async function colorPaletteCommand(): Promise<void> {
	try {
		const config = vscode.workspace.getConfiguration('joshbot');
		const paletteSize = config.get<number>('colorPaletteSize', 13);
		const defaultFormat = config.get<string>('defaultColorFormat', 'hex');
		
		const palette = DEFAULT_COLOR_PALETTE.slice(0, paletteSize);
		const colorItems = palette.map((color, index) => ({
			label: `$(color-mode) ${formatColor(color, defaultFormat as any)}`,
			description: `Color ${index + 1}`,
			color: color
		}));

		const selected = await vscode.window.showQuickPick(colorItems, {
			placeHolder: 'Select a color from the palette',
			matchOnDescription: true,
			matchOnDetail: true
		});

		if (selected) {
			const formattedColor = formatColor(selected.color, defaultFormat as any);
			vscode.window.showInformationMessage(
				`Selected color: ${formattedColor}`,
				'Copy to Clipboard',
				'Show Details',
				'Insert at Cursor'
			).then(selection => {
				if (selection === 'Copy to Clipboard') {
					vscode.env.clipboard.writeText(formattedColor);
					vscode.window.showInformationMessage('Color copied to clipboard!');
				} else if (selection === 'Show Details') {
					showColorDetails(selected.color);
				} else if (selection === 'Insert at Cursor') {
					insertColorAtCursor(formattedColor);
				}
			});
		}
	} catch (error) {
		vscode.window.showErrorMessage(`Error showing color palette: ${error}`);
	}
}

/**
 * Inserts a color value at the cursor position
 */
export async function insertColorCommand(): Promise<void> {
	try {
		const options: vscode.InputBoxOptions = {
			prompt: 'Enter a color to insert (hex format, e.g., #FF0000)',
			placeHolder: '#FF0000',
			validateInput: (value: string) => {
				if (!value) {
					return 'Please enter a color value';
				}
				if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
					return 'Please enter a valid hex color (e.g., #FF0000)';
				}
				return null;
			}
		};

		const colorInput = await vscode.window.showInputBox(options);
		
		if (colorInput) {
			const color = createColorFromHex(colorInput);
			if (color) {
				const config = vscode.workspace.getConfiguration('joshbot');
				const defaultFormat = config.get<string>('defaultColorFormat', 'hex');
				const formattedColor = formatColor(color, defaultFormat as any);
				
				await insertColorAtCursor(formattedColor);
				vscode.window.showInformationMessage(`Color ${formattedColor} inserted!`);
			}
		}
	} catch (error) {
		vscode.window.showErrorMessage(`Error inserting color: ${error}`);
	}
}

/**
 * Helper function to insert color at cursor position
 */
async function insertColorAtCursor(colorValue: string): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const position = editor.selection.active;
		await editor.edit(editBuilder => {
			editBuilder.insert(position, colorValue);
		});
	} else {
		vscode.window.showWarningMessage('No active text editor found. Color copied to clipboard instead.');
		vscode.env.clipboard.writeText(colorValue);
	}
}

/**
 * Shows detailed information about a color
 */
function showColorDetails(color: Color): void {
	const complementary = getComplementaryColor(color);
	const triadic = getTriadicColors(color);
	const analogous = getAnalogousColors(color);
	
	// Check accessibility against white and black
	const whiteColor = createColorFromHex('#FFFFFF')!;
	const blackColor = createColorFromHex('#000000')!;
	const accessibilityWhite = checkAccessibility(color, whiteColor);
	const accessibilityBlack = checkAccessibility(color, blackColor);

	const detailsMarkdown = `
# Color Details

## Primary Color
- **Hex**: ${color.hex}
- **RGB**: rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})
- **HSL**: hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)
- **HSV**: hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)

## Color Harmonies

### Complementary Color
- ${complementary.hex} - rgb(${complementary.rgb.r}, ${complementary.rgb.g}, ${complementary.rgb.b})

### Triadic Colors
- ${triadic[0].hex} - rgb(${triadic[0].rgb.r}, ${triadic[0].rgb.g}, ${triadic[0].rgb.b})
- ${triadic[1].hex} - rgb(${triadic[1].rgb.r}, ${triadic[1].rgb.g}, ${triadic[1].rgb.b})

### Analogous Colors
${analogous.map(c => `- ${c.hex} - rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`).join('\n')}

## Accessibility

### Against White Background
- **Contrast Ratio**: ${accessibilityWhite.ratio.toFixed(2)}:1
- **WCAG AA**: ${accessibilityWhite.aa ? '✓ Pass' : '✗ Fail'}
- **WCAG AAA**: ${accessibilityWhite.aaa ? '✓ Pass' : '✗ Fail'}

### Against Black Background
- **Contrast Ratio**: ${accessibilityBlack.ratio.toFixed(2)}:1
- **WCAG AA**: ${accessibilityBlack.aa ? '✓ Pass' : '✗ Fail'}
- **WCAG AAA**: ${accessibilityBlack.aaa ? '✓ Pass' : '✗ Fail'}
`;

	// Create a new untitled document to show the details
	vscode.workspace.openTextDocument({
		content: detailsMarkdown,
		language: 'markdown'
	}).then(doc => {
		vscode.window.showTextDocument(doc);
	});
}

/**
 * Processes color-related chat requests
 */
export function processColorChatRequest(prompt: string): string | null {
	const lowerPrompt = prompt.toLowerCase();
	
	// Check for color-related keywords
	const colorKeywords = ['color', 'colours', 'palette', 'hex', 'rgb', 'hsl', 'hsv'];
	const hasColorKeyword = colorKeywords.some(keyword => lowerPrompt.includes(keyword));
	
	if (!hasColorKeyword) {
		return null; // Not a color-related request
	}

	// Generate random color
	if (lowerPrompt.includes('random') && lowerPrompt.includes('color')) {
		const color = generateRandomColor();
		return `Here's a random color for you: **${color.hex}** (RGB: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
	}

	// Color palette request
	if (lowerPrompt.includes('palette') || lowerPrompt.includes('colors')) {
		const config = vscode.workspace.getConfiguration('joshbot');
		const paletteSize = config.get<number>('colorPaletteSize', 13);
		const palette = DEFAULT_COLOR_PALETTE.slice(0, Math.min(paletteSize, 6)); // Show fewer colors in chat
		
		let response = "Here's a color palette for you:\n\n";
		palette.forEach((color, index) => {
			response += `${index + 1}. **${color.hex}** - rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})\n`;
		});
		
		return response;
	}

	// Color theory explanation
	if (lowerPrompt.includes('theory') || lowerPrompt.includes('harmony')) {
		return `## Color Theory Basics

**Primary Colors**: Red, Blue, Yellow - the foundation of all other colors.

**Secondary Colors**: Green, Orange, Purple - created by mixing primary colors.

**Color Harmonies**:
- **Complementary**: Colors opposite on the color wheel
- **Triadic**: Three colors evenly spaced on the color wheel
- **Analogous**: Colors next to each other on the color wheel
- **Split-Complementary**: A color plus the two colors adjacent to its complement

**Color Properties**:
- **Hue**: The color itself (red, blue, green, etc.)
- **Saturation**: The intensity or purity of the color
- **Lightness/Value**: How light or dark the color is

Use the JoshBot color commands to explore these concepts!`;
	}

	// Accessibility information
	if (lowerPrompt.includes('accessibility') || lowerPrompt.includes('contrast')) {
		return `## Color Accessibility Guidelines

**WCAG Standards**:
- **AA**: Minimum contrast ratio of 4.5:1 for normal text
- **AAA**: Enhanced contrast ratio of 7:1 for normal text

**Tips**:
- Test your color combinations for sufficient contrast
- Consider color-blind users (avoid relying solely on color)
- Use tools to check contrast ratios
- Provide alternative ways to convey information

Use the color picker commands to check accessibility of your color choices!`;
	}

	// General color information
	return `I can help you with colors! Here's what I can do:

**Commands**:
- Use "JoshBot: Pick Color" to select and analyze colors
- Use "JoshBot: Random Color" to generate random colors
- Use "JoshBot: Color Palette" to browse predefined colors
- Use "JoshBot: Insert Color" to add colors to your code

**I can help with**:
- Color format conversions (hex, RGB, HSL, HSV)
- Color harmony generation (complementary, triadic, analogous)
- Accessibility checking (contrast ratios)
- Color theory explanations

Try asking me about "random color", "color palette", "color theory", or "color accessibility"!`;
}