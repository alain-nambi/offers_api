import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProCard() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 text-white">
      <h3 className="text-xl font-bold mb-2">Pro Mode</h3>
      <p className="text-blue-100 mb-6">Upgrade now to unlock all features you need.</p>
      <Button className="bg-white text-blue-600 hover:bg-gray-50 flex items-center space-x-2">
        <span>Unlock Now</span>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}