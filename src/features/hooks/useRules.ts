import { useState, useCallback, useEffect } from 'react';
import { getRules, createCategoryRule, deleteCategoryRule } from '@/api/client';
import { getApiError} from "@/api/errors";
import type { CategoryRuleResponse } from '@/types'

export function useRules() {
    const [rules, setRules] = useState<CategoryRuleResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRules = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getRules();
            setRules(data);
        } catch (err: unknown) {
            const { message } = getApiError(err);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Self-contained data hydration on mount
    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    const createRule = async (keyword: string, category: string)=> {
        setError(null);
        try {
            const newRule = await createCategoryRule({
                keyword,
                assigned_category: category,
                is_active: true,
            });
            // Optimistically Snap the blueprint to the to of local state
            setRules((prev) => [newRule, ...prev]);
            return { success: true, error: null };
        } catch (err: unknown) {
            const { status } = getApiError(err);
            if (status === 409) {
                return { success: false, error: 'A rule for this exact keyword already exists.'};
            }
            return { success: false, error: 'Failed to broadcast rule to the engine.'};
        }
    };

    const deleteRule = async (ruleId: number) => {
        try {
            // Optimistic UI: instantly strip it from the retinas
            setRules((prev) => prev.filter((r) => r.id !== ruleId));
            await deleteCategoryRule(ruleId);
        } catch (err: unknown) {
            fetchRules();
        }
    };

    return {
        rules,
        isLoading,
        error,
        fetchRules,
        createRule,
        deleteRule,
    };
}