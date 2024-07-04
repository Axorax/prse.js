const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcFile = path.resolve(__dirname, 'prse.ts');
const umdFile = path.resolve(__dirname, 'prse.umd.ts');
const esmFile = path.resolve(__dirname, 'prse.esm.ts');
const cjsFile = path.resolve(__dirname, 'prse.cjs.ts');

function copyFileSync(source, target) {
	fs.copyFileSync(source, target);
}

function deleteFileSync(target) {
	if (fs.existsSync(target)) {
		fs.unlinkSync(target);
	}
}

function modifyFileForExports(filePath) {
	let content = fs.readFileSync(filePath, 'utf8');
	content = content
		.split('\n')
		.map((line, index) => (index === 0 ? `export ${line}` : line))
		.join('\n');
	content += '\nexport { p, assert, Parser, string, number, boolean, unknown, object, objectLoose, array, record, set, map, tuple, enums, fail, date, instance, func, symbol, regexp, bigInt, int8Array, uint8Array };';
	fs.writeFileSync(filePath, content);
}

try {
	copyFileSync(srcFile, umdFile);
	copyFileSync(srcFile, esmFile);
	modifyFileForExports(esmFile);
	copyFileSync(esmFile, cjsFile);

	execSync('tsc --project tsconfig.umd.json', { stdio: 'inherit' });
	execSync('tsc --project tsconfig.esm.json', { stdio: 'inherit' });
	execSync('tsc --project tsconfig.cjs.json', { stdio: 'inherit' });
} catch (error) {
	console.error('Error during build:', error);
} finally {
	deleteFileSync(esmFile);
	deleteFileSync(cjsFile);
	deleteFileSync(umdFile);

	fs.rename('prse.cjs.js', 'prse.cjs', (err) => {
		if (err) {
			console.error('Error renaming prse.cjs.js to prse.cjs:', err);
		} else {
			console.log('Successfully renamed prse.cjs.js to prse.cjs');
		}
	});

	fs.rename('prse.cjs.d.ts', 'prse.d.ts', (err) => {
		if (err) {
			console.error('Error renaming prse.cjs.d.ts to prse.d.ts:', err);
		} else {
			console.log('Successfully renamed prse.cjs.d.ts to prse.d.ts');
		}
	});
}

if (!process.argv.includes('-test')) {
	try {
		execSync('npm run minify', { stdio: 'inherit' });
	} catch (error) {
		console.error('Error during minification:', error, '\n\n\n[NOTE]: MAKE SURE TO USE A BASH TERMINAL!!!\n\n');
	}
}
