"use client"

import { CheckCircle2, X, Search } from "lucide-react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useGV } from "@/store/gv"

export function CheckoutSuccessModal() {
  const { activeModal, closeModal } = useGV()
  const open = activeModal === "checkout-success"

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="max-w-sm p-0 shadow-2xl sm:rounded-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-primary px-6 py-8 text-center text-white">
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <DialogTitle className="text-xl font-bold">
            Abo aktiviert!
          </DialogTitle>
          <DialogDescription className="mt-1 text-white/85">
            Alle Kontaktdaten sind jetzt freigeschaltet.
          </DialogDescription>
        </div>
        <div className="space-y-3 p-6">
          <p className="text-center text-sm text-muted-foreground">
            Du kannst jetzt alle Vermieter-Telefonnummern, E-Mail-Adressen und
            Original-Links einsehen. Viel Erfolg bei der Wohnungssuche!
          </p>
          <Button className="w-full gap-2" onClick={closeModal}>
            <Search className="h-4 w-4" />
            Weiter suchen
          </Button>
        </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
