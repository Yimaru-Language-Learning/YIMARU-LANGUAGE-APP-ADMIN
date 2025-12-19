import { useState } from "react"
import { Plus, Edit } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-grayScale-900">User Groups</h1>
        <Button onClick={() => setIsModalOpen(true)} className="bg-brand-500 hover:bg-brand-600">
          <Plus className="h-4 w-4" />
          Add New Group
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {mockGroups.map((group) => (
          <Card key={group.id} className="overflow-hidden shadow-sm">
            <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-600" />
            <CardContent className="p-6">
              <h3 className="mb-2 text-lg font-semibold text-grayScale-900">{group.name}</h3>
              <p className="mb-4 text-sm text-grayScale-600">{group.userCount} Users</p>
              <Button variant="outline" className="w-full">
                <Edit className="mr-2 h-4 w-4" />
                Edit Role
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Group Name
              </label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
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

