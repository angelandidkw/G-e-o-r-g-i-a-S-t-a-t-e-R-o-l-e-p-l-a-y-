# Georgia Utilities Discord Bot

## Overview
Georgia Utilities is a custom Discord bot designed specifically for the Georgia State Roleplay community. It enhances server management, moderation, and user experience with a variety of commands and features.

## Features

### Role Management
- `/giverole`: Allows authorized users to assign roles to members.

### User Information
- `/creator`: Displays information about the bot's creator and FAQ.
- `/whois`: Shows detailed information about a user.

### Application System
- `/apply`: Provides a link to apply for staff positions.
- `/application`: Manages application status for different departments.

### Moderation
- `/ban`: Bans a user from the server.
- `/unban`: Unbans a user from the server.
- `/kick`: Kicks a user from the server.
- `/warn`: Issues a warning to a user.
- `/timeout`: Temporarily restricts a user's access.
- `/softban`: Kicks a user and deletes their recent messages.
- `/viewmoderation`: Views a user's infraction history.
- Blacklist system to prevent certain users from using bot commands.

### Infraction System
- `/infraction`: Manages staff infractions (view, issue, edit, delete).

### ERLC Integration
- `/lookup`: Looks up a Roblox user by username.

### Utility Commands
- `/doordash`: Sends a friendly DoorDash link.
- `/ubereats`: Sends a friendly Uber Eats link.
- `/bot`: Shows bot status and allows admins to update it.
- `/support`: Requests moderation support in-game.

### Permission System
- `/permission`: Allows users to request special permissions for roleplay.

### Welcome System
- Automatically welcomes new members with a customized message.

## Setup

1. **Prerequisites**
   - Node.js (v16.0.0 or higher)
   - Discord.js library (v14.0.0 or higher)
   - A Discord Bot Token

2. **Installation**   ```
   git clone [repository-url]
   cd [repository-name]
   npm install   ```

3. **Configuration**
   - Create a `.env` file in the root directory with the following:     ```
     TOKEN=your_bot_token_here
     CLIENT_ID=your_client_id_here
     GUILD_ID=your_guild_id_here     ```
   - Update `config.json` with your specific settings.

4. **Running the Bot**   ```
   node bot.js   ```

5. **Deploying Commands**   ```
   node deploy-commands.js   ```

## Command Structure
Commands are organized in the `slashcommands/` directory, with subdirectories for different categories (e.g., `command`, `moderation`, `erlc`). Each command is a separate JavaScript file exporting an object with `data` and `execute` properties.

## Permissions
Many commands are restricted to specific user IDs or roles. Ensure proper permissions are set in your Discord server and within the command files.

## Error Handling
The bot includes robust error handling and logging. Check the console for any error messages during operation.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## Support
For support, please create an issue in the GitHub repository or contact the bot creator through Discord.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
---

Created by Angelandidk for Georgia State Roleplay
