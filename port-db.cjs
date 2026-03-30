const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'electron/src/db');
const destDir = path.join(__dirname, 'src/app/mobile-db');

if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
}

function copyDirAndTransform(src, dest, depth = 0) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    let methods = [];

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        if (entry.isDirectory()) {
            const destPath = path.join(dest, entry.name);
            methods.push(...copyDirAndTransform(srcPath, destPath, depth + 1));
        } else if (entry.name.endsWith('.js') && entry.name !== 'index.js') {
            const destPathTS = path.join(dest, entry.name.replace('.js', '.ts'));
            let content = fs.readFileSync(srcPath, 'utf8');
            
            // Fix import paths - depends on depth
            const upDirs = '../'.repeat(depth + 1);
            content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"].*?services\/database\.services(?:\.js)?['"];/g, 
                `import { $1 } from '${upDirs}services/mobile-sqlite.service';`);
            
            fs.writeFileSync(destPathTS, content);

            // Extract exported functions
            const match = content.match(/export (?:async )?function ([a-zA-Z0-9_]+)\s*\(/);
            if (match) {
                const funcName = match[1];
                const relativePath = path.relative(path.join(__dirname, 'src/app'), destPathTS).replace(/\\/g, '/').replace('.ts', '');
                methods.push({ name: funcName, path: relativePath });
            }
        }
    }
    return methods;
}

const exportedMethods = copyDirAndTransform(srcDir, destDir);

// Now generate mobile-api.ts which exposes all these methods as an object matching `window.api`
let apiContent = `// AUTO-GENERATED FILE\n`;
for (let method of exportedMethods) {
    apiContent += `import { ${method.name} } from '../${method.path}';\n`;
}

apiContent += `\nexport const mobileApi = {\n`;
for (let method of exportedMethods) {
    apiContent += `    ${method.name},\n`;
}
apiContent += `};\n`;

fs.writeFileSync(path.join(__dirname, 'src/app/services/mobile-api.ts'), apiContent);
console.log('Successfully ported ' + exportedMethods.length + ' methods.');
