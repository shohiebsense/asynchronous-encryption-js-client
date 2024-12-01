const forge = require("node-forge");
const https = require('https')
const fs = require('fs')
const path = require("path");

// Define your agent for HTTPS with custom options
// const agent = new https.Agent({
//   rejectUnauthorized: false,
//   crt: fs.readFileSync("client_mismatch_cert.pem"),
//   key: fs.readFileSync("client_mismatch_private.key"),
// });



const agent = new https.Agent({
  cert: fs.readFileSync("client.crt"),
  key: fs.readFileSync("client.key"),
  ca: fs.readFileSync("ca.crt"),
  rejectUnauthorized: true, // Ensure client validates server's certificate
});
async function fetchPublicKey() {
  const fetch = await import("node-fetch");
 const response = await fetch.default("https://localhost:8080/public-key", {
   method: "GET",
   headers: {
     Authorization: "Bearer your-jwt-token",
   },
   agent,
    });
  if (!response.ok) {
    throw new Error("Failed to fetch public key");
  }
  return await response.text();
}

function encryptAmount(publicKeyPEM, amount) {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPEM);
    const encryptedAmount = publicKey.encrypt(amount, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
    });
    return forge.util.encode64(encryptedAmount);
}

async function main() {
    try {
        const publicKeyPEM = await fetchPublicKey();

        const amount = "1";

        const encryptedAmountBase64 = encryptAmount(publicKeyPEM, amount);
        const fetch = await import("node-fetch");
        const response = await fetch.default("https://localhost:8080/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: encryptedAmountBase64,
          }),
          agent,
        });

        if (!response.ok) {
            throw new Error('Failed to send encrypted amount');
        }

        const data = await response.json();
        console.log('Decrypted Amount:', data.decrypted_amount);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
