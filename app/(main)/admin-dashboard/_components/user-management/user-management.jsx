import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, UserCheck, Users } from "lucide-react";

import UserManagementStats from "./_components/user-management-stats";
import UserTable from "./_components/user-table";

export default async function UserManagement({ users }) {
  
  return (
    <div className="space-y-4 sm:space-y-6">
      <UserManagementStats users={users} />

      <UserTable users={users} />
    </div>
  );
}
