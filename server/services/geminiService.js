// services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate interview questions using Google's Gemini API
 * @param {Object} interviewData - Contains role, experience, techStack, difficulty
 * @returns {Promise<Array>} - Array of interview questions
 */
exports.generateInterviewQuestions = async (interviewData) => {
  try {
    const { role, experience, techStack, difficulty } = interviewData;
    
    // Get the Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Create a prompt for generating interview questions
    const prompt = createPromptForGemini(role, experience, techStack, difficulty);
    
    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response - Gemini should return JSON formatted questions
    try {
      // The response should be a JSON string of questions
      // If not properly formatted, we'll catch the error and use fallback
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      // If parsing fails, try to extract JSON from the text response
      // This is in case Gemini returns some explanatory text with the JSON
      const jsonMatch = text.match(/```json([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1].trim());
        } catch (e) {
          throw new Error('Failed to parse JSON from Gemini response');
        }
      } else {
        // Use fallback if no JSON found
        return generateFallbackQuestions(interviewData);
      }
    }
  } catch (error) {
    console.error('Error with Gemini API:', error);
    // Fallback to local question generation if Gemini API fails
    return generateFallbackQuestions(interviewData);
  }
};

/**
 * Create a prompt for Gemini based on interview parameters
 */
function createPromptForGemini(role, experience, techStack, difficulty) {
  let prompt = `Generate a set of interview questions for a ${role} position with ${experience} years of experience. `;
  
  if (techStack && techStack.length > 0) {
    prompt += `The candidate has experience with ${techStack.join(', ')}. `;
  }
  
  prompt += `The interview difficulty should be ${difficulty}. `;
  
  prompt += `Include the following question types:
  1. One introduction question to help the candidate introduce themselves
  2. Three technical questions related to the role and technology stack
  3. Two problem-solving questions relevant to the experience level
  4. One question about handling difficult situations or challenges
  5. One question about future goals or aspirations
  
  For each question, please provide:
  - An "id" field that is unique for each question (use format like "q1", "q2", etc.)
  - The "question" text
  - The "type" of question (introduction, technical, problem-solving, scenario, goals)
  - A "sampleAnswer" field with a sample good answer that could be used for evaluation
  
  Format the response as a JSON array of question objects.
  
  Example format:
  [
    {
      "id": "q1",
      "question": "Tell me about yourself and your experience",
      "type": "introduction",
      "sampleAnswer": "A good answer would include..."
    }
  ]
  
  Return ONLY the JSON array without any other text.`;
  
  return prompt;
}

/**
 * Generate fallback questions if the Gemini API fails
 * This uses the same logic as our original local generation method
 */
function generateFallbackQuestions(interviewData) {
  const { role, experience, techStack, difficulty } = interviewData;
  
  // Basic questions that appear in most interviews
  const questions = [
    {
      id: "q1",
      question: "Tell me about yourself and your experience as a " + role,
      type: "introduction",
      sampleAnswer: "A good answer would include a brief overview of professional background, relevant experience as a " + role + ", key skills, and notable achievements or projects."
    },
    {
      id: "q2",
      question: "Where do you see yourself professionally in the next 3-5 years?",
      type: "goals",
      sampleAnswer: "A good answer would show ambition balanced with realism, mention skill development goals, and demonstrate commitment to growing in the field."
    }
  ];
  
  // Generate role-specific technical questions
  if (role.includes("Frontend")) {
    questions.push(
      {
        id: "q3",
        question: difficulty === "easy" 
          ? "Can you explain the difference between HTML, CSS, and JavaScript?" 
          : difficulty === "medium" 
            ? "Explain how virtual DOM works and its advantages over direct DOM manipulation."
            : "Describe how you would implement a complex state management system for a large-scale application with multiple user roles.",
        type: "technical",
        sampleAnswer: "Answer should demonstrate clear understanding of frontend concepts appropriate to the difficulty level."
      },
      {
        id: "q4",
        question: "How do you optimize the performance of a web application?",
        type: "technical",
        sampleAnswer: "A good answer would mention techniques like code splitting, lazy loading, efficient rendering, and proper asset optimization."
      }
    );
  } else if (role.includes("Backend")) {
    questions.push(
      {
        id: "q3",
        question: difficulty === "easy"
          ? "What is RESTful API and what are its key principles?"
          : difficulty === "medium"
            ? "Explain the differences between horizontal and vertical scaling of backend systems."
            : "How would you design a highly available distributed system that can handle millions of requests per minute?",
        type: "technical",
        sampleAnswer: "Answer should show understanding of backend principles with depth appropriate to difficulty level."
      },
      {
        id: "q4",
        question: "How do you handle database optimization and query performance?",
        type: "technical",
        sampleAnswer: "A good answer would cover indexing, query optimization, caching strategies, and possibly database sharding for higher difficulty levels."
      }
    );
  } else if (role.includes("Full Stack")) {
    questions.push(
      {
        id: "q3",
        question: "Explain your approach to building a complete web application from frontend to backend.",
        type: "technical",
        sampleAnswer: "A comprehensive answer would cover technology selection, architecture decisions, data flow, and implementation strategy."
      },
      {
        id: "q4",
        question: difficulty === "easy"
          ? "How do you connect a frontend application with a backend API?"
          : difficulty === "medium"
            ? "Describe how you would implement authentication and authorization in a full stack application."
            : "How would you architect a microservices-based application with different frontend clients?",
        type: "technical",
        sampleAnswer: "Answer should demonstrate end-to-end understanding with appropriate technical depth."
      }
    );
  }
  
  // Add tech stack specific question if provided
  if (techStack && techStack.length > 0) {
    const primaryTech = techStack[0];
    
    if (primaryTech === "React") {
      questions.push({
        id: "q5",
        question: difficulty === "easy"
          ? "What are React components and what are the different types?"
          : difficulty === "medium"
            ? "Explain React hooks and how they've changed state management."
            : "Describe advanced patterns like render props and higher-order components in React.",
        type: "technical",
        sampleAnswer: "Answer should show mastery of React concepts appropriate to the difficulty level."
      });
    } else if (primaryTech === "Node.js") {
      questions.push({
        id: "q5",
        question: difficulty === "easy"
          ? "What is Node.js and what are its advantages?"
          : difficulty === "medium"
            ? "Explain the event loop in Node.js and how it enables asynchronous operations."
            : "How would you handle memory leaks in a Node.js application?",
        type: "technical",
        sampleAnswer: "Answer should demonstrate Node.js expertise appropriate to the difficulty level."
      });
    } else {
      questions.push({
        id: "q5",
        question: `Describe your experience with ${primaryTech} and how you've used it in your projects.`,
        type: "technical",
        sampleAnswer: `A good answer would demonstrate hands-on experience with ${primaryTech}, including specific projects, challenges faced, and solutions implemented.`
      });
    }
  }
  
  // Add problem-solving questions
  questions.push({
    id: "q6",
    question: difficulty === "easy"
      ? "How would you debug a simple application that's not working correctly?"
      : "Describe how you would approach refactoring legacy code.",
    type: "problem-solving",
    sampleAnswer: "Answer should demonstrate a methodical approach to problem-solving with attention to detail."
  });
  
  // Add a scenario question
  questions.push({
    id: "q7",
    question: difficulty === "easy"
      ? "Tell me about a time when you faced a challenging deadline. How did you manage it?"
      : difficulty === "medium"
        ? "Describe a situation where you had to work with a difficult team member. How did you handle it?"
        : "Tell me about a time when you had to lead a project that was failing. How did you turn it around?",
    type: "scenario",
    sampleAnswer: "Answer should demonstrate interpersonal skills, conflict resolution, and professional maturity."
  });
  
  return questions;
}