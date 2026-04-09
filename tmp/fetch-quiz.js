const http = require('http');

http.get('http://localhost:3000/api/test-quiz', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Status Code:", res.statusCode);
    try {
      console.log("Response:", JSON.parse(data));
    } catch (e) {
      console.log("Raw Response:", data);
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
