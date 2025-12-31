/**
 * BUGFIXED-SULEXH-XMD - AlwaysOffline Command (REALISTIC)
 */

const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const configPath = path.join(__dirname, '..', 'data', 'alwaysoffline.json');

function initConfig() {
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(
            configPath,
            JSON.stringify({ enabled: false }, null, 2)
        );
    }
    return JSON.parse(fs.readFileSync(configPath));
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// COMMAND
async function alwaysofflineCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

        if (!message.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { text: '❌ Owner only command!' });
            return;
        }

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        const args = text.trim().split(/\s+/).slice(1);
        const config = initConfig();

        if (args[0] === 'on' || args[0] === 'enable') {
            config.enabled = true;
        } else if (args[0] === 'off' || args[0] === 'disable') {
            config.enabled = false;
        } else {
            config.enabled = !config.enabled;
        }

        saveConfig(config);

        await sock.sendMessage(chatId, {
            text: `✅ AlwaysOffline ${config.enabled ? 'ENABLED' : 'DISABLED'}`
        });
    } catch (e) {
        console.error('AlwaysOffline command error:', e);
    }
}

// CHECK
function isAlwaysOfflineEnabled() {
    try {
        return initConfig().enabled;
    } catch {
        return false;
    }
}

// HANDLER (CORE LOGIC)
async function handleAlwaysOffline(sock, message) {
    if (!isAlwaysOfflineEnabled()) return false;

    const jid = message.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');

    // Force offline presence
    try {
        await sock.sendPresenceUpdate('unavailable', jid);
    } catch {}

    // ❌ Do NOT send read receipts in private chats
    if (!isGroup) return true;

    return false;
}

module.exports = {
    alwaysofflineCommand,
    isAlwaysOfflineEnabled,
    handleAlwaysOffline
};
