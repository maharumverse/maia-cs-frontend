import { IconLoader2 } from '@tabler/icons-react'

// Spinner di dalam tombol (loading.component.md, Case 2). Memakai keyframe .gate-spin yang sama.
export function ButtonSpinner() {
  return <IconLoader2 className="gate-spin" size={17} aria-hidden="true" />
}
