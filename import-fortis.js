import {
	importDirectory,
	cleanupSVG,
	runSVGO,
	parseColors,
	isEmptyColor,
} from '@iconify/tools';
import fs from 'fs';

(async () => {
	// Import icons from the specified directory with the prefix "fortis-icons"
	const iconSet = await importDirectory('./icons/fortis-icons', {
		prefix: 'fortis-icons',
	});

	// Validate, clean up, fix palette and optimise each icon
	iconSet.forEach((name, type) => {
		if (type !== 'icon') {
			return;
		}

		const svg = iconSet.toSVG(name);
		if (!svg) {
			// Remove invalid icon
			iconSet.remove(name);
			return;
		}

		try {
			// Clean up the SVG code
			cleanupSVG(svg);

			// For monotone icons: replace any defined color with "currentColor"
			parseColors(svg, {
				defaultColor: 'currentColor',
				callback: (attr, colorStr, color) =>
					!color || isEmptyColor(color) ? colorStr : 'currentColor',
			});

			// Optimize the SVG
			runSVGO(svg);
		} catch (err) {
			console.error(`Error parsing ${name}:`, err);
			iconSet.remove(name);
			return;
		}

		// Update the icon in the icon set with the cleaned SVG
		iconSet.fromSVG(name, svg);
	});

	// Export the icon set
	const output = iconSet.export();

	// Save the exported JSON to "./icons/fortis-icons.json"
	fs.writeFileSync(
		'./icons/fortis-icons.json',
		JSON.stringify(output, null, 2),
		'utf-8'
	);

	console.log('Icon set saved to ./icons/fortis-icons.json');
})();
