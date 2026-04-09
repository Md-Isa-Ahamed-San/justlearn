"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, Calendar, User, Building, BookOpen } from "lucide-react"

export default function UserDetailsModal({ user, isOpen, onClose }) {
  if (!user) return null

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getRoleData = (user) => {
    if (user.student) return user.student
    if (user.instructor) return user.instructor
    if (user.admin) return user.admin
    return null
  }

  const roleData = getRoleData(user)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="flex items-start space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.image || roleData?.profilePicture} />
              <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
                {user.provider === "google" && <Badge variant="outline">Google Account</Badge>}
              </div>
            </div>
          </div>

          {/* Role-specific Information */}
          {roleData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{user.role.charAt(0).toUpperCase() + user.role.slice(1)} Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Department:</strong> {roleData.department}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>ID Number:</strong> {roleData.idNumber}
                    </span>
                  </div>
                  {roleData.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Phone:</strong> {roleData.phone}
                      </span>
                    </div>
                  )}
                  {roleData.designation && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Designation:</strong> {roleData.designation}
                      </span>
                    </div>
                  )}
                  {roleData.session && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Session:</strong> {roleData.session}
                      </span>
                    </div>
                  )}
                </div>

                {roleData.bio && (
                  <div>
                    <h4 className="font-medium mb-2">Bio</h4>
                    <p className="text-sm text-muted-foreground">{roleData.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Joined:</strong> {formatDate(user.createdAt)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Last Updated:</strong> {formatDate(user.updatedAt)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Provider:</strong> {user.provider}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
