import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { User } from "lucide-react"
import { generateAcademicSessions, getRoleColor, getRoleIcon } from "../../../../../utils/RoleHelpers"
import PersonalDetailsForm from "./PersonalDetailsForm"
import { Badge } from "../../../../../components/ui/badge"

export default function PersonalDetailsTab({ userData }) {
  const academicSessions = generateAcademicSessions()

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex justify-start items-center gap-2">
        <div className="flex justify-center items-center gap-2"><User className="h-5 w-5 text-primary" />
        Personal Details</div>
        <div className="flex items-center gap-2">
        <Badge className={`${getRoleColor(userData?.role)} gap-1 text-sm px-3 py-1`}>
          {getRoleIcon(userData?.role, "h-4 w-4")}
          {userData?.role?.charAt(0).toUpperCase() + userData?.role?.slice(1)}
        </Badge>
       
      </div>
          
        </CardTitle>
      
      </CardHeader>

      <CardContent>
        <PersonalDetailsForm
          userData={userData}
          academicSessions={academicSessions}
        />
      </CardContent>
    </Card>
  )
}
