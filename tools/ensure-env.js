const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'expo-env.d.ts');
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, '/// <reference types="expo/types" />\n', 'utf8');
  console.log('expo-env.d.ts restored');
}
