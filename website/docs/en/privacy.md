# Privacy

Last updated: {{DATE}}. Project: {{OWNER}}. AstraLauncher is maintained by the owner of the Verskud GitHub repository in {{COUNTRY}}. Contact: {{CONTACT}}. AstraLauncher is a project name, not a registered company.

## Website

This is a static information and download website hosted on GitHub Pages. The site does not use registration, payment forms, analytics, advertising pixels, optional cookies, or localStorage. Fonts and images are served from this site. GitHub may receive technical request information, including IP addresses, and describes its Pages logs in its [Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) and [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages). AstraLauncher does not control GitHub's log retention. Links to releases and external services open third-party websites governed by their own policies.

## Data stored by the launcher

The launcher stores interface settings, local profile name, instance list, installed-file history, favorite server addresses, worlds, backups, and selected PNG skins or capes on your device. The Windows data folder is `%APPDATA%/AstraLauncher`.

For Ely.by, the launcher stores profile name and UUID. Session tokens are encrypted with Electron safeStorage using Windows facilities. Passwords and 2FA codes are not written to the settings file. The launcher has no telemetry, advertising SDK, or automatic upload of logs to the project owner. Local logs may include player names, file paths, mod versions, and game errors; review and redact them before sharing.

## External services

At your request, the launcher connects to Mojang/Microsoft and their CDNs for version manifests, game files, libraries, Java, and public skin lookups; to Fabric, Quilt, Forge, NeoForge, and Maven repositories for loader metadata and libraries; to Modrinth and its CDN for search, project versions, dependencies, and downloads; to Ely.by for the credentials you submit over HTTPS, profile and skin requests; to the official authlib-injector server to download its unmodified Java Agent for Ely.by; and to selected Minecraft servers for status checks and gameplay. CurseForge currently opens in a browser; the launcher does not access its catalog API for users.

When importing a CurseForge ZIP modpack, the launcher requests the exact file IDs listed in manifest.json from CurseForge's official website and forgecdn.net CDN. These services receive your IP address and technical request information. The launcher does not use the CurseForge Core catalog API for users.

These services receive requests directly and process them under their own policies. Installed mods, including CustomSkinLoader and e4mc, may contact additional services. AstraLauncher does not operate those services.

## Support and deletion

Support currently uses public GitHub Issues. Issue text, GitHub username, and attachments are visible to others and may remain in the project's public history. Do not post passwords, access tokens, payment details, personal contact information, documents, or a full user folder. Closing an issue does not delete it; deletion and retention depend on GitHub's features and policies.

You can disconnect Ely.by in the launcher; the local token is removed and the launcher attempts to revoke the remote session. The interface can delete local skins, instances, and backups. Deleting an instance also deletes its worlds. To remove all local data, close the launcher and game, save any worlds you need elsewhere, then delete `%APPDATA%/AstraLauncher`. Removing the executable alone does not remove this folder.

If a secret is posted publicly, edit or request removal of the post and revoke the exposed token or change the password. Contact GitHub Support for platform records. A request to AstraLauncher cannot delete data held by GitHub, Ely.by, Microsoft, Modrinth, or game servers. Applicable law determines any mandatory privacy rights.

## Children and changes

The website has no registration, mailing list, or form designed to collect children's data. Third-party services apply their own age rules. If analytics, forms, payments, account services, or other data processing are added, this policy and any consent flow must be reviewed before those features launch.
