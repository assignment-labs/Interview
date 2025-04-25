import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertCircle
} from 'lucide-react';
import api from '../../utils/apiUtils';

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
  const [transcript, setTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showSampleAnswer, setShowSampleAnswer] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [interviewerSpeaking, setInterviewerSpeaking] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Handle redirection
  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      navigate(redirectPath);
    }
  }, [shouldRedirect, redirectPath, navigate]);

  useEffect(() => {
    // Ensure token is properly formatted
    const token = localStorage.getItem('token');
    if (token) {
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      if (token !== formattedToken) {
        localStorage.setItem('token', formattedToken);
        api.defaults.headers.common['Authorization'] = formattedToken;
      }
    }

    fetchInterview();
    
    // Start the timer
    timerRef.current = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => {
      stopRecording();
      clearInterval(timerRef.current);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [id]);

  useEffect(() => {
    // Scroll to bottom when chat history updates
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (interview && interview.questions && chatHistory.length === 0) {
      const currentQ = getCurrentQuestion();
      if (currentQ) {
        // Simulate interviewer typing
        setShowTypingIndicator(true);
        setTimeout(() => {
          setShowTypingIndicator(false);
          setChatHistory([
            { 
              type: 'interviewer', 
              text: currentQ.question,
              questionType: currentQ.type
            }
          ]);
          
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
      
      console.log('Fetching interview with ID:', id);
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
          setRedirectPath(`/interviews/${id}/feedback`);
          setShouldRedirect(true);
        }
      } catch (err) {
        // Handle 404 for responses - this is expected for new interviews
        if (err.response?.status === 404) {
          console.log('No existing response found - this is a new interview');
        } else {
          console.error('Error fetching interview response:', err);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching interview:', err);
      setError('Failed to load interview. Please try again later.');
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        console.log('Authentication failed, redirecting to login');
        localStorage.removeItem('token');
        setRedirectPath('/login');
        setShouldRedirect(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentQuestion = () => {
    if (!interview || !interview.questions || interview.questions.length === 0) {
      return null;
    }
    return interview.questions[currentQuestion];
  };

  const handleAnswerChange = (questionId, value) => {
    setTranscript(value);
    setAnswers({
      ...answers,
      [questionId]: {
        answer: value,
        timestamp: new Date().toISOString()
      }
    });
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      stopRecording();
      setCurrentQuestion(currentQuestion - 1);
      setTranscript('');
      
      // Update chat history to show previous question and answer
      const previousQuestion = interview.questions[currentQuestion - 1];
      const previousAnswerObj = answers[previousQuestion.id];
      
      // Filter out current question and answer
      const currentQ = getCurrentQuestion();
      const filteredHistory = chatHistory.filter(item => 
        !(item.type === 'interviewer' && item.text === currentQ.question) &&
        !(item.type === 'user' && item.questionId === currentQ.id)
      );
      
      // Add transition message
      setChatHistory([
        ...filteredHistory,
        { 
          type: 'interviewer', 
          text: "Let's go back to the previous question.",
          isTransition: true 
        }
      ]);
      
      // Add a slight delay before speaking the previous question again
      setTimeout(() => {
        if (window.speechSynthesis) {
          speakQuestion(previousQuestion.question);
        }
      }, 1000);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestion < interview.questions.length - 1) {
      stopRecording();
      
      // Add the user's answer to the chat history if not already added
      const currentQ = getCurrentQuestion();
      const userAnswer = transcript.trim();
      
      if (currentQ && userAnswer && !chatHistory.some(item => 
        item.type === 'user' && item.questionId === currentQ.id
      )) {
        setChatHistory(prev => [
          ...prev,
          { 
            type: 'user', 
            text: userAnswer,
            questionId: currentQ.id 
          }
        ]);
      }
      
      setCurrentQuestion(currentQuestion + 1);
      setTranscript('');
      
      // Add a short delay before showing the next question
      setShowTypingIndicator(true);
      setTimeout(() => {
        const nextQuestion = interview.questions[currentQuestion + 1];
        setShowTypingIndicator(false);
        
        // Add interviewer's transition message
        const transitionMessages = [
          "Thank you for sharing that. Let's move on to the next question.",
          "That's helpful information. Now, I'd like to ask you about something else.",
          "Great. I appreciate your answer. Let's continue with the next topic."
        ];
        const randomTransition = transitionMessages[Math.floor(Math.random() * transitionMessages.length)];
        
        setChatHistory(prev => [
          ...prev, 
          { type: 'interviewer', text: randomTransition, isTransition: true }
        ]);
        
        // Add a slight delay before showing the next question
        setTimeout(() => {
          setShowTypingIndicator(true);
          setTimeout(() => {
            setShowTypingIndicator(false);
            setChatHistory(prev => [
              ...prev, 
              { 
                type: 'interviewer', 
                text: nextQuestion.question,
                questionType: nextQuestion.type 
              }
            ]);
            
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
    if (!window.confirm('Are you sure you want to submit this interview? You won\'t be able to change your answers afterward.')) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Add the current answer to chat history if not already there
      const currentQ = getCurrentQuestion();
      if (currentQ && transcript.trim() && !chatHistory.some(item => 
        item.type === 'user' && item.questionId === currentQ.id
      )) {
        setChatHistory(prev => [
          ...prev,
          { 
            type: 'user', 
            text: transcript.trim(),
            questionId: currentQ.id 
          }
        ]);
      }
      
      // Make sure all questions have at least some answer
      const answersToSubmit = { ...answers };
      interview.questions.forEach(q => {
        if (!answersToSubmit[q.id]) {
          answersToSubmit[q.id] = {
            answer: '',
            timestamp: new Date().toISOString()
          };
        }
      });
      
      console.log('Submitting interview responses:', answersToSubmit);
      await api.post(`/interviews/${id}/responses`, { answers: answersToSubmit });
      
      // Add a completion message
      setChatHistory(prev => [
        ...prev,
        { 
          type: 'interviewer', 
          text: "Thank you for completing this interview! We'll now proceed to your feedback.",
          isCompletion: true
        }
      ]);
      
      // Refetch interview and response to ensure we have the latest data
      try {
        const interviewRes = await api.get(`/interviews/${id}`);
        setInterview(interviewRes.data.data);
        
        const responseRes = await api.get(`/interviews/${id}/responses`);
        setResponse(responseRes.data.data);
      } catch (err) {
        console.error('Error refreshing data after submission:', err);
      }
      
      // Delay the navigation to show the completion message
      setTimeout(() => {
        setRedirectPath(`/interviews/${id}/feedback`);
        setShouldRedirect(true);
      }, 3000);
    } catch (err) {
      console.error('Error submitting interview:', err);
      alert('Failed to submit interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Speech recognition functions
  const startSpeechRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTranscript(transcript);
        
        // Update user answers
        const currentQ = getCurrentQuestion();
        if (currentQ) {
          setAnswers(prev => ({
            ...prev,
            [currentQ.id]: {
              ...prev[currentQ.id],
              answer: transcript
            }
          }));
        }
      };
      
      recognitionRef.current.start();
    } else {
      alert('Speech recognition is not supported in your browser');
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Audio recording functions
  const startRecording = () => {
    setIsRecording(true);
    startSpeechRecognition();
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.start();
        
        const audioChunks = [];
        mediaRecorderRef.current.addEventListener('dataavailable', event => {
          audioChunks.push(event.data);
        });
        
        mediaRecorderRef.current.addEventListener('stop', () => {
          // Here you could save the audio blob or upload it
        });
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
        alert('Could not access microphone. Please check your device settings.');
        setIsRecording(false);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    stopSpeechRecognition();
    
    // Add the user's answer to the chat history if not already added
    const currentQ = getCurrentQuestion();
    const userAnswer = transcript.trim();
    
    if (currentQ && userAnswer && !chatHistory.some(item => 
      item.type === 'user' && item.questionId === currentQ.id
    )) {
      setChatHistory(prev => [
        ...prev,
        { 
          type: 'user', 
          text: userAnswer,
          questionId: currentQ.id 
        }
      ]);
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
      [questionId]: !showSampleAnswer[questionId]
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Function to render AI avatar
  const renderAIAvatar = () => {
    const baseClasses = `w-12 h-12 rounded-full flex items-center justify-center ${
      isDark ? 'bg-blue-600' : 'bg-blue-500'
    }`;
    
    // Add animation when speaking
    let expressionClasses = '';
    if (interviewerSpeaking) {
      expressionClasses = 'animate-pulse';
    }
    
    return (
      <div className={`${baseClasses} ${expressionClasses}`}>
        <Bot className="w-6 h-6 text-white" />
      </div>
    );
  };

  // Manual navigation function to avoid using navigate() during render
  const handleManualNavigate = (path) => {
    setRedirectPath(path);
    setShouldRedirect(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className={`w-12 h-12 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => handleManualNavigate('/interviews')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Return to Interviews
        </button>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className={`text-center p-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Interview Not Found</h2>
        <p className="mb-4">Sorry, we couldn't find the interview you're looking for.</p>
        <button
          onClick={() => handleManualNavigate('/interviews')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Return to Interviews
        </button>
      </div>
    );
  }

  // If there's a response with feedback, plan to redirect but don't do it during render
  if (response && response.feedback && !shouldRedirect) {
    setRedirectPath(`/interviews/${id}/feedback`);
    setShouldRedirect(true);
    return null;
  }

  const currentQ = getCurrentQuestion();
  const isLastQuestion = currentQuestion === interview.questions.length - 1;

  return (
    <div className={`max-w-6xl mx-auto px-4 py-4 md:py-8 min-h-screen flex flex-col ${
      isDark ? 'text-white' : 'text-gray-800'
    }`}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">Interview in Progress</h1>
        <div className={`px-3 py-1 text-sm rounded-full ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          Question {currentQuestion + 1} of {interview.questions.length}
        </div>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {/* Chat/Interview Panel - Takes 2/3 on desktop */}
        <div className="md:col-span-2 flex flex-col">
          <motion.div
            className={`flex-grow p-4 md:p-6 rounded-lg shadow-lg mb-4 overflow-hidden flex flex-col ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex-grow overflow-y-auto mb-4" ref={chatContainerRef} style={{ maxHeight: '60vh' }}>
              <AnimatePresence>
                {chatHistory.map((message, index) => (
                  <motion.div
                    key={`message-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 flex ${message.type === 'interviewer' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`flex ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%]`}>
                      {message.type === 'interviewer' && (
                        <div className="mr-3 flex-shrink-0">
                          {renderAIAvatar()}
                        </div>
                      )}
                      
                      <div className={`p-3 rounded-lg ${
                        message.type === 'interviewer' 
                          ? isDark 
                            ? message.isTransition || message.isCompletion 
                              ? 'bg-gray-700 text-gray-300' 
                              : 'bg-blue-600 text-white'
                            : message.isTransition || message.isCompletion 
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-blue-500 text-white'
                          : isDark 
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {message.type === 'interviewer' && message.questionType && !message.isTransition && !message.isCompletion && (
                          <div className={`text-xs font-medium mb-1 ${
                            isDark ? 'text-blue-200' : 'text-blue-100'
                          }`}>
                            {message.questionType.toUpperCase()}
                          </div>
                        )}
                        <div className="text-sm md:text-base">
                          {message.text}
                        </div>
                      </div>
                      
                      {message.type === 'user' && (
                        <div className="ml-3 flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-500`}>
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
                      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex space-x-1">
                          <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0ms' }}></div>
                          <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '200ms' }}></div>
                          <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '400ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Input area */}
            <div className={`p-3 rounded-lg ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            } flex items-center justify-between`}>
              <div className="flex-grow">
                {isRecording ? (
                  <textarea
                    value={transcript}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    className={`w-full p-2 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                    }`}
                    rows="2"
                    placeholder="Your answer will appear here as you speak..."
                  />
                ) : (
                  <p className={`text-sm ${transcript ? '' : 'italic text-gray-500'}`}>
                    {transcript || "Press the microphone button to start answering"}
                  </p>
                )}
              </div>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`ml-2 p-3 rounded-full ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>
          
          {/* Navigation controls */}
          <div className={`p-4 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestion === 0}
                className={`py-2 px-4 rounded-lg flex items-center ${
                  currentQuestion === 0
                    ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
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
                      ? 'bg-green-500 text-white cursor-wait'
                      : 'bg-green-600 hover:bg-green-700 text-white'
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
                    isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Next
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Info Panel - Takes 1/3 on desktop */}
        <div className="md:col-span-1">
          <div className={`p-4 md:p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} mb-4`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Current Question</h3>
              <div className={`px-2 py-1 text-xs rounded-full ${
                isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
              }`}>
                {formatTime(timeSpent)}
              </div>
            </div>
            
            {currentQ && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {currentQ.type.toUpperCase()}
                </p>
                <p className="font-medium">{currentQ.question}</p>
              </div>
            )}
            
            <div className="mt-4">
              <button
                onClick={() => currentQ && toggleSampleAnswer(currentQ.id)}
                className={`text-sm flex items-center ${
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                {showSampleAnswer[currentQ?.id] ? 'Hide sample answer' : 'Show sample answer'}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`w-4 h-4 ml-1 transition-transform ${
                    showSampleAnswer[currentQ?.id] ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {currentQ && showSampleAnswer[currentQ.id] && (
                <div className={`mt-3 p-3 text-sm rounded-lg ${
                  isDark ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800'
                }`}>
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
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                    : interviewerSpeaking
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={interviewerSpeaking ? "Speaking..." : "Read question aloud"}
              >
                <Volume2 className={`h-5 w-5 ${interviewerSpeaking ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className={`p-4 md:p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} mb-4`}>
            <h3 className="font-medium mb-3">Interview Tips</h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-start">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                  isDark ? 'bg-blue-400' : 'bg-blue-500'
                }`}></div>
                <span>Speak clearly and at a moderate pace</span>
              </li>
              <li className="flex items-start">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                  isDark ? 'bg-blue-400' : 'bg-blue-500'
                }`}></div>
                <span>Provide specific examples in your answers</span>
              </li>
              <li className="flex items-start">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                  isDark ? 'bg-blue-400' : 'bg-blue-500'
                }`}></div>
                <span>Focus on your relevant skills and experience</span>
              </li>
              <li className="flex items-start">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                  isDark ? 'bg-blue-400' : 'bg-blue-500'
                }`}></div>
                <span>It's okay to take a moment before answering</span>
              </li>
              <li className="flex items-start">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                  isDark ? 'bg-blue-400' : 'bg-blue-500'
                }`}></div>
                <span>Use the STAR method for behavioral questions</span>
              </li>
            </ul>
          </div>

          <div className={`p-4 md:p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="font-medium mb-3">Interview Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Progress</span>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    {currentQuestion + 1}/{interview.questions.length}
                  </span>
                </div>
                <div className={`h-2 w-full rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${((currentQuestion + 1) / interview.questions.length) * 100}%` }}
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
                          ? isDark ? 'text-blue-400' : 'text-blue-600'
                          : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 text-xs ${
                        index === currentQuestion
                          ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                          : index < currentQuestion 
                            ? isDark ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                            : isDark ? 'bg-gray-800 border border-gray-700 text-gray-400' : 'bg-white border border-gray-300 text-gray-500'
                      }`}>
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