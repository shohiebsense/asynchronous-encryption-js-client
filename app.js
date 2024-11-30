const forge = require("node-forge");

async function fetchPublicKey() {
  const fetch = await import("node-fetch");
  const response = await fetch.default("http://localhost:8080/public-key");
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

        const amount = "5000";

        const encryptedAmountBase64 = encryptAmount(publicKeyPEM, amount);

        const response = await fetch('http://localhost:8080/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: encryptedAmountBase64,
            }),
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
