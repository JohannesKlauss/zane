// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  interface Window {
    zaneAppearance: {
      getPreference(): "system" | "light" | "dark"
      setPreference(preference: "system" | "light" | "dark"): void
    }
  }

  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
