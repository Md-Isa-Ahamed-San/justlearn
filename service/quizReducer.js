export const quizReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_VIOLATION':
            return {
                ...state,
                violations: [...state.violations, action.payload],
                warningCount: state.warningCount + 1
            }
        case 'SET_SUBMITTING':
            return { ...state, isSubmitting: action.payload }
        case 'UPDATE_ANSWER':
            return {
                ...state,
                answers: {
                    ...state.answers,
                    [action.payload.questionId]: action.payload
                }
            }
        case 'SET_WARNING':
            return {
                ...state,
                showWarning: action.payload.show,
                warningMessage: action.payload.message || state.warningMessage
            }
        case 'SET_FULLSCREEN_STATUS':
            return { ...state, isFullscreenSupported: action.payload }
        case 'SET_OFFLINE_STATE':
            return {
                ...state,
                isOffline: action.payload.isOffline,
                offlineStartTime: action.payload.offlineStartTime,
                disconnectionCount: action.payload.disconnectionCount !== undefined
                    ? action.payload.disconnectionCount
                    : state.disconnectionCount,
                totalOfflineTime: action.payload.totalOfflineTime !== undefined
                    ? action.payload.totalOfflineTime
                    : state.totalOfflineTime,
                shouldAutoSubmitOnReconnect: action.payload.shouldAutoSubmitOnReconnect !== undefined
                    ? action.payload.shouldAutoSubmitOnReconnect
                    : state.shouldAutoSubmitOnReconnect,
                autoSubmitReason: action.payload.autoSubmitReason || state.autoSubmitReason
            }
        case 'UPDATE_OFFLINE_TRACKING':
            return {
                ...state,
                totalOfflineTime: action.payload.totalOfflineTime,
                disconnectionCount: action.payload.disconnectionCount
            }
        case 'MARK_FOR_AUTO_SUBMIT':
            return {
                ...state,
                shouldAutoSubmitOnReconnect: true,
                autoSubmitReason: action.payload.reason
            }
        default:
            return state
    }
}