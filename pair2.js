// pair2.js
// Minimal & safe pairing-code generator for existing Baileys bot

module.exports = async function getPairCode(sock) {
  try {
    if (!sock) return null;

    // If already paired, stop generating new codes
    if (sock.authState?.creds?.registered) {
      return "ALREADY LINKED";
    }

    // WhatsApp requires a number format, but user pairs from their own phone
    const code = await sock.requestPairingCode("254700000000");

    return code;
  } catch (err) {
    console.error("[pair2.js] Pair error:", err);
    return null;
  }
};
