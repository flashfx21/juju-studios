// ABOUTME: Top-level screen. For now a holding page with the studio name and build version.
// ABOUTME: Host and phone routing will live in src/app once the engine exists.
import packageInfo from '../package.json'

function App() {
  return (
    <main className="holding-page">
      <h1 className="holding-page__logo">JuJu Studios</h1>
      <p className="holding-page__tagline">Game night is being built. Check back soon.</p>
      <p className="holding-page__version" data-testid="app-version">
        v{packageInfo.version}
      </p>
    </main>
  )
}

export default App
