const value = '3c281838df21467aa04d8ba24268a8bd';
const envName = 'VITE_AGORA_APP_ID';
const environment = process.argv[2] || 'production';

console.log(`Adding ${envName} with value length: ${value.length}`);
console.log(`Value: "${value}"`);

const child = require('child_process').spawn('npx', ['vercel', 'env', 'add', envName, environment, '--sensitive'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true
});

// Write value to stdin and close
setTimeout(() => {
  console.log('Writing to stdin...');
  child.stdin.write(value, 'utf8', () => {
    console.log('Write complete, ending stdin');
    child.stdin.end();
  });
}, 500);
