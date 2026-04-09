const fs = require('fs');

async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/test-courses?userId=cmmg91nao0001hhpkqp1nbf7r');
    const text = await res.text();
    fs.writeFileSync('tmp/test-api-out.txt', text, 'utf8');
    console.log("Written response");
  } catch (err) {
    fs.writeFileSync('tmp/test-api-out.txt', 'ERROR: ' + err.stack, 'utf8');
    console.log("Written error");
  }
}

main();
