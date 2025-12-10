const axios = require('axios');

const sendBannedUserLoginNotification = async (user) => {
    try {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

        if (!webhookUrl) {
            console.warn('DISCORD_WEBHOOK_URL not set, skipping banned user notification');
            return;
        }

        const embed = {
            title: '🚫 Banned User Login Attempt',
            color: 0xFF0000, // Red
            fields: [
                {
                    name: 'User',
                    value: `${user.username} (${user.email})`,
                    inline: true
                },
                {
                    name: 'User ID',
                    value: user._id.toString(),
                    inline: true
                },
                {
                    name: 'Time',
                    value: new Date().toLocaleString(),
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        };

        if (user.cccd) {
            embed.fields.push({
                name: 'CCCD',
                value: user.cccd,
                inline: true
            });
        }

        await axios.post(webhookUrl, {
            embeds: [embed]
        });

        console.log(`Sent banned user notification to Discord for ${user.username}`);
    } catch (error) {
        console.error('Error sending Discord webhook notification:', error.message);
    }
};

module.exports = { sendBannedUserLoginNotification };
