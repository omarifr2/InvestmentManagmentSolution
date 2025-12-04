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
import { Category, GoalDto, CategoryGoal } from '@/types';

interface GlobalGoalModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (year: number, contributionGoal: number, categoryGoals: CategoryGoal[]) => Promise<void>;
    initialGoal: GoalDto | null;
    categories: Category[];
}

export function GlobalGoalModal({ isOpen, onOpenChange, onSave, initialGoal, categories }: GlobalGoalModalProps) {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState<string>(currentYear.toString());
    const [contributionGoal, setContributionGoal] = useState<string>('');
    const [categoryGoals, setCategoryGoals] = useState<Record<number, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialGoal) {
                setYear(initialGoal.year.toString());
                setContributionGoal(initialGoal.contributionGoal?.toString() || '');
                const goalsMap: Record<number, string> = {};
                initialGoal.categoryGoals.forEach(g => {
                    goalsMap[g.categoryId] = g.targetAmount.toString();
                });
                setCategoryGoals(goalsMap);
            } else {
                setYear(currentYear.toString());
                setContributionGoal('');
                setCategoryGoals({});
            }
        }
    }, [isOpen, initialGoal, currentYear]);

    const handleCategoryGoalChange = (categoryId: number, value: string) => {
        setCategoryGoals(prev => ({
            ...prev,
            [categoryId]: value
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const goalsToSave: CategoryGoal[] = Object.entries(categoryGoals)
                .filter(([_, value]) => value && parseFloat(value) > 0)
                .map(([categoryId, value]) => ({
                    categoryId: parseInt(categoryId),
                    targetAmount: parseFloat(value)
                }));

            await onSave(parseInt(year), parseFloat(contributionGoal || '0'), goalsToSave);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save goal", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Set Financial Goals for {year}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
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
                        <Label htmlFor="contribution-goal" className="font-bold">Annual Contribution Goal</Label>
                        <CurrencyInput
                            id="contribution-goal"
                            value={contributionGoal}
                            onChange={(val) => setContributionGoal(val)}
                            placeholder="e.g. 25000.00"
                        />
                        <p className="text-xs text-muted-foreground">
                            The amount of new capital you plan to deposit this year.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Label className="font-bold">Category Goals</Label>
                        <p className="text-xs text-muted-foreground -mt-2">
                            Set target amounts for each category. Leave empty if no goal.
                        </p>
                        {categories.map(category => (
                            <div key={category.id} className="grid gap-2">
                                <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                                <CurrencyInput
                                    id={`category-${category.id}`}
                                    value={categoryGoals[category.id] || ''}
                                    onChange={(val) => handleCategoryGoalChange(category.id, val)}
                                    placeholder="Target Amount"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} isLoading={isLoading}>Save Goals</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
