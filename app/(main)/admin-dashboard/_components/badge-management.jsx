"use client";

import { createBadge, deleteBadge, getAllBadges, seedBadges, updateBadge } from "@/app/actions/badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Medal, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function BadgeManagement() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", icon: "🏅", points: 0 });
  const [submitting, setSubmitting] = useState(false);

  const fetchBadges = async () => {
    setLoading(true);
    const result = await getAllBadges();
    if (result.success) setBadges(result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleSeedBadges = async () => {
    const result = await seedBadges();
    if (result.success) {
      toast.success("Default badges seeded successfully!");
      fetchBadges();
    } else {
      toast.error("Failed to seed badges");
    }
  };

  const openCreate = () => {
    setEditingBadge(null);
    setForm({ name: "", description: "", icon: "🏅", points: 0 });
    setDialogOpen(true);
  };

  const openEdit = (badge) => {
    setEditingBadge(badge);
    setForm({ name: badge.name, description: badge.description, icon: badge.icon, points: badge.points });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Name and description are required");
      return;
    }
    setSubmitting(true);
    try {
      let result;
      if (editingBadge) {
        result = await updateBadge(editingBadge.id, form);
      } else {
        result = await createBadge(form);
      }
      if (result.success) {
        toast.success(editingBadge ? "Badge updated!" : "Badge created!");
        setDialogOpen(false);
        fetchBadges();
      } else {
        toast.error(result.error || "Failed to save badge");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this badge? All user earnings for this badge will also be removed.")) return;
    const result = await deleteBadge(id);
    if (result.success) {
      toast.success("Badge deleted");
      fetchBadges();
    } else {
      toast.error("Failed to delete badge");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Medal className="h-5 w-5" />
          Badge Management
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSeedBadges}>
            Seed Defaults
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> New Badge
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading badges…</p>
        ) : badges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-3">No badges yet. Click "Seed Defaults" to add starter badges.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="text-3xl">{badge.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{badge.name}</p>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(badge)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(badge.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{badge.description}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {badge._count?.userBadges || 0} earned
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBadge ? "Edit Badge" : "Create Badge"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Badge name" />
              </div>
              <div className="space-y-1.5">
                <Label>Icon (emoji)</Label>
                <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🏅" className="text-center text-lg" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this badge represent?" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving…" : editingBadge ? "Save Changes" : "Create Badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
