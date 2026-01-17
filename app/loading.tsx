import { Plane } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="animate-bounce">
        {/* Varsa logo resmini koy, yoksa ikon */}
        <Plane size={48} className="text-red-600 rotate-[-45deg]" /> 
      </div>
      <p className="text-slate-400 font-bold text-sm tracking-widest animate-pulse">YÜKLENİYOR...</p>
    </div>
  );
}