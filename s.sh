#!/bin/bash

# Script to change MapboxDraw polygon selection highlight color to dark gray
# Target file: src/features/draw/DrawControl.tsx

TARGET_FILE="src/features/draw/DrawControl.tsx"

# Check if file exists
if [ ! -f "$TARGET_FILE" ]; then
    echo "❌ Error: File $TARGET_FILE not found!"
    exit 1
fi

# Create backup
BACKUP_FILE="${TARGET_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$TARGET_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Create the custom styles configuration with dark gray highlight (#555555)
cat > src/features/draw/drawStyles.ts << 'EOF'
// Custom styles for MapboxDraw with dark gray selection highlight (#555555)
// Based on mapbox-gl-draw default styles

const customDrawStyles = [
  // ACTIVE (being drawn) styles
  {
    id: 'gl-draw-line',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#D20C0C',
      'line-dasharray': [0.2, 2],
      'line-width': 2
    }
  },
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: {
      'fill-color': '#D20C0C',
      'fill-outline-color': '#D20C0C',
      'fill-opacity': 0.1
    }
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#D20C0C',
      'line-dasharray': [0.2, 2],
      'line-width': 2
    }
  },

  // SELECTED (active) styles - THESE ARE THE KEY ONES WE'RE CHANGING
  // Default was orange (#fbb03b), now changing to dark gray (#555555)
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': '#555555',
      'fill-outline-color': '#555555',
      'fill-opacity': 0.4
    }
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#555555',
      'line-dasharray': [0.2, 2],
      'line-width': 2
    }
  },

  // Vertex styles (keep default)
  {
    id: 'gl-draw-polygon-and-line-vertex-halo-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 12,
      'circle-color': '#FFF'
    }
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 8,
      'circle-color': '#D20C0C'
    }
  },

  // Inactive (static) styles
  {
    id: 'gl-draw-polygon-fill-static',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
    paint: {
      'fill-color': '#000',
      'fill-outline-color': '#000',
      'fill-opacity': 0.1
    }
  },
  {
    id: 'gl-draw-polygon-stroke-static',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#000',
      'line-width': 2
    }
  }
];

export default customDrawStyles;
EOF

echo "✅ Created drawStyles.ts"

# Now modify the DrawControl.tsx file
node << 'EOF'
const fs = require('fs');
const path = require('path');

const targetFile = 'src/features/draw/DrawControl.tsx';

if (!fs.existsSync(targetFile)) {
    console.error('❌ File not found:', targetFile);
    process.exit(1);
}

console.log(`📝 Processing: ${targetFile}`);

let content = fs.readFileSync(targetFile, 'utf8');

// Check if custom styles are already imported
if (content.includes('customDrawStyles')) {
    console.log('⚠️ Custom styles already appear to be configured. Skipping modification.');
    process.exit(0);
}

// Add import statement after the last import
const importStatement = "import customDrawStyles from './drawStyles';\n";

// Find the last import statement
const importRegex = /^import .*;$/gm;
const imports = content.match(importRegex);

if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertPosition = lastImportIndex + lastImport.length;
    content = content.slice(0, insertPosition) + '\n' + importStatement + content.slice(insertPosition);
} else {
    // If no imports found, add at the top
    content = importStatement + content;
}

// Find the MapboxDraw initialization and add styles property
const drawInitRegex = /new MapboxDraw\(\{[\s\S]*?\}\)/;
const drawInitMatch = content.match(drawInitRegex);

if (!drawInitMatch) {
    console.log('❌ Could not find MapboxDraw initialization');
    process.exit(1);
}

let drawInit = drawInitMatch[0];

// Check if styles property already exists
if (drawInit.includes('styles:')) {
    console.log('⚠️ Styles property already exists, skipping...');
} else {
    // Add styles property before the closing brace
    // Find the last property or closing brace
    const lastBraceIndex = drawInit.lastIndexOf('}');
    if (lastBraceIndex > -1) {
        // Check if there's already content before the closing brace
        const beforeBrace = drawInit.substring(0, lastBraceIndex);
        const afterBrace = drawInit.substring(lastBraceIndex);
        
        // Add comma if needed
        let newDrawInit = beforeBrace;
        if (!beforeBrace.trim().endsWith(',')) {
            newDrawInit += ',';
        }
        newDrawInit += '\n      styles: customDrawStyles';
        newDrawInit += afterBrace;
        
        drawInit = newDrawInit;
    }
}

// Replace the MapboxDraw initialization
content = content.replace(drawInitMatch[0], drawInit);

// Write the modified content
fs.writeFileSync(targetFile, content);
console.log('✅ DrawControl.tsx modified successfully!');

console.log('\n🎉 Done! The polygon selection highlight color is now dark gray (#555555)');
console.log('   (Previously orange, now changed to dark gray)');
console.log('\n📚 Based on mapbox-gl-draw documentation:');
console.log('   - gl-draw-polygon-fill-active → fill color for selected polygons');
console.log('   - gl-draw-polygon-stroke-active → stroke color for selected polygons');

EOF

# Check if modification was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ Script completed successfully!"
    echo ""
    echo "Changes made:"
    echo "  1. Created backup: $BACKUP_FILE"
    echo "  2. Created drawStyles.ts with dark gray highlight color (#555555)"
    echo "  3. Modified DrawControl.tsx to use custom styles"
    echo ""
    echo "The selected polygon highlight color is now DARK GRAY instead of orange."
    echo "═══════════════════════════════════════════════════════════"
else
    echo "❌ Script failed. Restoring from backup..."
    cp "$BACKUP_FILE" "$TARGET_FILE"
    echo "✅ Restored original file from backup"
fi