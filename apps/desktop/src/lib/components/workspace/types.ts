export type ItemKind = "thread" | "run"

export type NavigationItem = {
  id: string
  kind: ItemKind
  title: string
  status: string
}

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}
