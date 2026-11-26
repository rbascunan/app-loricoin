import { Fragment, type ReactNode } from "react"

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|`[^`]+`)/g).map((part, i) => {
    if (/^(\*\*|__).+(\*\*|__)$/.test(part)) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (/^\*.+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>
    if (/^`.+`$/.test(part)) {
      return (
        <code key={i} className="rounded bg-background/70 px-1 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: { text: string; depth: number }[] }

function parse(markdown: string): Block[] {
  const blocks: Block[] = []
  for (const raw of markdown.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd()
    if (!line.trim() || /^\s*(-{3,}|\*{3,})\s*$/.test(line)) continue

    const heading = line.match(/^\s*#{1,6}\s+(.*)$/)
    if (heading) {
      blocks.push({ kind: "heading", text: heading[1].replace(/\*\*/g, "") })
      continue
    }

    const item = line.match(/^(\s*)([-*•]|\d+[.)])\s+(.*)$/)
    if (item) {
      const ordered = /\d/.test(item[2])
      const depth = Math.min(2, Math.floor(item[1].replace(/\t/g, "  ").length / 2))
      const last = blocks[blocks.length - 1]
      if (last?.kind === "list" && (depth > 0 || last.ordered === ordered)) {
        last.items.push({ text: item[3], depth })
      } else {
        blocks.push({ kind: "list", ordered, items: [{ text: item[3], depth }] })
      }
      continue
    }

    const last = blocks[blocks.length - 1]
    if (last?.kind === "paragraph") last.text += ` ${line.trim()}`
    else blocks.push({ kind: "paragraph", text: line.trim() })
  }
  return blocks
}

export function LoriaMarkdown({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed">
      {parse(content).map((block, i) => {
        if (block.kind === "heading") {
          return (
            <p key={i} className="mt-1 font-semibold text-primary">
              {renderInline(block.text)}
            </p>
          )
        }
        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul"
          return (
            <List
              key={i}
              className={`flex flex-col gap-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"} marker:text-primary`}
            >
              {block.items.map((it, j) => (
                <li key={j} style={{ marginLeft: `${it.depth * 1}rem` }}>
                  {renderInline(it.text)}
                </li>
              ))}
            </List>
          )
        }
        return <p key={i}>{renderInline(block.text)}</p>
      })}
    </div>
  )
}
