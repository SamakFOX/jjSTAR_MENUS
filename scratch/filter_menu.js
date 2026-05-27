const fs = require('fs');

const menuContent = fs.readFileSync('prompts/menu.js', 'utf8');
// The file starts with window.JJSTAR_MENU = [ ... ];
// I'll extract the array part.
const arrayMatch = menuContent.match(/window\.JJSTAR_MENU = ([\s\S]*);/);
if (!arrayMatch) {
  console.error('Could not find window.JJSTAR_MENU in menu.js');
  process.exit(1);
}

// Since it's a JS file, I can't just JSON.parse it directly easily due to comments and non-JSON syntax.
// I'll use eval (safe here as it's local) or a cleaner way.
// Let's try to evaluate it in a sandbox-like way.
let menuData;
try {
  // Mock window object
  const window = {};
  eval(menuContent);
  menuData = window.JJSTAR_MENU;
} catch (e) {
  console.error('Error evaluating menu.js:', e);
  process.exit(1);
}

function filterEnabled(items, level = 1) {
  return items
    .filter(item => item.enabled !== false && item.code !== 'L01INIT') // Skip disabled and L01INIT
    .map(item => {
      const newItem = {
        id: item.code || Math.random().toString(36).substr(2, 9),
        title: item.title,
        level: level,
      };
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterEnabled(item.children, level + 1);
        if (filteredChildren.length > 0) {
          newItem.children = filteredChildren;
        }
      }
      return newItem;
    });
}

const filteredMenu = filterEnabled(menuData);

fs.writeFileSync('src/data/initialMenu.js', `export const initialMenu = ${JSON.stringify(filteredMenu, null, 2)};\n`);
console.log('Successfully filtered and saved initialMenu.js');
