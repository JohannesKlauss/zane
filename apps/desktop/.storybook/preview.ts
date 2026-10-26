import type { Preview } from "@storybook/sveltekit"

import "../src/routes/layout.css"

const preview: Preview = {
  globalTypes: {
    appearance: {
      description: "Application appearance",
      toolbar: {
        icon: "circlehollow",
        dynamicTitle: true,
        items: [
          { value: "system", title: "System" },
          { value: "light", title: "Supaterm light" },
          { value: "dark", title: "Midnight" },
        ],
      },
    },
  },
  initialGlobals: { appearance: "system" },
  beforeAll: async () => {
    // The Vitest runner does not load preview-head.html. Load the same classic
    // script there instead of maintaining another appearance implementation.
    if (!window.zaneAppearance) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "/appearance.js"
        script.onload = () => {
          script.remove()
          resolve()
        }

        script.onerror = () => reject(new Error("Could not load the appearance bootstrap"))
        document.head.append(script)
      })
    }
  },
  beforeEach: ({ globals }) => {
    const previous = window.zaneAppearance.getPreference()
    const appearance = globals.appearance

    window.zaneAppearance.setPreference(
      appearance === "light" || appearance === "dark" ? appearance : "system",
    )

    return () => window.zaneAppearance.setPreference(previous)
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
}

export default preview
