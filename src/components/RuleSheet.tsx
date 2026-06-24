// src/components/RulesSheet.tsx
import { useState, useMemo } from 'react';
import { useRules } from '../features/hooks/useRules';
import type { Transaction, CategoryRuleResponse } from '@/types';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  SlidersHorizontal,
  Trash2,
  Loader2,
  Check,
  ChevronsUpDown,
  AlertCircle
} from 'lucide-react';

// ---------------------------------------------------------------------------
// 1. RuleForm (Combobox + Keyword Input)
// ---------------------------------------------------------------------------
interface RuleFormProps {
  transactions: Transaction[];
  onSubmit: (keyword: string, category: string) => Promise<{ success: boolean; error: string | null }>;
  onRuleCreated: () => void;
}

function RuleForm({ transactions, onSubmit, onRuleCreated }: RuleFormProps) {
  const [keyword, setKeyword] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [openCombobox, setOpenCombobox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const suggestedCategories = useMemo(() => {
    const populated = transactions
      .map((tx) => tx.category?.trim())
      .filter((cat): cat is string => Boolean(cat) && cat.length > 0);

    return Array.from(new Set(populated)).sort();
  }, [transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKeyword = keyword.trim();
    const cleanCategory = categoryInput.trim();

    if (!cleanKeyword || !cleanCategory) return;

    setIsSubmitting(true);
    setFormError(null);

    const { success, error } = await onSubmit(cleanKeyword, cleanCategory);

    if (success) {
      setKeyword('');
      setCategoryInput('');
      onRuleCreated();
    } else {
      setFormError(error);
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-[#1c1c1b] border border-white/10 rounded-xl shrink-0">
      <h4 className="text-xs font-medium uppercase tracking-widest text-[#a09d98]">
        Create New Automation Rule
      </h4>

      {formError && (
        <Alert variant="destructive" className="bg-red-950/40 border-red-900/50 text-red-400 py-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <AlertDescription className="text-xs ml-2">{formError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Input
            placeholder="Keyword (e.g. атб)"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              if (formError) setFormError(null);
            }}
            className="bg-[#0f0f0e] border-white/10 text-[#f0ede8] focus-visible:ring-1 focus-visible:ring-white/20 h-9 text-sm"
          />
        </div>

        <div>
          <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between bg-[#0f0f0e] border-white/10 text-[#f0ede8] hover:bg-white/5 hover:text-[#f0ede8] h-9 text-sm font-normal px-3 truncate"
              >
                {categoryInput || <span className="text-[#6b6864]">Assign category...</span>}
                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[200px] p-0 bg-[#1c1c1b] border-white/10 text-[#f0ede8]">
              <Command>
                <CommandInput
                  placeholder="Search or type new..."
                  value={categoryInput}
                  onValueChange={setCategoryInput}
                  className="text-xs"
                />
                <CommandList>
                  <CommandEmpty className="p-2 text-xs text-[#6b6864] text-center">
                    Press enter to use "{categoryInput}"
                  </CommandEmpty>
                  <CommandGroup heading="Existing Categories">
                    {suggestedCategories.map((cat) => (
                      <CommandItem
                        key={cat}
                        value={cat}
                        onSelect={(currentValue) => {
                          setCategoryInput(currentValue);
                          setOpenCombobox(false);
                        }}
                        // Fixed: cmdk/Radix native highlight targets
                        className="text-xs text-[#f0ede8] hover:bg-white/5 aria-selected:bg-white/10 data-[highlighted]:bg-white/5"
                      >
                        <Check className={`mr-2 h-3 w-3 ${categoryInput === cat ? 'opacity-100' : 'opacity-0'}`} />
                        {cat}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !keyword.trim() || !categoryInput.trim()}
        // Fixed: Adjusted font-medium to prevent visual bleeding
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium h-9 text-xs transition-colors disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply Rule & Sweep Ledger'}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 2. RuleItem
// ---------------------------------------------------------------------------
function RuleItem({ rule, onDelete }: { rule: CategoryRuleResponse; onDelete: (id: number) => void }) {
  return (
    <div className="flex items-center justify-between p-3 border border-white/5 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors">
      <div className="flex items-center space-x-3 truncate">
        <Badge variant="outline" className="font-mono text-xs text-blue-400 border-blue-500/30 bg-blue-500/10 px-2 py-0.5">
          {rule.keyword}
        </Badge>
        <span className="text-xs text-[#6b6864]">→</span>
        <span className="text-xs font-medium text-[#f0ede8] truncate">{rule.assigned_category}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(rule.id)}
        className="text-[#6b6864] hover:text-red-400 hover:bg-red-950/30 h-7 w-7 p-0 shrink-0"
        title="Delete rule"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. RuleList (Fully Flex-Resilient Wrapper)
// ---------------------------------------------------------------------------
interface RuleListProps {
  rules: CategoryRuleResponse[];
  isLoading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
}

function RuleList({ rules, isLoading, error, onDelete }: RuleListProps) {
  // Fixed: Surfaced mount failures explicitly
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border border-red-900/30 rounded-xl bg-red-950/10 my-auto">
        <AlertCircle className="h-6 w-6 text-red-400 mb-2 opacity-80" />
        <p className="text-xs font-medium text-red-300">Vault Sync Interrupted</p>
        <p className="text-[11px] text-red-400/80 mt-0.5 max-w-[220px]">
          {error}
        </p>
      </div>
    );
  }

  if (isLoading && rules.length === 0) {
    return (
      <div className="flex justify-center py-12 text-[#6b6864] my-auto">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-xl bg-black/20 my-auto">
        <SlidersHorizontal className="h-8 w-8 text-[#6b6864] mb-2 stroke-[1.5]" />
        <p className="text-xs font-medium text-[#a09d98]">No active blueprints</p>
        <p className="text-[11px] text-[#6b6864] mt-0.5 max-w-[200px]">
          Keywords taught to the engine will appear here.
        </p>
      </div>
    );
  }

  return (
    // Fixed: flex flex-col h-full min-h-0 allows the inner flex-1 to calculate correctly
    <div className="space-y-2 flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex justify-between items-center px-1 shrink-0">
        <span className="text-xs font-medium uppercase tracking-widest text-[#a09d98]">Active Blueprints</span>
        <span className="text-xs font-mono text-[#6b6864]">{rules.length} total</span>
      </div>
      {/* Fixed: Replaced static max-h with flexible viewport consumption */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
        {rules.map((rule) => (
          <RuleItem key={rule.id} rule={rule} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. RulesSheet (Master Wrapper)
// ---------------------------------------------------------------------------
interface RulesSheetProps {
  transactions: Transaction[];
  onRuleCreated: () => void;
}

export default function RulesSheet({ transactions, onRuleCreated }: RulesSheetProps) {
  // Fixed: Grabbed error state to pass down to list
  const { rules, isLoading, error, createRule, deleteRule } = useRules();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="bg-[#1c1c1b] border-white/10 text-[#f0ede8] hover:bg-white/10 hover:text-white gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
          Rules Engine
        </Button>
      </SheetTrigger>

      {/* Fixed: Tightened space-y-6 to space-y-4 for narrow mobile viewports */}
      <SheetContent className="w-full sm:max-w-md bg-[#0f0f0e] border-l border-white/10 text-[#f0ede8] p-6 flex flex-col space-y-4">
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-lg font-semibold tracking-tight text-[#f0ede8]">
            Categorization Rules
          </SheetTitle>
          <SheetDescription className="text-xs text-[#6b6864]">
            Automate your ledger. New rules instantly execute a retroactive sweep across all uncategorized historical data.
          </SheetDescription>
        </SheetHeader>

        <RuleForm
          transactions={transactions}
          onSubmit={createRule}
          onRuleCreated={onRuleCreated}
        />

        {/* min-h-0 passes the flexbox collapse boundary down to RuleList */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <RuleList
            rules={rules}
            isLoading={isLoading}
            error={error}
            onDelete={deleteRule}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}