const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'pdfGenerator.jsx');
const content = fs.readFileSync(filePath, 'utf-8');

const outputDir = path.join(__dirname, 'src', 'services', 'pdf');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Common imports for all pdf components
const commonImports = `import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

`;

// Extract styles block
const stylesMatch = content.match(/const styles = StyleSheet\.create\(\{[\s\S]*?\}\);/);
const stylesCode = stylesMatch ? stylesMatch[0] : '';
if (stylesCode) {
  fs.writeFileSync(path.join(outputDir, 'styles.js'), `import { StyleSheet } from '@react-pdf/renderer';\n\nexport ${stylesCode}\n`);
}

// Split the content by top level consts that look like components
const componentRegex = /const ([A-Z]\w+Doc) = \(\{(.*?)\}\) => \{([\s\S]*?)(?=\nconst [A-Z]\w+Doc|\nexport async function)/g;
let match;
const componentNames = [];

while ((match = componentRegex.exec(content)) !== null) {
  const compName = match[1];
  const props = match[2];
  let body = match[3];
  
  componentNames.push(compName);

  let fileContent = commonImports;
  fileContent += `import { styles } from './styles';\n\n`;
  fileContent += `export const ${compName} = ({${props}}) => {${body}`;
  
  fs.writeFileSync(path.join(outputDir, `${compName}.jsx`), fileContent);
  console.log(`Generated ${compName}.jsx`);
}

// Generate index.js
let indexContent = componentNames.map(name => `import { ${name} } from './${name}';`).join('\n');
indexContent += `\nimport { pdf } from '@react-pdf/renderer';\n\n`;

const generateFuncRegex = /export async function generateDocumentPDF[\s\S]*?$/;
const generateFuncMatch = content.match(generateFuncRegex);
if (generateFuncMatch) {
  indexContent += generateFuncMatch[0] + '\n';
}

fs.writeFileSync(path.join(outputDir, 'index.jsx'), indexContent);
console.log('Generated index.jsx');
