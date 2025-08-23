// Simple German translation function for common words and phrases
export function translateToGerman(text: string): string {
	const translations: { [key: string]: string } = {
		'hello': 'hallo',
		'goodbye': 'auf wiedersehen',
		'thank you': 'danke',
		'thanks': 'danke',
		'please': 'bitte',
		'yes': 'ja',
		'no': 'nein',
		'good morning': 'guten morgen',
		'good evening': 'guten abend',
		'good night': 'gute nacht',
		'how are you': 'wie geht es dir',
		'what is your name': 'wie heißt du',
		'my name is': 'mein name ist',
		'i love you': 'ich liebe dich',
		'excuse me': 'entschuldigung',
		'sorry': 'entschuldigung',
		'water': 'wasser',
		'food': 'essen',
		'house': 'haus',
		'car': 'auto',
		'dog': 'hund',
		'cat': 'katze',
		'translate to german': 'ins deutsche übersetzen'
	};

	const lowerText = text.toLowerCase().trim();
	
	// Check for exact matches first
	if (translations[lowerText]) {
		return translations[lowerText];
	}
	
	// Check for partial matches and replace words
	let result = lowerText;
	for (const [english, german] of Object.entries(translations)) {
		const regex = new RegExp('\\b' + english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
		result = result.replace(regex, german);
	}
	
	// If no translation found, return original with a note
	if (result === lowerText) {
		return `${text} (Übersetzung nicht verfügbar)`;
	}
	
	return result;
}