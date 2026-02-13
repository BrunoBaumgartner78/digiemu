"use client"

import { useEffect } from "react"
import applyTraceRepeatPatch from "@/lib/traceRepeatPatch"

export default function TraceRepeatClient() {
  useEffect(() => {
    applyTraceRepeatPatch()
  }, [])

  return null
}
