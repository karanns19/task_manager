import { useState, useCallback } from 'react';

// Custom hook for managing multiple loading states
export const useLoadingStates = (initialStates = {}) => {
    const [loadingStates, setLoadingStates] = useState(initialStates);

    // Set loading state for a specific action
    const setLoading = useCallback((action, isLoading) => {
        setLoadingStates(prev => ({
            ...prev,
            [action]: isLoading
        }));
    }, []);

    // Set multiple loading states at once
    const setMultipleLoading = useCallback((states) => {
        setLoadingStates(prev => ({
            ...prev,
            ...states
        }));
    }, []);

    // Check if a specific action is loading
    const isLoading = useCallback((action) => {
        return loadingStates[action] || false;
    }, [loadingStates]);

    // Check if any action is loading
    const isAnyLoading = useCallback(() => {
        return Object.values(loadingStates).some(state => state === true);
    }, [loadingStates]);

    // Check if multiple specific actions are loading
    const areLoading = useCallback((actions) => {
        return actions.some(action => loadingStates[action]);
    }, [loadingStates]);

    // Reset all loading states
    const resetLoading = useCallback(() => {
        setLoadingStates(initialStates);
    }, [initialStates]);

    // Reset specific loading states
    const resetLoadingStates = useCallback((actions) => {
        setLoadingStates(prev => {
            const newStates = { ...prev };
            actions.forEach(action => {
                newStates[action] = false;
            });
            return newStates;
        });
    }, []);

    // Async wrapper for operations with loading state
    const withLoading = useCallback(async (action, operation) => {
        try {
            setLoading(action, true);
            const result = await operation();
            return result;
        } finally {
            setLoading(action, false);
        }
    }, [setLoading]);

    // Batch operations with loading states
    const withBatchLoading = useCallback(async (actions, operations) => {
        try {
            setMultipleLoading(
                actions.reduce((acc, action) => ({ ...acc, [action]: true }), {})
            );
            
            const results = await Promise.all(operations);
            return results;
        } finally {
            setMultipleLoading(
                actions.reduce((acc, action) => ({ ...acc, [action]: false }), {})
            );
        }
    }, [setMultipleLoading]);

    return {
        loadingStates,
        setLoading,
        setMultipleLoading,
        isLoading,
        isAnyLoading,
        areLoading,
        resetLoading,
        resetLoadingStates,
        withLoading,
        withBatchLoading
    };
};

// Predefined loading state keys for common operations
export const LOADING_STATES = {
    // Authentication
    AUTH_LOGIN: 'auth_login',
    AUTH_REGISTER: 'auth_register',
    AUTH_LOGOUT: 'auth_logout',
    
    // Tasks
    TASKS_FETCH: 'tasks_fetch',
    TASK_CREATE: 'task_create',
    TASK_UPDATE: 'task_update',
    TASK_DELETE: 'task_delete',
    TASK_FETCH: 'task_fetch',
    
    // UI Operations
    MODAL_OPEN: 'modal_open',
    MODAL_CLOSE: 'modal_close',
    FORM_SUBMIT: 'form_submit',
    FORM_VALIDATION: 'form_validation',
    
    // Data Operations
    DATA_SYNC: 'data_sync',
    DATA_EXPORT: 'data_export',
    DATA_IMPORT: 'data_import',
    
    // Search and Filter
    SEARCH: 'search',
    FILTER: 'filter',
    SORT: 'sort',
    
    // File Operations
    FILE_UPLOAD: 'file_upload',
    FILE_DOWNLOAD: 'file_download',
    FILE_PREVIEW: 'file_preview'
};

// Hook for common loading patterns
export const useCommonLoading = () => {
    const { 
        loadingStates, 
        setLoading, 
        isLoading, 
        withLoading 
    } = useLoadingStates({
        [LOADING_STATES.TASKS_FETCH]: false,
        [LOADING_STATES.TASK_CREATE]: false,
        [LOADING_STATES.TASK_UPDATE]: false,
        [LOADING_STATES.TASK_DELETE]: false,
        [LOADING_STATES.AUTH_LOGIN]: false,
        [LOADING_STATES.AUTH_REGISTER]: false
    });

    // Common loading checks
    const isTasksLoading = isLoading(LOADING_STATES.TASKS_FETCH);
    const isCreatingTask = isLoading(LOADING_STATES.TASK_CREATE);
    const isUpdatingTask = isLoading(LOADING_STATES.TASK_UPDATE);
    const isDeletingTask = isLoading(LOADING_STATES.TASK_DELETE);
    const isAuthLoading = isLoading(LOADING_STATES.AUTH_LOGIN) || isLoading(LOADING_STATES.AUTH_REGISTER);

    // Common loading operations
    const withTaskLoading = (operation) => withLoading(LOADING_STATES.TASKS_FETCH, operation);
    const withCreateLoading = (operation) => withLoading(LOADING_STATES.TASK_CREATE, operation);
    const withUpdateLoading = (operation) => withLoading(LOADING_STATES.TASK_UPDATE, operation);
    const withDeleteLoading = (operation) => withLoading(LOADING_STATES.TASK_DELETE, operation);
    const withAuthLoading = (operation) => withLoading(LOADING_STATES.AUTH_LOGIN, operation);

    return {
        loadingStates,
        setLoading,
        isLoading,
        withLoading,
        
        // Specific loading states
        isTasksLoading,
        isCreatingTask,
        isUpdatingTask,
        isDeletingTask,
        isAuthLoading,
        
        // Loading operation wrappers
        withTaskLoading,
        withCreateLoading,
        withUpdateLoading,
        withDeleteLoading,
        withAuthLoading
    };
};

export default useLoadingStates;
