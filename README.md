# Ntfy App

A cross-platform desktop client for [ntfy.sh](https://ntfy.sh) and self-hosted ntfy instances. Built with [Rust](https://www.rust-lang.org/), [Tauri](https://tauri.app/), and [Next.js](https://nextjs.org/).

Automatic updates are disabled by default to reduce background activity, external requests to GitHub, and unnecessary resource usage. Update checking and installation are user controlled through the system tray.

[![GitHub License](https://img.shields.io/github/license/rubix-studios-pty-ltd/ntfy-app)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/rubix-studios-pty-ltd/ntfy-app)](https://github.com/rubix-studios-pty-ltd/ntfy-app/releases)
[![GitHub Repo Size](https://img.shields.io/github/repo-size/rubix-studios-pty-ltd/ntfy-app)](https://github.com/rubix-studios-pty-ltd/ntfy-app)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/rubix-studios-pty-ltd/ntfy-app)](https://github.com/rubix-studios-pty-ltd/ntfy-app/commits/main)

![Main Dashboard](https://github.com/user-attachments/assets/6d928dab-5ff7-449d-a4da-fd5b28d27689)
![Automation](https://github.com/user-attachments/assets/e024a569-b301-455a-b78b-08deb7dfa1ca)
![Logs](https://github.com/user-attachments/assets/7382bf8d-90e1-4c65-9639-7126d6aafc12)
![Schedule](https://github.com/user-attachments/assets/c84ba8cc-e082-4d60-a860-d9628b7b07da)
![Light Theme](https://github.com/user-attachments/assets/927e06ad-680e-4f56-b43b-9dc159d0c27c)

## Features

- **Notifications**: Receive native desktop notifications from any ntfy topic
- **Webhook Builder**: Generate authenticated webhook URLs for your topics
- **Schedules**: Schedule working hours for notification alerts and suppression
- **Self-hosted**: Connect to your own ntfy instance or use ntfy.sh
- **Cross-platform**: Windows, Linux, and macOS (Intel & Apple Silicon)
- **System Tray**: Runs quietly in the background with tray controls
- **Lightweight**: Built with Rust and Tauri for minimal resource usage
- **Modern UI**: Next.js, React, and Tailwind CSS

## In Development (Beta)

- **Automations**: Trigger local programs, scripts, URLs, and system actions
  based on incoming ntfy messages

> **Note:** Automation topics should be reserved and access-controlled.
> For self-hosted instances, use ntfy ACL to restrict publish access
> to trusted users only.

## macOS

macOS may block unsigned applications on first launch. Open Terminal and run the following command once before opening the app:

```bash
xattr -cr "/Applications/Ntfy App.app"
```

## Prerequisites

- **Node.js** 24.22.1 or later (24.x), or 26.12.1 or later
- **pnpm** 10.x or later
- **Rust** 1.99.1 or later (for building)

### From Releases

Download the latest release for your operating system from the [releases page](https://github.com/rubix-studios-pty-ltd/ntfy-app/releases).

### From Source

1. **Clone the repository:**

   ```bash
   git clone https://github.com/rubix-studios-pty-ltd/ntfy-app.git
   cd ntfy-app
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Build the application:**

   ```bash
   pnpm build
   ```

   The executable will be created in `src-tauri/target/release/`.

## Development

### Rust Tools

Install Rust toolchain:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

For macOS, also install additional targets:

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
```

### Running Development

Start the development server:

```bash
pnpm dev
```

This will:
- Start the Next.js dev server on `http://localhost:5173`
- Launch the Tauri development window with hot-reload

### Scripts

```bash
# Development
pnpm dev          # Start development server with Tauri
pnpm dev:ui       # Start Next.js dev server only (port 5173)

# Building
pnpm build        # Build the full Tauri application
pnpm build:ui     # Build Next.js frontend only

# Format and Lint
pnpm lint         # Run linter (Biome)
pnpm lint:fix     # Fix linting issues automatically
pnpm format       # Format code with Biome
pnpm typecheck    # Check TypeScript types

# Maintenance
pnpm update       # Update dependencies interactively
```

## Structure

```text
ntfy-app/
├── app/                    # Next.js
├── assets/                 # Assets
├── components/             # React UI
├── hooks/                  # Custom hooks
├── lib/
│   ├── constant/           # Constants
│   └── tauri/              # Tauri IPC
├── modules/                # Automation
├── schema/                 # Validation
├── scripts/                # Scripts
├── src-tauri/              # Rust/Tauri
│   ├── capabilities/       # Tauri permissions
│   └── src/
│       ├── automation/     # Automation engine
│       ├── commands/       # Tauri IPC
│       ├── db/             # Database
│       ├── modules/        # Automation modules
│       ├── ntfy/           # Integration
│       ├── storage/        # Storage
│       ├── tray/           # System tray
│       └── windows/        # Window management
├── styles/                 # Styles
├── types/                  # Definitions
└── utils/                  # Helper functions
```

## Contributing

We welcome contributions! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting and type checking:

   ```bash
   pnpm lint:fix
   pnpm typecheck
   ```

5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Security

Please refer to [SECURITY.md](SECURITY.md) for security vulnerability reporting guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes and version history.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support or inquiries:
- LinkedIn: [rubixvi](https://www.linkedin.com/in/rubixvi/)
- Website: [Rubix Studios](https://rubixstudios.com.au)

## Author

Rubix Studios  
[https://rubixstudios.com.au](https://rubixstudios.com.au)
