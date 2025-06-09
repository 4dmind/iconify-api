import {
	importDirectory,
	cleanupSVG,
	runSVGO,
	parseColors,
	isEmptyColor,
} from '@iconify/tools';
import fs from 'fs';

(async () => {
	const iconSet = await importDirectory('./icons/fortis-icons', {
		prefix: 'fortis-icons',
	});

	iconSet.forEach((name, type) => {
		if (type !== 'icon') return;

		const svg = iconSet.toSVG(name);
		if (!svg) {
			iconSet.remove(name);
			return;
		}

		try {
			// 1. Initial cleanup
			cleanupSVG(svg);

			// 2. Serialize for inspection
			const svgString = svg.toString();

			// 3. Regex to find all flat fill colors
			const fillRegex = /fill="(#[0-9A-Fa-f]{3,6})"/g;
			let match;
			const fills = new Set();
			while ((match = fillRegex.exec(svgString))) {
				fills.add(match[1].toLowerCase());
			}

			// 4. Skip color parsing if gradient or multi-color flat palette
			if (
				svgString.includes('<linearGradient') ||   // detect gradients  [oai_citation_attribution:9‡developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes?utm_source=chatgpt.com)
				fills.size > 2                             // detect custom flat palettes  [oai_citation_attribution:10‡developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set?utm_source=chatgpt.com)
			) {
				// no parseColors()
			} else {
				// Monotone icon: convert to currentColor
				parseColors(svg, {
					defaultColor: 'currentColor',
					callback: (attr, colorStr, color) =>
						!color || isEmptyColor(color) ? colorStr : 'currentColor',
				});
			}

			// 5. Optimize while preserving gradients/defs
			runSVGO(svg, {
				plugins: [
					'preset-default',
					{ name: 'removeUselessDefs', active: false },
					{ name: 'removeUnknownsAndDefaults', active: false },
					{ name: 'prefixIds', params: { prefix: `${name}-` } },
				],
			});
		} catch (err) {
			console.error(`Error parsing ${name}:`, err);
			iconSet.remove(name);
			return;
		}

		// Update with cleaned SVG
		iconSet.fromSVG(name, svg);
	});

	// Export final Iconify JSON
	const output = iconSet.export();
	fs.writeFileSync(
		'./icons/fortis-icons.json',
		JSON.stringify(output, null, 2),
		'utf-8'
	);
	console.log('Icon set saved to ./icons/fortis-icons.json');
})();
