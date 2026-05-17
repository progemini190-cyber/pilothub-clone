import { useEffect } from "react";
import { useLocation } from "wouter";

/** Legacy /apply route — redirects to sign up. */
export default function Apply() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/sign-up");
  }, [setLocation]);
  return null;
}
