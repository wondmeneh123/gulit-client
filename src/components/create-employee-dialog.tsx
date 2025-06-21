import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: EmployeeFormData & { id?: string } | null;
}

interface EmployeeFormData {
  username: string;
  password: string;
  fullName: string;
  
  phoneNumber: string;
  role: 'ADMIN' | 'CASHIER' | 'ACCOUNTANT';
}

export function CreateEmployeeDialog({ isOpen, onClose, onSuccess, initialData }: CreateEmployeeDialogProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    username: '',
    password: '',
    fullName: '',
    
    phoneNumber: '',
    role: 'CASHIER',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || '',
        password: '', // Don't prefill password
        fullName: initialData.fullName || '',
        phoneNumber: initialData.phoneNumber || '',
        role: initialData.role || 'CASHIER',
      });
    } else {
      setFormData({
        username: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        role: 'CASHIER',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData && initialData.id) {
        // Update
        await userService.updateProfile({ id: initialData.id, ...formData });
        toast.success('Employee updated successfully');
      } else {
        // Create
        await userService.createUser(formData);
        toast.success('Employee created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === "fullName") {
        // Generate username: lowercase, spaces to dots, add 2 random digits
        const base = value.trim().toLowerCase().replace(/\s+/g, ".");
        const randomDigits = Math.floor(10 + Math.random() * 90); // 2 digits
        return {
          ...prev,
          fullName: value,
          username: base ? `${base}${randomDigits}` : "",
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value as 'ADMIN' | 'CASHIER' | 'ACCOUNTANT',
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

      

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASHIER">Cashier</SelectItem>
                <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 