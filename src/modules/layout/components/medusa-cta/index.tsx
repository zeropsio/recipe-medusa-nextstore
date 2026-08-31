import { Text } from "@modules/common/components/ui"

import Medusa from "../../../common/icons/medusa"
import NextJs from "../../../common/icons/nextjs"

const MedusaCTA = () => {
  return (
    <Text className="flex flex-wrap gap-x-2 txt-compact-small-plus items-center">
      Powered by
      <a href="https://www.medusajs.com" target="_blank" rel="noreferrer">
        <Medusa fill="#9ca3af" className="fill-[#9ca3af]" />
      </a>
      &
      <a href="https://nextjs.org" target="_blank" rel="noreferrer">
        <NextJs fill="#9ca3af" />
      </a>
      <span className="text-ui-fg-muted">·</span>
      <a
        href="https://docs.zerops.io"
        target="_blank"
        rel="noreferrer"
        className="text-ui-fg-muted hover:text-ui-fg-subtle"
      >
        Hosted on Zerops
      </a>
    </Text>
  )
}

export default MedusaCTA
