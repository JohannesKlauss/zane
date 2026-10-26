<script lang="ts">
  import { onMount } from "svelte"

  let preference = $state<"system" | "light" | "dark">("system")

  onMount(() => {
    const update = () => {
      preference = window.zaneAppearance.getPreference()
    }

    update()
    window.addEventListener("zane:appearance-change", update)

    return () => window.removeEventListener("zane:appearance-change", update)
  })
</script>

<label class="flex items-center gap-2 text-sm text-muted-foreground">
  Appearance
  <select
    class="h-8 rounded-control border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
    value={preference}
    onchange={(event) => {
      const value = event.currentTarget.value

      if (value === "system" || value === "light" || value === "dark") {
        window.zaneAppearance.setPreference(value)
      }
    }}
  >
    <option value="system">System</option>
    <option value="light">Light · Supaterm</option>
    <option value="dark">Dark · Midnight</option>
  </select>
</label>
