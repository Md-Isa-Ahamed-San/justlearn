"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function RoleCard({ role, title, description, icon, isSelected, onSelect, colorScheme }) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? `ring-2 ring-${colorScheme}-500 bg-${colorScheme}-50` : ""
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 bg-${colorScheme}-100 rounded-lg`}>{icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{title}</h4>
              {isSelected && <CheckCircle className={`h-4 w-4 text-${colorScheme}-600`} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
