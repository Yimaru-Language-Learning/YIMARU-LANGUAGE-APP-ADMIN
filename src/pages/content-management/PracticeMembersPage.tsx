import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"

const mockMembers = [
  { id: "1", name: "John", avatar: "" },
  { id: "2", name: "Jane", avatar: "" },
  { id: "3", name: "Mike", avatar: "" },
  { id: "4", name: "Sarah", avatar: "" },
  { id: "5", name: "David", avatar: "" },
  { id: "6", name: "Emily", avatar: "" },
]

export function PracticeMembersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [memberName, setMemberName] = useState("")
  const [memberRole, setMemberRole] = useState("")

  const handleAddMember = () => {
    console.log("Add member:", { memberName, memberRole })
    setIsModalOpen(false)
    setMemberName("")
    setMemberRole("")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-grayScale-900">Practice Management</h1>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-grayScale-900">Current Members</h2>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-500 hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Add Members
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
          {mockMembers.map((member) => (
            <div key={member.id} className="flex flex-col items-center">
              <Avatar className="h-16 w-16 border-2 border-grayScale-200">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="bg-brand-100 text-brand-600">
                  {member.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="mt-2 text-sm font-medium text-grayScale-700">{member.name}</span>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Member Name
              </label>
              <Input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Enter member name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Member Role
              </label>
              <Input
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                placeholder="Enter member role"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} className="bg-brand-500 hover:bg-brand-600">
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

