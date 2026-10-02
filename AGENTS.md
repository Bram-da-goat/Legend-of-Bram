# The Legend of Bram browser release workflow

- The user switched the project to a browser game. Do not create or launch Windows installers.
- Build with `npm run build`; use Vite for local play on http://127.0.0.1:5174/.
- Run unit tests and the isolated browser playtest after gameplay changes.
- Preserve the existing V4 localStorage save keys and support JSON backup imports.
- Keep relative asset paths for the existing GitHub Pages repository path.
- Only push or publish when the user requests publication. Never test using player saves.
