const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\jhj02\\Documents\\Antigravity\\t\\schedule_app\\index.html', 'utf8');
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/g);
if (scriptMatch) {
    scriptMatch.forEach((s, i) => {
        const code = s.replace('<script>', '').replace('</script>', '');
        try {
            new Function(code);
            console.log(`Script block ${i} is valid.`);
        } catch (e) {
            console.error(`Script block ${i} has error:`, e.message);
            // Try to find the line
            const lines = code.split('\n');
            lines.forEach((l, li) => {
                try {
                    new Function(lines.slice(0, li + 1).join('\n') + '\n}');
                } catch (e2) {
                    // This is a crude way, but maybe it helps
                }
            });
        }
    });
} else {
    console.log('No script blocks found.');
}
