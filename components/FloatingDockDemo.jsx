import { FloatingDock } from "@/components/ui/floating-dock"

export default function FloatingDockDemo({links}) {
  
  return (
   
      <FloatingDock
        mobileClassName="translate-y-20"
        items={links}
      />
   
  )
}
