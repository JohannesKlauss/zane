if (!window.zaneAppearance) {
  const storageKey = "zane.appearance"
  const root = document.documentElement
  const system = window.matchMedia("(prefers-color-scheme: dark)")

  /**
   * @param {string | null} value
   * @returns {"system" | "light" | "dark"}
   */
  function normalizePreference(value) {
    return value === "light" || value === "dark" ? value : "system"
  }

  /** @returns {"system" | "light" | "dark"} */
  function readPreference() {
    try {
      return normalizePreference(localStorage.getItem(storageKey))
    } catch {
      return "system"
    }
  }

  let preference = readPreference()

  function apply() {
    const appearance = preference === "system" ? (system.matches ? "dark" : "light") : preference

    root.classList.toggle("dark", appearance === "dark")
    root.dataset.appearance = appearance
    root.dataset.appearancePreference = preference
    root.style.colorScheme = appearance
    window.dispatchEvent(new Event("zane:appearance-change"))
  }

  window.zaneAppearance = {
    getPreference: () => preference,
    setPreference(nextPreference) {
      preference = normalizePreference(nextPreference)

      try {
        if (preference === "system") {
          localStorage.removeItem(storageKey)
        } else {
          localStorage.setItem(storageKey, preference)
        }
      } catch {}

      apply()
    },
  }

  system.addEventListener("change", () => {
    if (preference === "system") {
      apply()
    }
  })

  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) {
      preference = readPreference()
      apply()
    }
  })

  apply()
}
