async function unbanPlayer(serverKey, playerId) {
    try {
        console.log(`Attempting to unban player with ID: ${playerId}`);

        const response = await axios({
            method: 'DELETE',
            url: `https://api.policeroleplay.community/v1/server/bans/${playerId}`,
            headers: {
                'Server-Key': serverKey,
            }
        });

        if (response.status === 200) {
            console.log('Player successfully unbanned.');
            return true;
        } else {
            console.error(`Failed to unban player: ${response.statusText}`);
            return false;
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.error('Error unbanning player: Player not found or endpoint incorrect.');
        } else {
            console.error('Error unbanning player:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            }
        }
        return false;
    }
}