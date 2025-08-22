/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

/**
 * Zen Mode - Switches to Quiet Light theme, hides Activity Bar, and shows calming notification
 */
export async function activateZenMode(): Promise<void> {
	const config = vscode.workspace.getConfiguration();
	
	try {
		// Switch to Quiet Light theme
		await config.update('workbench.colorTheme', 'Quiet Light', vscode.ConfigurationTarget.Global);
		
		// Hide the Activity Bar for a cleaner experience
		await config.update('workbench.activityBar.visible', false, vscode.ConfigurationTarget.Global);
		
		// Show calming notification
		vscode.window.showInformationMessage('🧘 Zen Mode activated - Find your inner peace with a clean, light interface');
	} catch (error) {
		vscode.window.showErrorMessage('Failed to activate Zen Mode');
		console.error('Zen Mode error:', error);
	}
}

/**
 * Party Mode - Toggles between Dark+ and Light+ themes for a fun experience
 */
export async function activatePartyMode(): Promise<void> {
	const config = vscode.workspace.getConfiguration();
	
	try {
		const currentTheme = config.get<string>('workbench.colorTheme');
		
		// Toggle between dark and light themes
		let newTheme: string;
		if (currentTheme === 'Default Light+' || currentTheme === 'Quiet Light') {
			newTheme = 'Default Dark+';
		} else {
			newTheme = 'Default Light+';
		}
		
		await config.update('workbench.colorTheme', newTheme, vscode.ConfigurationTarget.Global);
		
		// Restore Activity Bar if hidden
		await config.update('workbench.activityBar.visible', true, vscode.ConfigurationTarget.Global);
		
		// Show party notification
		vscode.window.showInformationMessage(`🎉 Party Mode! Switched to ${newTheme} theme`);
	} catch (error) {
		vscode.window.showErrorMessage('Failed to activate Party Mode');
		console.error('Party Mode error:', error);
	}
}

/**
 * Rainbow Mode - Randomly selects from a variety of colorful themes
 */
export async function activateRainbowMode(): Promise<void> {
	const config = vscode.workspace.getConfiguration();
	
	// Collection of colorful and varied themes available in VS Code
	const themes = [
		'Default Dark+',
		'Default Light+',
		'Dark+ (default dark)',
		'Light+ (default light)',
		'Monokai',
		'Solarized Dark',
		'Solarized Light',
		'Quiet Light',
		'Abyss',
		'Kimbie Dark',
		'Tomorrow Night Blue',
		'Red',
		'Visual Studio Dark',
		'Visual Studio Light',
		'High Contrast Light'
	];
	
	try {
		// Randomly select a theme
		const randomTheme = themes[Math.floor(Math.random() * themes.length)];
		
		await config.update('workbench.colorTheme', randomTheme, vscode.ConfigurationTarget.Global);
		
		// Restore Activity Bar if hidden
		await config.update('workbench.activityBar.visible', true, vscode.ConfigurationTarget.Global);
		
		// Show rainbow notification
		vscode.window.showInformationMessage(`🌈 Rainbow Mode! Random theme selected: ${randomTheme}`);
	} catch (error) {
		vscode.window.showErrorMessage('Failed to activate Rainbow Mode');
		console.error('Rainbow Mode error:', error);
	}
}