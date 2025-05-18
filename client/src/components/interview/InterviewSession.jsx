import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Mic,
  MicOff,
  User,
  Bot,
  Loader2,
  Volume2,
  AlertCircle,
  Camera,
  CameraOff,
  RefreshCw,
} from "lucide-react";
import api from "../../utils/apiUtils";

const InterviewSession = ({ isDark = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showSampleAnswer, setShowSampleAnswer] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [interviewerSpeaking, setInterviewerSpeaking] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState("");
  // Webcam state
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamPermission, setWebcamPermission] = useState(null); // null, 'granted', 'denied'
  const [isRequestingWebcam, setIsRequestingWebcam] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Effect to handle redirects
  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      navigate(redirectPath);
    }
  }, [shouldRedirect, redirectPath, navigate]);

  // Webcam functions
const startWebcam = async () => {
  console.log("Starting webcam...");
  setIsRequestingWebcam(true);
  setWebcamPermission("requesting");

  try {
    // Use more basic constraints first
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true, // Simplified constraint
      audio: false,
    });

    console.log("Webcam stream obtained");
    
    // Store the stream for later cleanup
    streamRef.current = stream;

    // Connect the stream to the video element
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      console.log("Connected stream to video element");
    } else {
      console.warn("Video ref is null, cannot connect stream");
    }

    setWebcamActive(true);
    setWebcamPermission("granted");
    console.log("Webcam started successfully");
  } catch (error) {
    console.error("Error accessing webcam:", error);

    if (error.name === "NotAllowedError") {
      setWebcamPermission("denied");
      console.log("Camera permission denied");
      
      // Check if this might be due to a persisted permission denial
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'camera' });
          console.log("Camera permission status:", status.state);
          
          if (status.state === 'denied') {
            alert("Your browser has persistently denied camera access. Please check your browser settings and make sure camera permissions are enabled for this site.");
          } else {
            alert("Camera access was denied. Please enable camera permissions when prompted.");
          }
        } catch (permError) {
          console.error("Error checking permission status:", permError);
          alert("Camera access was denied. Please enable camera permissions in your browser settings.");
        }
      } else {
        alert("Camera access was denied. Please enable camera permissions in your browser settings.");
      }
    } else if (error.name === "NotFoundError") {
      setWebcamPermission("unavailable");
      console.log("No camera found");
      alert("No camera was found. Please connect a camera and try again.");
    } else if (error.name === "NotReadableError" || error.name === "AbortError") {
      setWebcamPermission("inuse");
      console.log("Camera in use or hardware error:", error.name);
      alert("Your camera may be in use by another application. Please close other applications that might be using your camera and try again.");
    } else {
      setWebcamPermission("error");
      console.log("Generic camera error:", error.message);
      alert(`Could not access camera (${error.name}). Please check your device settings.`);
    }
  } finally {
    setIsRequestingWebcam(false);
  }
};


  const stopWebcam = () => {
    if (streamRef.current) {
      // Stop all video tracks
      streamRef.current.getTracks().forEach((track) => {
        if (track.kind === "video") {
          track.stop();
        }
      });
      streamRef.current = null;
    }

    // Clear the video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setWebcamActive(false);
    console.log("Webcam stopped");
  };

  const toggleWebcam = () => {
    if (webcamActive) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  const addOrUpdateChatMessage = (message) => {
    // First check if we already have this exact message type with same question ID
    setChatHistory((currentChatHistory) => {
      // Make a copy of the current chat history
      const newChatHistory = [...currentChatHistory];

      // If it's a user message, check for existing message with same questionId
      if (message.type === "user" && message.questionId) {
        const existingIndex = newChatHistory.findIndex(
          (item) =>
            item.type === "user" && item.questionId === message.questionId
        );

        if (existingIndex !== -1) {
          // Update existing message
          newChatHistory[existingIndex] = {
            ...newChatHistory[existingIndex],
            text: message.text,
          };
          return newChatHistory;
        }
      }

      // If it's an interviewer message with a question, check for duplicates
      if (
        message.type === "interviewer" &&
        message.questionType &&
        !message.isTransition
      ) {
        const existingIndex = newChatHistory.findIndex(
          (item) =>
            item.type === "interviewer" &&
            item.text === message.text &&
            item.questionType === message.questionType
        );

        if (existingIndex !== -1) {
          // Don't add duplicate interviewer questions
          return newChatHistory;
        }
      }

      // If we got here, it's not a duplicate, so add it
      return [...newChatHistory, message];
    });
  };

  // Cleanup resources when component unmounts
  useEffect(() => {
    // Ensure token is properly formatted
    const token = localStorage.getItem("token");
    if (token) {
      const formattedToken = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
      if (token !== formattedToken) {
        localStorage.setItem("token", formattedToken);
        api.defaults.headers.common["Authorization"] = formattedToken;
      }
    }

    fetchInterview();

    // Start the timer
    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => {
      stopRecording();
      stopWebcam(); // Stop webcam when component unmounts
      clearInterval(timerRef.current);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [id]);

  useEffect(() => {
    // Scroll to bottom when chat history updates
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (interview && interview.questions && chatHistory.length === 0) {
      const currentQ = getCurrentQuestion();
      if (currentQ) {
        // Wait a bit before prompting for webcam
        setTimeout(() => {
          if (webcamPermission === null && !isRequestingWebcam) {
            console.log("Attempting to start webcam early");
            startWebcam();
          }
        }, 1000);

        // Simulate interviewer typing
        setShowTypingIndicator(true);
        setTimeout(() => {
          setShowTypingIndicator(false);
          // Use our new helper function to prevent duplicates
          addOrUpdateChatMessage({
            type: "interviewer",
            text: currentQ.question,
            questionType: currentQ.type,
          });

          // Auto-speak the first question if browser supports it
          if (window.speechSynthesis) {
            speakQuestion(currentQ.question);
          }
        }, 1500);
      }
    }
  }, [interview]);

  const fetchInterview = async () => {
    try {
      setIsLoading(true);

      console.log("Fetching interview with ID:", id);
      const res = await api.get(`/interviews/${id}`);
      setInterview(res.data.data);

      // Try to get existing response
      try {
        const responseRes = await api.get(`/interviews/${id}/responses`);
        setResponse(responseRes.data.data);

        // Pre-fill answers from existing response
        if (responseRes.data.data.answers) {
          setAnswers(responseRes.data.data.answers);
        }

        // Check if response has feedback and needs to redirect
        if (responseRes.data.data.feedback) {
          navigate(`/interviews/${id}/feedback`);
        }
      } catch (err) {
        // Handle 404 for responses - this is expected for new interviews
        if (err.response?.status === 404) {
          console.log("No existing response found - this is a new interview");
        } else {
          console.error("Error fetching interview response:", err);
        }
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching interview:", err);
      setError("Failed to load interview. Please try again later.");

      // Handle authentication errors
      if (err.response?.status === 401) {
        console.log("Authentication failed, redirecting to login");
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentQuestion = () => {
    if (
      !interview ||
      !interview.questions ||
      interview.questions.length === 0
    ) {
      return null;
    }
    return interview.questions[currentQuestion];
  };

  const handleAnswerChange = (questionId, value) => {
    // Prevent duplications by only updating the transcript and answers state,
    // but not adding anything to chat history here. Chat history will be updated
    // when stopRecording() is called.
    setTranscript(value);
    // Update answers only once
    setAnswers({
      ...answers,
      [questionId]: {
        answer: value,
        timestamp: new Date().toISOString(),
      },
    });

    // Debug logs
    console.log(
      `Answer changed for question ${questionId}: "${value.substring(
        0,
        20
      )}..."`
    );
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      // First save the current answer if there is one
      const currentQ = getCurrentQuestion();
      const userAnswer = transcript.trim();

      if (currentQ && userAnswer) {
        console.log(
          `Saving answer for current question ${currentQ.id} before going back`
        );
        addOrUpdateChatMessage({
          type: "user",
          text: userAnswer,
          questionId: currentQ.id,
        });
      }

      // Then stop recording and go back
      stopRecording();

      // Go to previous question
      setCurrentQuestion(currentQuestion - 1);

      // Clear transcript for the previous question
      setTranscript("");

      // Get the previous question data
      const previousQuestion = interview.questions[currentQuestion - 1];

      // Find any existing answer for this previous question
      const previousAnswer = chatHistory.find(
        (item) =>
          item.type === "user" && item.questionId === previousQuestion.id
      );

      // If we found a previous answer, set it as the current transcript
      if (previousAnswer) {
        console.log(
          `Found previous answer for question ${previousQuestion.id}, restoring transcript`
        );
        setTranscript(previousAnswer.text);
      }

      // Update chat history to show previous question and answer
      // Filter out current question and answer
      const currentQuestion = getCurrentQuestion();
      // We'll create a filtered chat history that doesn't include the current Q&A
      const filteredHistory = chatHistory.filter(
        (item) =>
          !(
            item.type === "interviewer" &&
            item.text === currentQuestion.question
          ) && !(item.type === "user" && item.questionId === currentQuestion.id)
      );

      setChatHistory(filteredHistory);

      // Add transition message using our helper function
      setTimeout(() => {
        addOrUpdateChatMessage({
          type: "interviewer",
          text: "Let's go back to the previous question.",
          isTransition: true,
        });

        // Add a slight delay before speaking the previous question again
        setTimeout(() => {
          if (window.speechSynthesis) {
            speakQuestion(previousQuestion.question);
          }
        }, 1000);
      }, 500);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestion < interview.questions.length - 1) {
      stopRecording();

      // Add the user's answer to the chat history if there's content
      const currentQ = getCurrentQuestion();
      const userAnswer = transcript.trim();

      if (currentQ && userAnswer) {
        addOrUpdateChatMessage({
          type: "user",
          text: userAnswer,
          questionId: currentQ.id,
        });
      }

      setCurrentQuestion(currentQuestion + 1);
      setTranscript("");

      // Add a short delay before showing the next question
      setShowTypingIndicator(true);
      setTimeout(() => {
        const nextQuestion = interview.questions[currentQuestion + 1];
        setShowTypingIndicator(false);

        // Add interviewer's transition message
        const transitionMessages = [
          "Thank you for sharing that. Let's move on to the next question.",
          "That's helpful information. Now, I'd like to ask you about something else.",
          "Great. I appreciate your answer. Let's continue with the next topic.",
        ];
        const randomTransition =
          transitionMessages[
            Math.floor(Math.random() * transitionMessages.length)
          ];

        addOrUpdateChatMessage({
          type: "interviewer",
          text: randomTransition,
          isTransition: true,
        });

        // Add a slight delay before showing the next question
        setTimeout(() => {
          setShowTypingIndicator(true);
          setTimeout(() => {
            setShowTypingIndicator(false);

            addOrUpdateChatMessage({
              type: "interviewer",
              text: nextQuestion.question,
              questionType: nextQuestion.type,
            });

            // Speak the next question
            if (window.speechSynthesis) {
              speakQuestion(nextQuestion.question);
            }
          }, 1500);
        }, 1000);
      }, 1000);
    }
  };

  const handleSubmit = async () => {
    if (
      !window.confirm(
        "Are you sure you want to submit this interview? You won't be able to change your answers afterward."
      )
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Add the current answer to chat history if not already there
      const currentQ = getCurrentQuestion();
      if (currentQ && transcript.trim()) {
        addOrUpdateChatMessage({
          type: "user",
          text: transcript.trim(),
          questionId: currentQ.id,
        });
      }

      // Make sure all questions have at least some answer
      const answersToSubmit = { ...answers };
      interview.questions.forEach((q) => {
        if (!answersToSubmit[q.id]) {
          answersToSubmit[q.id] = {
            answer: "",
            timestamp: new Date().toISOString(),
          };
        }
      });

      console.log("Submitting interview responses:", answersToSubmit);
      const submitResponse = await api.post(`/interviews/${id}/responses`, {
        answers: answersToSubmit,
      });

      console.log("Submit response:", submitResponse);

      // Add a completion message
      addOrUpdateChatMessage({
        type: "interviewer",
        text: "Thank you for completing this interview! We'll now proceed to your feedback.",
        isCompletion: true,
      });

      // Delay the navigation to show the completion message
      setTimeout(() => {
        navigate(`/interviews/${id}/feedback`);
      }, 3000);
    } catch (err) {
      console.error("Error submitting interview:", err);
      alert("Failed to submit interview. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Speech recognition functions
  const startSpeechRecognition = () => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      // Ensure any existing recognition instance is stopped first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log("Error stopping previous recognition instance:", e);
        }
      }

      // Create a new recognition instance
      recognitionRef.current = new SpeechRecognition();

      // Configure recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US"; // Set language explicitly

      // Set up event handlers
      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          // User might not be speaking, but keep recognition active
          console.log("No speech detected, but keeping recognition active");
        } else if (event.error === "audio-capture") {
          alert("Microphone not detected. Please check your device settings.");
          setIsRecording(false);
        } else if (event.error === "not-allowed") {
          alert(
            "Microphone access was denied. Please enable microphone permissions."
          );
          setIsRecording(false);
        }
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        // Restart if we're still in recording mode but recognition ended
        if (isRecording) {
          console.log("Restarting speech recognition...");
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error("Error restarting recognition:", e);
            }
          }, 100);
        }
      };

      recognitionRef.current.onresult = (event) => {
        console.log("Speech recognition result received");
        let finalTranscript = "";
        let interimTranscript = "";

        // Process all results
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Update transcript with both final and interim results
        const currentTranscript = finalTranscript || interimTranscript;
        console.log("Current transcript:", currentTranscript);

        if (currentTranscript && currentTranscript.trim()) {
          // Update user answers - ensuring no duplicate updates
          const currentQ = getCurrentQuestion();
          if (currentQ) {
            handleAnswerChange(currentQ.id, currentTranscript);
          }
        }
      };

      // Start recognition
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        alert("Could not start speech recognition. Please try again.");
      }
    } else {
      alert(
        "Speech recognition is not supported in your browser. Please try using Chrome, Edge, or Safari."
      );
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("Speech recognition stopped");
      } catch (e) {
        console.error("Error stopping speech recognition:", e);
      }
      // Clear the reference
      recognitionRef.current = null;
    }
  };

  // Audio recording functions
  const startRecording = () => {
    console.log("Starting recording...");
    setIsRecording(true);

    // Start speech recognition first
    startSpeechRecognition();

    // Then start audio recording
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then((stream) => {
        console.log("Audio stream obtained");

        // Create and configure the media recorder
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });

        mediaRecorderRef.current.start();
        console.log("Media recorder started");

        // Set up event handlers
        const audioChunks = [];

        mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
          console.log("Media recorder data available");
          audioChunks.push(event.data);
        });

        mediaRecorderRef.current.addEventListener("stop", () => {
          console.log("Media recorder stopped");
          // Here you could process the audio data if needed
          // For example, creating an audio blob for playback or upload
        });

        mediaRecorderRef.current.addEventListener("error", (error) => {
          console.error("Media recorder error:", error);
          alert(
            "An error occurred with the audio recording. Please try again."
          );
          setIsRecording(false);
        });
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);

        // Provide more specific error messages
        if (error.name === "NotAllowedError") {
          alert(
            "Microphone access was denied. Please enable microphone permissions in your browser settings."
          );
        } else if (error.name === "NotFoundError") {
          alert(
            "No microphone was found. Please connect a microphone and try again."
          );
        } else if (error.name === "NotReadableError") {
          alert(
            "Your microphone is busy or not accessible. Please ensure no other application is using it."
          );
        } else {
          alert(
            "Could not access microphone. Please check your device settings."
          );
        }

        setIsRecording(false);
        stopSpeechRecognition();
      });
  };

  const stopRecording = () => {
    console.log("Stopping recording...");

    // Stop media recorder if active
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
        console.log("Media recorder stopped");

        // Close all tracks
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => {
            track.stop();
            console.log("Media track stopped");
          });
        }
      } catch (e) {
        console.error("Error stopping media recorder:", e);
      }
    }

    // Stop speech recognition
    stopSpeechRecognition();

    // Update UI state
    setIsRecording(false);

    // Add the user's answer to the chat history
    const currentQ = getCurrentQuestion();
    const userAnswer = transcript.trim();

    if (currentQ && userAnswer) {
      console.log(
        `Adding user answer to chat history: "${userAnswer.substring(
          0,
          20
        )}..."`
      );

      // Use our helper function to prevent duplicates
      addOrUpdateChatMessage({
        type: "user",
        text: userAnswer,
        questionId: currentQ.id,
      });
    } else {
      console.log("No answer to add to chat history");
    }
  };

  const speakQuestion = (text) => {
    if (!window.speechSynthesis) {
      return;
    }

    setInterviewerSpeaking(true);
    window.speechSynthesis.cancel(); // Cancel any ongoing speech

    const speech = new SpeechSynthesisUtterance(text);
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;

    speech.onend = () => {
      setInterviewerSpeaking(false);
    };

    window.speechSynthesis.speak(speech);
  };

  const toggleSampleAnswer = (questionId) => {
    setShowSampleAnswer({
      ...showSampleAnswer,
      [questionId]: !showSampleAnswer[questionId],
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  // Function to render AI avatar
  const renderAIAvatar = () => {
    const baseClasses = `w-12 h-12 rounded-full flex items-center justify-center ${
      isDark ? "bg-blue-600" : "bg-blue-500"
    }`;

    // Add animation when speaking
    let expressionClasses = "";
    if (interviewerSpeaking) {
      expressionClasses = "animate-pulse";
    }

    return (
      <div className={`${baseClasses} ${expressionClasses}`}>
        <Bot className="w-6 h-6 text-white" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2
          className={`w-12 h-12 animate-spin ${
            isDark ? "text-blue-400" : "text-blue-600"
          }`}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`text-center p-8 ${isDark ? "text-white" : "text-gray-800"}`}
      >
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => navigate("/interviews")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Return to Interviews
        </button>
      </div>
    );
  }

  if (!interview) {
    return (
      <div
        className={`text-center p-8 ${isDark ? "text-white" : "text-gray-800"}`}
      >
        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Interview Not Found</h2>
        <p className="mb-4">
          Sorry, we couldn't find the interview you're looking for.
        </p>
        <button
          onClick={() => navigate("/interviews")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Return to Interviews
        </button>
      </div>
    );
  }

  // If there's a response with feedback, redirect but don't use this in rendering
  if (response && response.feedback && !shouldRedirect) {
    // Use navigate directly here since we're not during rendering
    console.log("Found feedback, redirecting to feedback page");
    navigate(`/interviews/${id}/feedback`);
    return null;
  }

  const currentQ = getCurrentQuestion();
  // Fix the isLastQuestion check to properly identify the last question
  const isLastQuestion = currentQuestion === interview.questions.length - 1;

  return (
    <div
      className={`max-w-6xl mx-auto px-4 py-4 md:py-8 min-h-screen flex flex-col ${
        isDark ? "text-white" : "text-gray-800"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">Interview in Progress</h1>
        <div
          className={`px-3 py-1 text-sm rounded-full ${
            isDark ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          Question {currentQuestion + 1} of {interview.questions.length}
        </div>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {/* Chat/Interview Panel - Takes 2/3 on desktop */}
        <div className="md:col-span-2 flex flex-col">
  <motion.div
    className={`flex-grow p-4 md:p-6 rounded-lg shadow-lg mb-4 overflow-hidden flex flex-col ${
      isDark ? "bg-gray-800" : "bg-white"
    }`}
    style={{ minHeight: "400px", maxHeight: "calc(100vh - 230px)" }}
  >
    {/* Split into two sections: webcam and chat content */}
    <div className="flex flex-col h-full">
      {/* Webcam Video Display - Fixed height with proper container */}
      <div 
        className="mb-4 w-full flex-shrink-0"
        style={{ height: webcamActive ? "180px" : "80px" }}
      >
        {webcamActive ? (
          <div
            className={`relative rounded-lg overflow-hidden h-full ${
              isDark ? "bg-gray-900" : "bg-gray-200"
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full rounded-lg"
              style={{ objectFit: "contain" }}
            />
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <button
                onClick={toggleWebcam}
                className={`p-2 rounded-full bg-gray-800 bg-opacity-70 text-white`}
                title="Toggle camera"
              >
                <CameraOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-lg flex items-center justify-center h-full ${
              isDark ? "bg-gray-900" : "bg-gray-200"
            }`}
          >
            {isRequestingWebcam ? (
              <div className="flex items-center text-sm">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Requesting camera access...
              </div>
            ) : webcamPermission === "denied" ? (
              <div className="flex flex-col items-center text-sm p-2">
                <p className="mb-2">Camera access was denied.</p>
                <button
                  onClick={startWebcam}
                  className={`flex items-center px-3 py-1 rounded-md ${
                    isDark
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Camera className="w-3 h-3 mr-1" />
                  Try again
                </button>
              </div>
            ) : (
              <button
                onClick={startWebcam}
                className={`flex items-center px-4 py-2 rounded-md ${
                  isDark
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <Camera className="w-4 h-4 mr-2" />
                {webcamPermission === "unavailable"
                  ? "No camera detected"
                  : "Enable camera"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chat history container - With proper flex behavior */}
      <div 
        className="flex-grow overflow-y-auto mb-4"
        ref={chatContainerRef}
        style={{ 
          height: "100%",
          maxHeight: webcamActive ? "calc(100vh - 530px)" : "calc(100vh - 430px)" 
        }}
      >
        <AnimatePresence>
          {chatHistory.map((message, index) => (
            <motion.div
              key={`message-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 flex ${
                message.type === "interviewer"
                  ? "justify-start"
                  : "justify-end"
              }`}
            >
              {/* Message display code remains the same */}
              <div
                className={`flex ${
                  message.type === "user"
                    ? "flex-row-reverse"
                    : "flex-row"
                } items-start max-w-[80%]`}
              >
                {message.type === "interviewer" && (
                  <div className="mr-3 flex-shrink-0">
                    {renderAIAvatar()}
                  </div>
                )}

                <div
                  className={`p-3 rounded-lg ${
                    message.type === "interviewer"
                      ? isDark
                        ? message.isTransition || message.isCompletion
                          ? "bg-gray-700 text-gray-300"
                          : "bg-blue-600 text-white"
                        : message.isTransition || message.isCompletion
                        ? "bg-gray-100 text-gray-700"
                        : "bg-blue-500 text-white"
                      : isDark
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.type === "interviewer" &&
                    message.questionType &&
                    !message.isTransition &&
                    !message.isCompletion && (
                      <div
                        className={`text-xs font-medium mb-1 ${
                          isDark ? "text-blue-200" : "text-blue-100"
                        }`}
                      >
                        {message.questionType.toUpperCase()}
                      </div>
                    )}
                  <div className="text-sm md:text-base">
                    {message.text}
                  </div>
                </div>

                {message.type === "user" && (
                  <div className="ml-3 flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-500`}
                    >
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {showTypingIndicator && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex justify-start"
            >
              <div className="flex flex-row items-start max-w-[80%]">
                <div className="mr-3 flex-shrink-0">
                  {renderAIAvatar()}
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    isDark ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <div className="flex space-x-1">
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        isDark ? "bg-gray-400" : "bg-gray-500"
                      }`}
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        isDark ? "bg-gray-400" : "bg-gray-500"
                      }`}
                      style={{ animationDelay: "200ms" }}
                    ></div>
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        isDark ? "bg-gray-400" : "bg-gray-500"
                      }`}
                      style={{ animationDelay: "400ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input area - Now properly positioned with flex-shrink-0 */}
      <div className="flex-shrink-0 w-full">
        <div
          className={`p-3 rounded-lg ${
            isDark ? "bg-gray-700" : "bg-gray-100"
          } flex items-center justify-between`}
        >
          <div className="flex-grow">
            {isRecording ? (
              <textarea
                value={transcript}
                onChange={(e) =>
                  handleAnswerChange(currentQ?.id, e.target.value)
                }
                className={`w-full p-2 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-800"
                }`}
                rows="2"
                placeholder="Your answer will appear here as you speak..."
              />
            ) : (
              <p
                className={`text-sm ${
                  transcript ? "" : "italic text-gray-500"
                }`}
              >
                {transcript ||
                  "Press the microphone button to start answering"}
              </p>
            )}
          </div>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`ml-2 p-3 rounded-full ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white"
                : isDark
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation controls - Now properly attached to the input area */}
        <div
          className={`mt-4 p-4 rounded-lg shadow-lg ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex justify-between">
            <button
              onClick={goToPreviousQuestion}
              disabled={currentQuestion === 0}
              className={`py-2 px-4 rounded-lg flex items-center ${
                currentQuestion === 0
                  ? isDark
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`py-2 px-6 rounded-lg ${
                  isSubmitting
                    ? "bg-green-500 text-white cursor-wait"
                    : "bg-green-600 hover:bg-green-700 text-white"
                } font-medium`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finishing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Finish Interview
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={goToNextQuestion}
                className={`py-2 px-4 rounded-lg flex items-center ${
                  isDark
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
</div>

        {/* Info Panel - Takes 1/3 on desktop */}
        <div className="md:col-span-1">
          <div
            className={`p-4 md:p-6 rounded-lg shadow-lg ${
              isDark ? "bg-gray-800" : "bg-white"
            } mb-4`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Current Question</h3>
              <div
                className={`px-2 py-1 text-xs rounded-full ${
                  isDark
                    ? "bg-blue-900/30 text-blue-300"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {formatTime(timeSpent)}
              </div>
            </div>

            {currentQ && (
              <div
                className={`p-4 rounded-lg ${
                  isDark ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <p
                  className={`text-sm font-medium mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {currentQ.type.toUpperCase()}
                </p>
                <p className="font-medium">{currentQ.question}</p>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => currentQ && toggleSampleAnswer(currentQ.id)}
                className={`text-sm flex items-center ${
                  isDark
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-800"
                }`}
              >
                {showSampleAnswer[currentQ?.id]
                  ? "Hide sample answer"
                  : "Show sample answer"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 ml-1 transition-transform ${
                    showSampleAnswer[currentQ?.id] ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {currentQ && showSampleAnswer[currentQ.id] && (
                <div
                  className={`mt-3 p-3 text-sm rounded-lg ${
                    isDark
                      ? "bg-blue-900/20 text-blue-200"
                      : "bg-blue-50 text-blue-800"
                  }`}
                >
                  {currentQ.sampleAnswer}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => currentQ && speakQuestion(currentQ.question)}
                disabled={interviewerSpeaking}
                className={`p-2 rounded-full ${
                  isDark
                    ? interviewerSpeaking
                      ? "bg-blue-700 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                    : interviewerSpeaking
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
                title={
                  interviewerSpeaking ? "Speaking..." : "Read question aloud"
                }
              >
                <Volume2
                  className={`h-5 w-5 ${
                    interviewerSpeaking ? "animate-pulse" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div
            className={`p-4 md:p-6 rounded-lg shadow-lg ${
              isDark ? "bg-gray-800" : "bg-white"
            } mb-4`}
          >
            <h3 className="font-medium mb-3">Interview Tips</h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-start">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                    isDark ? "bg-blue-400" : "bg-blue-500"
                  }`}
                ></div>
                <span>Speak clearly and at a moderate pace</span>
              </li>
              <li className="flex items-start">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                    isDark ? "bg-blue-400" : "bg-blue-500"
                  }`}
                ></div>
                <span>Provide specific examples in your answers</span>
              </li>
              <li className="flex items-start">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                    isDark ? "bg-blue-400" : "bg-blue-500"
                  }`}
                ></div>
                <span>Focus on your relevant skills and experience</span>
              </li>
              <li className="flex items-start">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                    isDark ? "bg-blue-400" : "bg-blue-500"
                  }`}
                ></div>
                <span>It's okay to take a moment before answering</span>
              </li>
              <li className="flex items-start">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                    isDark ? "bg-blue-400" : "bg-blue-500"
                  }`}
                ></div>
                <span>Use the STAR method for behavioral questions</span>
              </li>
            </ul>
          </div>

          <div
            className={`p-4 md:p-6 rounded-lg shadow-lg ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3 className="font-medium mb-3">Interview Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                    Progress
                  </span>
                  <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                    {currentQuestion + 1}/{interview.questions.length}
                  </span>
                </div>
                <div
                  className={`h-2 w-full rounded-full ${
                    isDark ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{
                      width: `${
                        ((currentQuestion + 1) / interview.questions.length) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <p className="text-sm mb-2">Questions:</p>
                <div className="space-y-2">
                  {interview.questions.map((q, index) => (
                    <div
                      key={q.id}
                      className={`flex items-center ${
                        index === currentQuestion
                          ? isDark
                            ? "text-blue-400"
                            : "text-blue-600"
                          : isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 text-xs ${
                          index === currentQuestion
                            ? isDark
                              ? "bg-blue-600 text-white"
                              : "bg-blue-600 text-white"
                            : index < currentQuestion
                            ? isDark
                              ? "bg-gray-600 text-white"
                              : "bg-gray-300 text-gray-700"
                            : isDark
                            ? "bg-gray-800 border border-gray-700 text-gray-400"
                            : "bg-white border border-gray-300 text-gray-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-sm truncate">{q.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
