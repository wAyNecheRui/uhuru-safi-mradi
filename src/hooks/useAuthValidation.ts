
import { toast } from 'sonner';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export const useAuthValidation = () => {
  const validateForm = (formData: FormData, isLogin: boolean = false) => {
    if (!formData.email.trim()) {
      toast.error("Please enter your email address.");
      return false;
    }

    if (!formData.email.includes('@')) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (!formData.password) {
      toast.error("Please enter your password.");
      return false;
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        toast.error("Please enter your full name.");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match.");
        return false;
      }

      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters long.");
        return false;
      }
    }

    return true;
  };

  return { validateForm };
};
