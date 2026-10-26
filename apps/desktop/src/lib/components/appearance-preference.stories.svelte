<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf"
  import { expect, userEvent, within } from "storybook/test"

  import AppearancePreference from "./appearance-preference.svelte"

  const { Story } = defineMeta({
    title: "Components/Appearance preference",
    component: AppearancePreference,
    play: async ({ canvasElement }) => {
      const select = within(canvasElement).getByRole("combobox", { name: "Appearance" })

      for (const preference of ["dark", "light", "system"]) {
        await userEvent.selectOptions(select, preference)
        await expect(select).toHaveValue(preference)
        await expect(window.zaneAppearance.getPreference()).toBe(preference)
      }
    },
  })
</script>

<Story name="Default" />
