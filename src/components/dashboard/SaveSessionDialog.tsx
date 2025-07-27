
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";

interface SaveSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sessionName: string) => void;
  onCancel: () => void;
  defaultName: string;
}

export function SaveSessionDialog({
  open,
  onOpenChange,
  onSave,
  onCancel,
  defaultName,
}: SaveSessionDialogProps) {
  const [sessionName, setSessionName] = useState(defaultName);

  useEffect(() => {
    if (open) {
      setSessionName(defaultName);
    }
  }, [open, defaultName]);

  const handleSave = () => {
    if (sessionName.trim()) {
      onSave(sessionName.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Session</DialogTitle>
          <DialogDescription>
            Give your session a name to save it for future review.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="session-name" className="text-right">
              Name
            </Label>
            <Input
              id="session-name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
             <X className="mr-2 h-4 w-4" />
             Discard
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
