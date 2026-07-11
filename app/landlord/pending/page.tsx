import { Clock, AlertCircle } from "lucide-react";

export default function PendingVerification() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center p-8">
      <div className="rounded-full bg-amber-gold/10 p-6 mb-6">
        <Clock className="h-12 w-12 text-amber-gold" />
      </div>
      
      <h1 className="text-2xl font-bold text-deep-navy mb-2">Account Under Review</h1>
      <p className="text-ink/70 max-w-md mb-8">
        Thank you for registering with HomePlace254. Your account is currently being verified by our admin team. 
        You will be able to access your dashboard once your KYC documents are approved.
      </p>

      <div className="rounded-lg bg-mist-white border border-ocean-blue/10 p-6 max-w-sm w-full">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-ocean-blue mt-0.5" />
          <div className="text-left">
            <h3 className="font-semibold text-deep-navy text-sm">Next Steps</h3>
            <p className="text-xs text-ink/70 mt-1">
              Please ensure you have uploaded your National ID and Title Deed/Authorization Letter in the KYC section once it becomes available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}