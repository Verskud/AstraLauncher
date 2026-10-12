# AstraLauncher 1.0.0

A free, independent Minecraft: Java Edition launcher for Windows x64. The project is open source under the [MIT License](LICENSE). Third-party notices are available in [NOTICE.md](NOTICE.md). Russian documentation: [README.ru.md](README.ru.md).

[Download AstraLauncher 1.0.0](https://github.com/Verskud/AstraLauncher/releases/tag/v1.0.0) · [Project website](https://verskud.github.io/AstraLauncher/) · [Report a bug](https://github.com/Verskud/AstraLauncher/issues)

## Features

- Create separate instances with Fabric, Quilt, Forge, and NeoForge.
- Browse Modrinth modpacks and mods. Files downloaded from the official CurseForge website can be added to an instance.
- Manage mods, resource packs, shaders, worlds, and backups.
- Use a local profile or Ely.by and preview player skins.
- Customize themes, animations, and fonts.

## Limitations

- AstraLauncher currently supports Windows x64. Builds for macOS and Linux are not available.
- Microsoft sign-in and automatic CurseForge modpack import are not available yet.
- A local profile does not verify Minecraft ownership and cannot access servers that require official authentication.
- The launcher does not include Minecraft game files. Minecraft must be purchased separately.
- Windows may show a warning because the executable is not signed with a publisher certificate.

AstraLauncher is an unofficial Minecraft product and is not approved by, affiliated with, or associated with Mojang or Microsoft.

## Development

Requires Node.js 24, pnpm, and Windows x64.

```sh
pnpm install --frozen-lockfile
pnpm start
```

```sh
pnpm check
pnpm build
```

The portable executable is created in `release/`. Component licenses are available in Settings → About.

The website source is in `website/`. Build and preview it locally:

```sh
node website/tools/build.mjs
node website/tools/serve.mjs
```

GitHub Pages deploys the website when files in `website/` change. The executable and its checksum are published in GitHub Releases.
