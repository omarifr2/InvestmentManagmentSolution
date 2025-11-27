import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface GlobalGoalModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (year: number, amount: number) => Promise<void>;
    initialGoal: { year: number, targetAmount: number } | null;
}

export function GlobalGoalModal({ isOpen, onOpenChange, onSave, initialGoal }: GlobalGoalModalProps) {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState<string>(currentYear.toString());
    const [amount, setAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialGoal) {
                setYear(initialGoal.year.toString());
                setAmount(initialGoal.targetAmount.toString());
            } else {
                setYear(currentYear.toString());
                setAmount('');
            }
        }
    }, [isOpen, initialGoal, currentYear]);

    const handleSave = async () => {
        if (!amount) return;

        setIsLoading(true);
        try {
            await onSave(parseInt(year), parseFloat(amount));
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save goal", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Set Your Financial Goal for {year}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="goal-year">Goal Year</Label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger id="goal-year">
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                                <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="target-amount">Target Amount</Label>
                        <CurrencyInput
                            id="target-amount"
                            value={amount}
                            onChange={(val) => setAmount(val)}
                            placeholder="e.g. 150000.00"
                        />
                        <p className="text-xs text-muted-foreground">
                            Total amount you aim to reach with the sum of all your accounts this year.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} isLoading={isLoading}>Save Goal</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
