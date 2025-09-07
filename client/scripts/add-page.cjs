const fs = require('fs'); const path = require('path');

const name = process.argv[2];
if (!name) { console.error('Usage: node scripts/add-page.cjs <Name>'); process.exit(1); }

const kebab = name.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase();
const root = path.join(__dirname, '..');

const pagePath = path.join(root, 'src', 'pages', `${name}.tsx`);
const mainPath = path.join(root, 'src', 'main.tsx');
const layoutPath = path.join(root, 'src', 'layouts', 'AppLayout.tsx');

fs.mkdirSync(path.dirname(pagePath), { recursive: true });
fs.writeFileSync(
  pagePath,
  `export default function ${name}(){return(<div><h1>${name}</h1><p>New screen.</p></div>);}`,
  'utf8'
);

let main = fs.readFileSync(mainPath, 'utf8');
if (!main.includes(`import ${name} from './pages/${name}'`)) {
  main = main.replace(
    /(import\s+About\s+from\s+'\.\/pages\/About'\s*;?)/,
    `$1\nimport ${name} from './pages/${name}'`
  );
}
main = main.replace(
  /(\{\s*path:\s*'about',\s*element:\s*<About\s*\/>,\s*\},?)/,
  `$1\n      { path: '${kebab}', element: <${name} /> },`
);
fs.writeFileSync(mainPath, main, 'utf8');

let layout = fs.readFileSync(layoutPath, 'utf8');
if (!layout.includes(`to="/${kebab}"`)) {
  layout = layout.replace('</nav>', `  <Link to="/${kebab}">${name}</Link>\n      </nav>`);
}
fs.writeFileSync(layoutPath, layout, 'utf8');
