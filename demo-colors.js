/* 
JoshBot Color Support Demo
This file demonstrates the new color features added to JoshBot extension.
Try hovering over the hex colors below to see color previews!
*/

// Primary colors
const primaryRed = '#FF0000';
const primaryGreen = '#00FF00';
const primaryBlue = '#0000FF';

// Secondary colors
const orange = '#FFA500';
const purple = '#800080';
const cyan = '#00FFFF';

// Neutral colors
const white = '#FFFFFF';
const black = '#000000';
const gray = '#808080';

// Color palette for web design
const brandColors = {
  primary: '#3498db',    // Blue
  secondary: '#e74c3c',  // Red
  success: '#2ecc71',    // Green
  warning: '#f39c12',    // Orange
  danger: '#e74c3c',     // Red
  info: '#17a2b8',       // Cyan
  light: '#f8f9fa',      // Light gray
  dark: '#343a40'        // Dark gray
};

/*
To test the JoshBot color functionality:

1. Commands (accessible via Command Palette):
   - "JoshBot: Pick Color" - Opens color picker dialog
   - "JoshBot: Random Color" - Generates a random color
   - "JoshBot: Color Palette" - Shows predefined color palette
   - "JoshBot: Insert Color" - Inserts color at cursor position

2. Chat Features:
   Try asking JoshBot these questions:
   - "Can you give me a random color?"
   - "Show me a color palette"
   - "Tell me about color theory"
   - "Help with color accessibility"

3. Hover Features:
   - Hover over any hex color in this file to see color preview
   - VS Code's built-in color picker should also work

4. Completion Features:
   - Type # and see color suggestions
   - Built-in color picker integration

5. Configuration Options:
   - joshbot.defaultColorFormat: Choose between hex, rgb, hsl, hsv
   - joshbot.enableColorPreview: Toggle color previews in hover
   - joshbot.colorPaletteSize: Set number of colors in palette
*/