"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { toast } from "sonner";

import QuestionInterface from "@/app/(main)/courses/[id]/quiz-participation/[quizId]/_component/quizInterface/_components/question-interface";
import QuizHeader from "@/app/(main)/courses/[id]/quiz-participation/[quizId]/_component/quizInterface/_components/quiz-header";
import QuizNavigationSidebar from "@/app/(main)/courses/[id]/quiz-participation/[quizId]/_component/quizInterface/_components/quiz-navigation-sidebar";
import { quizReducer } from "@/service/quizReducer";
import {
  AlertTriangle,
  Shield,
  WifiOff
} from "lucide-react";
import { submitQuizWithStudentAnswer } from "../../../../../../../actions/quiz";
import AntiCheatMonitor from "../anti-cheat-monitor";
import QuizTimer from "../quiz-timer";

export default function QuizInterface({
  quiz,
  currentUser,
  courseId,
  userSubmissions,
}) {
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit * 60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);

  // Use reducer for complex state management
  const [state, dispatch] = useReducer(quizReducer, {
    answers: {},
    violations: [],
    warningCount: 0,
    isSubmitting: false,
    showWarning: false,
    warningMessage: "",
    isFullscreenSupported: true,
    isOffline: false,
    offlineStartTime: null,
    disconnectionCount: 0,
    totalOfflineTime: 0,
    shouldAutoSubmitOnReconnect: false,
    autoSubmitReason: "",
  });

  console.log("Enhanced Offline State: ", {
    isOffline: state.isOffline,
    disconnectionCount: state.disconnectionCount,
    totalOfflineTime: state.totalOfflineTime,
    shouldAutoSubmitOnReconnect: state.shouldAutoSubmitOnReconnect,
    autoSubmitReason: state.autoSubmitReason,
  });

  const router = useRouter();
  const quizContainerRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const submissionTimeoutRef = useRef(null);
  const offlineTimeoutRef = useRef(null);
  const offlineTrackingIntervalRef = useRef(null);
  const hasAutoSubmittedRef = useRef(false);
  const fullscreenAttempted = useRef(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // !MARK: UNIFIED SUBMIT FUNCTION - Handles both manual and auto submissions
 const submitQuiz = useCallback(
    async (submissionContext = {}) => {
      const {
        reason = "Manual submission",
        isAutoSubmit = false,
        skipConfirmation = false,
        stateOverrides = {}, // 🔥 ADD stateOverrides for immediate state pushing
      } = submissionContext;

      // Prevent duplicate submissions
      if (hasAutoSubmittedRef.current || state.isSubmitting) {
        console.log("🚫 Submission already in progress, skipping...");
        return;
      }

      console.log(
        `🚀 Starting ${isAutoSubmit ? "auto" : "manual"} submission:`,
        reason
      );

      // For manual submissions, check for unanswered questions and show confirmation
      if (!isAutoSubmit && !skipConfirmation) {
        const unansweredQuestions = quiz.questions.filter((q) => {
          const answerData = state.answers[q.id];
          if (!answerData) return true;
          if (Array.isArray(answerData.answer))
            return answerData.answer.length === 0;
          return !answerData.answer;
        });

        if (unansweredQuestions.length > 0) {
          toast.warning("Are you sure you want to submit?", {
            description: `You have ${unansweredQuestions.length} unanswered questions.`,
            action: {
              label: "Submit Anyway",
              onClick: () =>
                submitQuiz({
                  reason,
                  isAutoSubmit,
                  skipConfirmation: true,
                }),
            },
            cancel: {
              label: "Cancel",
            },
            duration: 10000,
          });
          return;
        }
      }

      // Set submission flags
      hasAutoSubmittedRef.current = true;
      dispatch({ type: "SET_SUBMITTING", payload: true });

      // 🔥 NEW: Ensure ALL questions have answers (empty for unanswered)
      const completeAnswers = {};
      
      quiz.questions.forEach((question) => {
        const existingAnswer = state.answers[question.id];
        
        if (existingAnswer) {
          // Use existing answer
          completeAnswers[question.id] = existingAnswer;
        } else {
          // Create empty answer for unanswered question
          completeAnswers[question.id] = {
            questionId: question.id,
            question: question.text, // Include question text
            answer: question.type === 'mcq' ? [] : "", // Empty array for MCQ, empty string for others
            questionType: question.type,
            mark: question.mark,
            isCorrect: false,
          };
        }
      });

      // Enhanced state for submission with complete answers
      const finalStateForSubmission = { ...state, ...stateOverrides };
      const submissionState = {
        ...finalStateForSubmission,
        answers: completeAnswers, // 🔥 Use complete answer set instead of state.answers
        quizId: quiz.id,
        courseId: courseId,
        submissionReason: reason,
        isAutoSubmit,
        submissionTimestamp: new Date().toISOString(),
      };

      console.log("🚩 VIOLATIONS BEFORE SUBMIT:", submissionState.violations);

      console.log("📋 Final submission data:", {
        totalQuestions: quiz.questions.length,
        answeredQuestions: Object.keys(state.answers).length,
        completeAnswersCount: Object.keys(completeAnswers).length, // Should equal totalQuestions
        violations: submissionState.violations,
        offlineTracking: {
          disconnectionCount: submissionState.disconnectionCount,
          totalOfflineTime: submissionState.totalOfflineTime,
        },
        reason,
        isAutoSubmit,
      });

      // Cleanup all timers and intervals
      const cleanup = () => {
        if (submissionTimeoutRef.current)
          clearTimeout(submissionTimeoutRef.current);
        if (heartbeatIntervalRef.current)
          clearInterval(heartbeatIntervalRef.current);
        if (offlineTimeoutRef.current) clearTimeout(offlineTimeoutRef.current);
        if (offlineTrackingIntervalRef.current)
          clearInterval(offlineTrackingIntervalRef.current);

        try {
          localStorage.removeItem(`quiz_${quiz.id}_offline_state`);
          console.log("🧹 Cleaned up localStorage and intervals");
        } catch (error) {
          console.error("❌ Failed to clean up offline state:", error);
        }
      };

      cleanup();

      try {
        // Submit the quiz
        const submissionResponse =
          await submitQuizWithStudentAnswer(submissionState);

        // Always reset submitting state first
        dispatch({ type: "SET_SUBMITTING", payload: false });
        await new Promise((resolve) => setTimeout(resolve, 50));

        if (submissionResponse.success) {
          // Show appropriate success message
          const successMessage = isAutoSubmit
            ? `Quiz auto-submitted: ${reason}`
            : "Quiz submitted successfully!";

          toast.success(successMessage, {
            duration: 4000,
            position: "top-center",
          });

          console.log("✅ Submission successful:", submissionResponse);

          // Navigate back after showing toast
          setTimeout(() => {
            router.back();
          }, 2000);
        } else {
          // Show error message
          const errorMessage =
            submissionResponse.error || "Failed to submit quiz";
          toast.error(errorMessage, {
            duration: 5000,
            position: "top-center",
          });

          console.error("❌ Submission failed:", submissionResponse);

          // Reset submission flag on failure for manual submissions
          if (!isAutoSubmit) {
            hasAutoSubmittedRef.current = false;
          }
        }
      } catch (error) {
        // Handle unexpected errors
        dispatch({ type: "SET_SUBMITTING", payload: false });
        await new Promise((resolve) => setTimeout(resolve, 50));

        const errorMessage = isAutoSubmit
          ? `Auto-submission failed: ${error.message}`
          : "An unexpected error occurred. Please try again.";

        toast.error(errorMessage, {
          duration: 5000,
          position: "top-center",
        });

        console.error("💥 Submission error:", error);

        // Reset submission flag on error for manual submissions
        if (!isAutoSubmit) {
          hasAutoSubmittedRef.current = false;
        }
      }
    },
    [state, quiz.id, quiz.questions, courseId, router]
  );
  // Enhanced offline handling with smart submission logic
  // !MARK: HANDLE OFFLINE
  const handleOffline = useCallback(() => {
    if (state.isOffline || hasAutoSubmittedRef.current) return;

    const offlineStartTime = Date.now();
    const newDisconnectionCount = state.disconnectionCount + 1;

    console.log(
      `🔴 User went offline - Disconnection #${newDisconnectionCount}`
    );

    dispatch({
      type: "SET_OFFLINE_STATE",
      payload: {
        isOffline: true,
        offlineStartTime,
        disconnectionCount: newDisconnectionCount,
        shouldAutoSubmitOnReconnect: false,
      },
    });

    // Pause the timer immediately
    setTimerPaused(true);

    // Store current quiz state in localStorage for recovery
    const offlineQuizState = {
      quizId: quiz.id,
      userId: currentUser.id,
      answers: state.answers,
      violations: state.violations,
      timeRemaining,
      currentQuestionIndex,
      offlineStartTime,
      disconnectionCount: newDisconnectionCount,
      totalOfflineTime: state.totalOfflineTime,
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        `quiz_${quiz.id}_offline_state`,
        JSON.stringify(offlineQuizState)
      );
      console.log("📱 Offline state stored in localStorage");
    } catch (error) {
      console.error("❌ Failed to store offline state:", error);
    }

    // Start tracking offline time with 1-second precision
    offlineTrackingIntervalRef.current = setInterval(() => {
      const currentOfflineTime = Date.now() - offlineStartTime;

      const updatedState = {
        ...offlineQuizState,
        currentOfflineTime,
        lastUpdate: new Date().toISOString(),
      };

      try {
        localStorage.setItem(
          `quiz_${quiz.id}_offline_state`,
          JSON.stringify(updatedState)
        );
      } catch (error) {
        console.error("❌ Failed to update offline state:", error);
      }
    }, 1000);

    // Handle disconnection logic based on count
    if (newDisconnectionCount === 1) {
      showWarningMessage(
        "⚠️ Connection lost. Reconnect within 30 seconds to avoid auto-submission."
      );

      offlineTimeoutRef.current = setTimeout(() => {
        console.log(
          "⏰ 30-second grace period expired - marking for auto-submit"
        );

        dispatch({
          type: "MARK_FOR_AUTO_SUBMIT",
          payload: {
            reason: "First disconnection exceeded 30 seconds",
          },
        });

        try {
          const storedState = localStorage.getItem(
            `quiz_${quiz.id}_offline_state`
          );
          if (storedState) {
            const data = JSON.parse(storedState);
            data.shouldAutoSubmit = true;
            data.autoSubmitReason = "First disconnection exceeded 30 seconds";
            localStorage.setItem(
              `quiz_${quiz.id}_offline_state`,
              JSON.stringify(data)
            );
            console.log("🚨 Auto-submit flag set in localStorage");
          }
        } catch (error) {
          console.error("❌ Failed to update auto-submit flag:", error);
        }

        showWarningMessage(
          "🔥 Grace period expired! Quiz will auto-submit when connection returns."
        );
      }, 30000);
    } else {
      console.log(
        "🚨 Multiple disconnections detected - immediate auto-submit on reconnect"
      );

      dispatch({
        type: "MARK_FOR_AUTO_SUBMIT",
        payload: {
          reason: `Multiple disconnections detected (${newDisconnectionCount} times)`,
        },
      });

      showWarningMessage(
        `🚨 Multiple disconnections detected! Quiz will auto-submit immediately when connection returns.`
      );

      try {
        const storedState = localStorage.getItem(
          `quiz_${quiz.id}_offline_state`
        );
        if (storedState) {
          const data = JSON.parse(storedState);
          data.shouldAutoSubmit = true;
          data.autoSubmitReason = `Multiple disconnections (${newDisconnectionCount} times)`;
          localStorage.setItem(
            `quiz_${quiz.id}_offline_state`,
            JSON.stringify(data)
          );
        }
      } catch (error) {
        console.error("❌ Failed to set immediate auto-submit flag:", error);
      }
    }
  }, [
    state.isOffline,
    state.disconnectionCount,
    state.answers,
    state.violations,
    timeRemaining,
    currentQuestionIndex,
    quiz.id,
    currentUser.id,
  ]);

  // !MARK: HANDLE ONLINE
  const handleOnline = useCallback(() => {
    if (!state.isOffline || hasAutoSubmittedRef.current) return;

    console.log("🟢 Connection restored");

    const offlineDuration = state.offlineStartTime
      ? Date.now() - state.offlineStartTime
      : 0;
    const offlineSeconds = Math.floor(offlineDuration / 1000);
    const newTotalOfflineTime = state.totalOfflineTime + offlineDuration;

    console.log(
      `📊 Offline duration: ${offlineSeconds} seconds, Total offline: ${Math.floor(
        newTotalOfflineTime / 1000
      )} seconds`
    );

    // Clear offline tracking intervals
    if (offlineTrackingIntervalRef.current) {
      clearInterval(offlineTrackingIntervalRef.current);
      offlineTrackingIntervalRef.current = null;
    }

    if (offlineTimeoutRef.current) {
      clearTimeout(offlineTimeoutRef.current);
      offlineTimeoutRef.current = null;
    }

    // Check if we need to auto-submit
    let shouldAutoSubmit = state.shouldAutoSubmitOnReconnect;
    let autoSubmitReason = state.autoSubmitReason;

    try {
      const storedState = localStorage.getItem(`quiz_${quiz.id}_offline_state`);
      if (storedState) {
        const offlineData = JSON.parse(storedState);
        if (offlineData.shouldAutoSubmit) {
          shouldAutoSubmit = true;
          autoSubmitReason = offlineData.autoSubmitReason || autoSubmitReason;
          console.log(
            "📱 Auto-submit flag found in localStorage:",
            autoSubmitReason
          );
        }
      }
    } catch (error) {
      console.error(
        "❌ Failed to check localStorage for auto-submit flag:",
        error
      );
    }

    if (shouldAutoSubmit) {
      console.log(
        "🚨 Auto-submitting due to offline conditions:",
        autoSubmitReason
      );

      // Add offline violation
      const offlineViolation = {
        type: "network_disconnect_violation",
        timestamp: new Date(),
        duration: offlineDuration,
        disconnectionNumber: state.disconnectionCount,
        reason: autoSubmitReason,
        totalOfflineTime: newTotalOfflineTime,
      };

      dispatch({ type: "ADD_VIOLATION", payload: offlineViolation });

      // Update offline tracking
      dispatch({
        type: "UPDATE_OFFLINE_TRACKING",
        payload: {
          totalOfflineTime: newTotalOfflineTime,
          disconnectionCount: state.disconnectionCount,
        },
      });

      // Use unified submit function with explicit latest state overrides
      submitQuiz({
        reason: autoSubmitReason,
        isAutoSubmit: true,
        skipConfirmation: true,
        stateOverrides: {
          violations: [...state.violations, offlineViolation],
          totalOfflineTime: newTotalOfflineTime,
          disconnectionCount: state.disconnectionCount,
        }
      });
      return;
    }

    // Resume normal operation
    console.log("✅ Resuming normal operation - no auto-submit needed");

    dispatch({
      type: "SET_OFFLINE_STATE",
      payload: {
        isOffline: false,
        offlineStartTime: null,
        disconnectionCount: state.disconnectionCount,
        totalOfflineTime: newTotalOfflineTime,
        shouldAutoSubmitOnReconnect: false,
        autoSubmitReason: "",
      },
    });

    // Resume timer with time deduction
    setTimerPaused(false);
    const timeAfterDeduction = Math.max(0, timeRemaining - offlineSeconds);
    setTimeRemaining(timeAfterDeduction);

    console.log(
      `⏰ Time deduction: ${offlineSeconds}s, Remaining: ${timeAfterDeduction}s`
    );

    // Clean up stored state
    try {
      localStorage.removeItem(`quiz_${quiz.id}_offline_state`);
    } catch (error) {
      console.error("❌ Failed to clean up localStorage:", error);
    }

    showWarningMessage(
      `✅ Connection restored! ${offlineSeconds}s deducted from quiz time. Total offline: ${Math.floor(
        newTotalOfflineTime / 1000
      )}s`
    );
  }, [
    state.isOffline,
    state.offlineStartTime,
    state.totalOfflineTime,
    state.disconnectionCount,
    state.shouldAutoSubmitOnReconnect,
    state.autoSubmitReason,
    timeRemaining,
    quiz.id,
    submitQuiz,
  ]);

  // !MARK: HANDLE VIOLATION
  const handleViolation = useCallback(
    (type, message) => {
      if (hasAutoSubmittedRef.current || state.isOffline) return;

      const newViolation = {
        type,
        timestamp: new Date(),
        count: state.violations.filter((v) => v.type === type).length + 1,
      };

      dispatch({ type: "ADD_VIOLATION", payload: newViolation });

      // Immediate auto-submit violations
      const immediateSubmitTypes = ["developer_tools", "copy_paste_success"];
      if (immediateSubmitTypes.includes(type)) {
        submitQuiz({
          reason: message,
          isAutoSubmit: true,
          skipConfirmation: true,
          stateOverrides: { violations: [...state.violations, newViolation] }
        });
        return;
      }

      // Fullscreen exit auto-submit
      if (
        type === "fullscreen_exit" &&
        state.isFullscreenSupported &&
        isFullscreen
      ) {
        submitQuiz({
          reason: message,
          isAutoSubmit: true,
          skipConfirmation: true,
          stateOverrides: { violations: [...state.violations, newViolation] }
        });
        return;
      }

      // Warning system for gradual violations
      const warningTypes = [
        "tab_switch",
        "window_minimize",
        "copy_paste_attempt",
        "keyboard_shortcut",
      ];
      if (warningTypes.includes(type)) {
        const typeViolations =
          state.violations.filter((v) => v.type === type).length + 1;
        
        const maxViolations = quiz.maxViolationsAllowed || 2;

        if (typeViolations >= maxViolations) {
          submitQuiz({
            reason: `Too many ${type.replace("_", " ")} violations`,
            isAutoSubmit: true,
            skipConfirmation: true,
            stateOverrides: { violations: [...state.violations, newViolation] }
          });
        } else {
          const remaining = maxViolations - typeViolations;
          showWarningMessage(
            `⚠️ Warning: ${message}. ${remaining} more violation${remaining > 1 ? 's' : ''} will auto-submit the quiz.`
          );
        }
      }

      console.log("🔍 Logging violation:", newViolation);
    },
    [
      state.violations,
      state.isFullscreenSupported,
      state.isOffline,
      isFullscreen,
      submitQuiz,
      quiz.maxViolationsAllowed,
    ]
  );

  const showWarningMessage = (message) => {
    dispatch({
      type: "SET_WARNING",
      payload: { show: true, message },
    });

    setTimeout(() => {
      dispatch({
        type: "SET_WARNING",
        payload: { show: false },
      });
    }, 6000);
  };

  // Check fullscreen support and capabilities
  const checkFullscreenSupport = useCallback(() => {
    const isSupported = !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    );

    if (!isSupported) {
      console.warn("Fullscreen API not supported in this browser");
      dispatch({ type: "SET_FULLSCREEN_STATUS", payload: false });
      showWarningMessage(
        "Fullscreen mode not supported in this browser. Quiz will continue in normal mode."
      );
    }

    return isSupported;
  }, []);

  // Robust fullscreen handling with better error management
  const attemptFullscreen = useCallback(async () => {
    if (fullscreenAttempted.current || !state.isFullscreenSupported) return;

    fullscreenAttempted.current = true;

    try {
      const element = quizContainerRef.current;
      if (!element) {
        console.warn("Quiz container not found");
        return;
      }

      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
        setIsFullscreen(true);
        return;
      }

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      } else {
        throw new Error("No fullscreen method available");
      }

      setIsFullscreen(true);
      console.log("✅ Successfully entered fullscreen mode");
    } catch (error) {
      console.error("❌ Failed to enter fullscreen:", error);

      if (error.name === "NotAllowedError") {
        showWarningMessage(
          "Fullscreen blocked by browser. Please allow fullscreen and refresh to take quiz in secure mode."
        );
      } else if (
        error.name === "TypeError" &&
        error.message.includes("Permissions")
      ) {
        showWarningMessage(
          "Browser permissions prevent fullscreen. Quiz will continue in normal mode."
        );
      } else {
        console.warn(
          "Fullscreen not available, continuing with enhanced monitoring"
        );
        showWarningMessage(
          "Fullscreen unavailable. Enhanced monitoring is active."
        );
      }

      setIsFullscreen(false);
    }
  }, [state.isFullscreenSupported]);

  // !MARK: Init fullscreen
  useEffect(() => {
    const isSupported = checkFullscreenSupport();

    if (isSupported) {
      const timer = setTimeout(() => {
        attemptFullscreen();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [checkFullscreenSupport, attemptFullscreen]);

  // !MARK: fullscreen changes HANDLER
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFullscreen);

      if (
        !isCurrentlyFullscreen &&
        fullscreenAttempted.current &&
        state.isFullscreenSupported &&
        !hasAutoSubmittedRef.current &&
        !state.isOffline
      ) {
        setTimeout(() => {
          if (
            !document.fullscreenElement &&
            !hasAutoSubmittedRef.current &&
            !state.isOffline
          ) {
            handleViolation(
              "fullscreen_exit",
              "Exited fullscreen mode - Auto-submitting quiz"
            );
          }
        }, 1000);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, [handleViolation, state.isFullscreenSupported, state.isOffline]);

  // Enhanced online/offline detection with immediate handling
  useEffect(() => {
    const handleOnlineEvent = () => {
      console.log("🌐 Browser online event triggered");
      handleOnline();
    };

    const handleOfflineEvent = () => {
      console.log("🌐 Browser offline event triggered");
      handleOffline();
    };

    window.addEventListener("online", handleOnlineEvent);
    window.addEventListener("offline", handleOfflineEvent);

    if (!navigator.onLine && !state.isOffline) {
      console.log("🔍 Initial check: User is offline");
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnlineEvent);
      window.removeEventListener("offline", handleOfflineEvent);
    };
  }, [handleOnline, handleOffline, state.isOffline]);

  // Improved heartbeat with proper cleanup
  useEffect(() => {
    const startHeartbeat = () => {
      heartbeatIntervalRef.current = setInterval(() => {
        if (!hasAutoSubmittedRef.current && !state.isOffline) {
          console.log("💓 Heartbeat: Validating quiz session...");
        }
      }, 10000);
    };

    startHeartbeat();

    return () => {
      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current);
      if (submissionTimeoutRef.current)
        clearTimeout(submissionTimeoutRef.current);
      if (offlineTimeoutRef.current) clearTimeout(offlineTimeoutRef.current);
      if (offlineTrackingIntervalRef.current)
        clearInterval(offlineTrackingIntervalRef.current);
    };
  }, [state.isOffline]);

  // Recovery on component mount
  useEffect(() => {
    try {
      const storedState = localStorage.getItem(`quiz_${quiz.id}_offline_state`);
      if (storedState) {
        const offlineData = JSON.parse(storedState);

        if (offlineData.userId === currentUser.id) {
          console.log("🔄 Recovering from offline state:", offlineData);

          Object.keys(offlineData.answers || {}).forEach((questionId) => {
            dispatch({
              type: "UPDATE_ANSWER",
              payload: offlineData.answers[questionId],
            });
          });

          dispatch({
            type: "UPDATE_OFFLINE_TRACKING",
            payload: {
              disconnectionCount: offlineData.disconnectionCount || 0,
              totalOfflineTime: offlineData.totalOfflineTime || 0,
            },
          });

          if (offlineData.shouldAutoSubmit) {
            console.log("🚨 Recovery: Auto-submitting due to stored flag");
            submitQuiz({
              reason:
                "Recovered from offline state - " +
                offlineData.autoSubmitReason,
              isAutoSubmit: true,
              skipConfirmation: true,
            });
          } else {
            localStorage.removeItem(`quiz_${quiz.id}_offline_state`);
            console.log(
              "✅ Recovery: No auto-submit needed, cleaned up localStorage"
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to recover offline state:", error);
    }
  }, [quiz.id, currentUser.id, submitQuiz]);

  // !MARK: handle answer change
  const handleAnswerChange = (
    questionId,
    question,
    answer,
    questionType,
    mark,
    isCorrect
  ) => {
    dispatch({
      type: "UPDATE_ANSWER",
      payload: { questionId, question, answer, questionType, mark, isCorrect },
    });

    console.log("full state inside the handleAnswerChange: ", state);

    if (state.isOffline) {
      try {
        const storedState = localStorage.getItem(
          `quiz_${quiz.id}_offline_state`
        );
        if (storedState) {
          const offlineData = JSON.parse(storedState);
          offlineData.answers = {
            ...offlineData.answers,
            [questionId]: {
              questionId,
              answer,
              questionType,
              mark,
              isCorrect,
            },
          };
          localStorage.setItem(
            `quiz_${quiz.id}_offline_state`,
            JSON.stringify(offlineData)
          );
          console.log("💾 Answer saved to localStorage while offline");
        }
      } catch (error) {
        console.error("❌ Failed to store offline answer:", error);
      }
    }

    if (!state.isOffline) {
      console.log("💾 Saving answer to server:", {
        questionId,
        answer,
        questionType,
        mark,
        isCorrect,
      });
    }
  };

  // !MARK: Handle Time Up - Uses unified submit function
  const handleTimeUp = () => {
    console.log("⏰ Time limit exceeded");
    submitQuiz({
      reason: "Time limit exceeded",
      isAutoSubmit: true,
      skipConfirmation: true,
    });
  };

  // !MARK: Handle Manual Submit - Uses unified submit function
  const handleManualSubmit = () => {
    if (state.isSubmitting || hasAutoSubmittedRef.current) return;

    submitQuiz({
      reason: "Manual submission",
      isAutoSubmit: false,
      skipConfirmation: false,
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  // Determine security badge status with enhanced offline awareness
  const getSecurityStatus = () => {
    if (state.isOffline)
      return {
        variant: "destructive",
        text: "Offline Mode",
        icon: WifiOff,
      };
    if (state.shouldAutoSubmitOnReconnect)
      return {
        variant: "destructive",
        text: "Auto-Submit Pending",
        icon: AlertTriangle,
      };
    if (!state.isFullscreenSupported)
      return {
        variant: "secondary",
        text: "Normal Mode",
        icon: Shield,
      };
    if (!isFullscreen && state.isFullscreenSupported)
      return {
        variant: "destructive",
        text: "Security Compromised",
        icon: AlertTriangle,
      };
    if (state.warningCount > 0)
      return {
        variant: "warning",
        text: `${state.warningCount} Warning${
          state.warningCount > 1 ? "s" : ""
        }`,
        icon: AlertTriangle,
      };
    return {
      variant: "default",
      text: "Secure Mode",
      icon: Shield,
    };
  };

  const securityStatus = getSecurityStatus();

  return (
    <div
      ref={quizContainerRef}
      className="min-h-screen bg-background text-foreground p-4 font-poppins"
    >
      {/* Enhanced Warning Alert with better offline messaging */}
      {state.showWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <Alert className="bg-card border-border shadow-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-card-foreground">
              {state.warningMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/*!MARK: QUIZ HEADER*/}
      <QuizHeader
        quiz={quiz}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        securityStatus={securityStatus}
        state={state}
        progress={progress}
      />
      {/*!MARK: QUIZ TIMER*/}
      <div className="mb-6">
        <QuizTimer
          initialTime={timeRemaining}
          onTimeUp={handleTimeUp}
          paused={timerPaused || state.isOffline}
          warningThreshold={300} // 5 minutes warning
          criticalThreshold={120} // 2 minutes critical
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation Sidebar */}
        <QuizNavigationSidebar
          quiz={quiz}
          state={state}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          goToQuestion={goToQuestion}
          isFullscreen={isFullscreen}
          timerPaused={timerPaused}
        />
        {/* Main Question Area */}
        <QuestionInterface
          currentQuestion={currentQuestion}
          state={state}
          previousQuestion={previousQuestion}
          nextQuestion={nextQuestion}
          handleManualSubmit={handleManualSubmit}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          handleAnswerChange={handleAnswerChange}
        />
      </div>

      {/* Anti-Cheat Monitor Component */}
      <AntiCheatMonitor
        onViolation={handleViolation}
        isActive={!state.isSubmitting && !state.isOffline}
        isFullscreenSupported={state.isFullscreenSupported}
        developmentMode={process.env.DEVELOPMENT_MODE}
      />
    </div>
  );
}