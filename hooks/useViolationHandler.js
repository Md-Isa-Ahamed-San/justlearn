import { useCallback, useRef } from 'react';

/**
 * useViolationHandler - CORRECTED VERSION
 * This version is refactored to provide the correct data (`totalViolations`)
 * to other hooks that depend on it, like `useQuizSecurity`.
 */
export const useViolationHandler = (
    quiz,
    quizState,
    isFullscreen,
    isFullscreenSupported,
    isOffline
) => {
    const hasAutoSubmittedRef = useRef(false);

    // Helper to get violations from the correct place in the quizState object
    const getViolations = useCallback(() => {
        return quizState.sessionMetadata?.violations || [];
    }, [quizState.sessionMetadata]);

    // Calculate the total violations
    const totalViolations = getViolations().length;

    // This function now correctly calls the `addViolation` method from `useQuizState`
    const handleViolation = useCallback((violationType, message, metadata = {}, autoSubmitCallback) => {
        if (hasAutoSubmittedRef.current || isOffline) {
            return false;
        }
        // Use the addViolation method from the quizState object
        quizState.addViolation({ type: violationType, message, ...metadata });

        // The decision to auto-submit is now handled by the useQuizSecurity hook,
        // which will react to the change in the violation count.
        return false;
    }, [quizState, isOffline]);

    return {
        handleViolation,
        totalViolations, // EXPORT THE RAW COUNT FOR useQuizSecurity
    };
};