# Ntfy App

A cross-platform desktop client for [ntfy.sh](https://ntfy.sh) and self-hosted ntfy instances. Built with [Rust](https://www.rust-lang.org/), [Tauri](https://tauri.app/), and [Next.js](https://nextjs.org/).

![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-0.0.3-green)

## Features

- **Cross-platform**: Works on Windows, Linux, and macOS (Intel & Apple Silicon)
- **Notifications**: Receive ntfy.sh notifications on your desktop
- **Self-hosted**: Connect to your own ntfy instances
- **Lightweight**: Built with Rust and Tauri for optimal performance
- **Modern UI**: Built with Next.js, React, and Tailwind CSS
- **Tray Integration**: System tray as a default for unobtrusive notifications

## Prerequisites

- **Node.js** 24.x or 25.x
- **pnpm** 10.x or later
- **Rust** 1.93.1 or later (for building)

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

### Prerequisites

Install Rust toolchain:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

For macOS, also install additional targets:
```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
```

### Running in Development

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

```
ntfy-app/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility functions
├── src-tauri/              # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs         # Application entry point
│   │   ├── window.rs       # Window event handling
│   │   ├── tray.rs         # System tray setup
│   │   ├── listener.rs     # ntfy listener logic
│   │   ├── commands/       # Tauri IPC commands
│   │   └── ...
│   └── tauri.conf.json     # Tauri configuration
├── styles/                 # Global styles
├── types/                  # TypeScript types
├── utils/                  # Frontend utilities
└── scripts/                # Build/release scripts
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

Rubix Studios Pty. Ltd.  
[https://rubixstudios.com.au](https://rubixstudios.com.au)
