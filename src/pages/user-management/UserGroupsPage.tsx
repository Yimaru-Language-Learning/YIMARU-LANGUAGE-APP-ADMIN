import { useState } from "react"
import { Edit, FolderOpen, Plus, Users } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Badge } from "../../components/ui/badge"

const mockGroups = [
  { id: "1", name: "Big 10", userCount: 10 },
  { id: "2", name: "Small 5", userCount: 5 },
  { id: "3", name: "Team 8", userCount: 8 },
]

export function UserGroupsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")

  const handleAddGroup = () => {
    console.log("Add group:", { groupName, groupDescription })
    setIsModalOpen(false)
    setGroupName("")
    setGroupDescription("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grayScale-600">User Groups</h1>
          <p className="text-sm text-grayScale-400">
            Organize users into groups for easier management.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-brand-500 hover:bg-brand-600 sm:w-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add New Group
        </Button>
      </div>

      {mockGroups.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center shadow-sm">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-grayScale-100">
            <FolderOpen className="h-7 w-7 text-grayScale-400" />
          </div>
          <h3 className="text-lg font-semibold text-grayScale-600">No groups found</h3>
          <p className="mt-1 max-w-sm text-sm text-grayScale-400">
            Get started by creating your first user group to organize users and manage permissions
            more efficiently.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 bg-brand-500 hover:bg-brand-600"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Create First Group
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockGroups.map((group) => (
            <Card
              key={group.id}
              className="group overflow-hidden shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-600" />
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-grayScale-600">{group.name}</h3>
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {group.userCount}
                  </Badge>
                </div>
                <p className="mb-4 text-sm text-grayScale-400">
                  {group.userCount} {group.userCount === 1 ? "User" : "Users"} in this group
                </p>
                <Button variant="outline" className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Role
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-600">
                Group Name
              </label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-600">
                Group Description
              </label>
              <Textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Enter group description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGroup} className="bg-brand-500 hover:bg-brand-600">
              Add Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
