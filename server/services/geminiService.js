// services/geminiService.js
const { GoogleGenAI } = require('@google/genai');

// Initialize the Google GenAI with your API key
const ai = new GoogleGenAI({ 
  apiKey: "AIzaSyC_yYsuzszRgxsYjdGjcvAqAIUsMKaDhts" 
});

/**
 * Generate interview questions using Google's Gemini API
 * @param {Object} interviewData - Contains role, experience, techStack, difficulty
 * @returns {Promise<Array>} - Array of interview questions
 */
exports.generateInterviewQuestions = async (interviewData) => {
  try {
    const { role, experience, techStack, difficulty } = interviewData;
    
    // Create a prompt for generating interview questions
    const prompt = createPromptForGemini(role, experience, techStack, difficulty);
    
    console.log('Sending prompt to Gemini:', prompt);
    
    // Generate content with Gemini using the new API structure
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }], // Use proper format with role and parts
    });
    
    console.log('Raw Gemini response:', JSON.stringify(response, null, 2));
    
    // Check if response has the expected structure
    if (!response || !response.response) {
      console.error('Unexpected Gemini response structure:', response);
      return generateFallbackQuestions(interviewData);
    }
    
    // Get the text from the response correctly based on the API structure
    const text = response.response.text();
    
    console.log('Extracted text from Gemini response:', text);
    
    // Parse the response - Gemini should return JSON formatted questions
    try {
      // Try direct JSON parsing
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing Gemini response as JSON:', parseError);
      
      // If parsing fails, try to extract JSON from the text response
      // This is in case Gemini returns some explanatory text with the JSON
      const jsonMatch = text.match(/```json([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const extractedJson = jsonMatch[1].trim();
          console.log('Extracted JSON from markdown blocks:', extractedJson);
          return JSON.parse(extractedJson);
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
          throw new Error('Failed to parse JSON from Gemini response');
        }
      } else {
        console.log('No JSON block found, falling back to local generation');
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
 * This uses robust role-specific question generation
 */
function generateFallbackQuestions(interviewData) {
  const { role, experience, techStack, difficulty } = interviewData;
  
  // Parse experience level to determine seniority
  const experienceYears = parseExperienceYears(experience);
  const experienceLevel = getExperienceLevel(experienceYears);
  
  // Basic questions that appear in most interviews
  const questions = [
    {
      id: "q1",
      question: `Tell me about yourself and your background as a ${role}. What inspired you to pursue this career path?`,
      type: "introduction",
      sampleAnswer: `A good answer would include a brief overview of professional background, relevant experience as a ${role}, key skills, notable achievements or projects, and a personal story about what led to this career choice. For instance: "I've been working as a ${role} for ${experienceYears} years, specializing in [specific domain]. My journey began when [personal story]. Throughout my career, I've worked on projects like [examples], which taught me [skills]. What I find most exciting about this field is [passion point]."`
    },
    {
      id: "q2",
      question: "Where do you see yourself professionally in the next 3-5 years, and how does this role align with your career goals?",
      type: "goals",
      sampleAnswer: `A good answer demonstrates ambition balanced with realism, mentions skill development goals, and shows commitment to growing in the field. For example: "In the next 3-5 years, I aim to deepen my expertise in [specific technologies/methodologies relevant to ${role}], take on more leadership responsibilities, and potentially mentor junior professionals. I'm particularly interested in developing skills in [emerging area relevant to position]. This role is appealing because it offers opportunities to work on [specific aspects of the job that align with career goals], which directly supports my professional development path."`
    }
  ];

  // Generate role-specific questions
  const roleQuestions = getRoleSpecificQuestions(role, experienceLevel, difficulty);
  questions.push(...roleQuestions);
  
  // Add tech stack specific questions if provided
  if (techStack && techStack.length > 0) {
    const techQuestions = getTechStackQuestions(techStack, role, difficulty);
    questions.push(...techQuestions);
  }
  
  // Add generic problem-solving questions based on difficulty
  questions.push(getProblemSolvingQuestion(role, difficulty, experienceLevel));
  
  // Add a scenario question based on experience level
  questions.push(getScenarioQuestion(role, difficulty, experienceLevel));
  
  // Ensure we have unique IDs
  return questions.map((q, index) => ({
    ...q,
    id: `q${index + 1}`
  }));
}

/**
 * Parse experience years from the experience string
 */
function parseExperienceYears(experience) {
  if (typeof experience !== 'string') return 3; // Default to mid-level
  
  if (experience.includes('Entry') || experience.includes('0-2')) {
    return 1;
  } else if (experience.includes('Mid') || experience.includes('3-5')) {
    return 4;
  } else if (experience.includes('Senior') || experience.includes('6+')) {
    return 7;
  }
  
  return 3; // Default to mid-level if parsing fails
}

/**
 * Get experience level category
 */
function getExperienceLevel(years) {
  if (years <= 2) return 'entry';
  if (years <= 5) return 'mid';
  return 'senior';
}

/**
 * Get role-specific technical questions
 */
function getRoleSpecificQuestions(role, experienceLevel, difficulty) {
  // Normalize the role for better matching
  const normalizedRole = role.toLowerCase();
  
  // Frontend Developer Questions
  if (normalizedRole.includes('frontend') || normalizedRole.includes('front end') || normalizedRole.includes('ui')) {
    return [
      {
        id: "q3",
        question: difficulty === "easy" 
          ? "Explain the difference between HTML, CSS, and JavaScript and their roles in modern web development." 
          : difficulty === "medium" 
            ? "Explain how the virtual DOM works in frameworks like React, and what advantages it offers over direct DOM manipulation."
            : "Describe how you would implement a complex state management system for a large-scale application with multiple user roles and real-time data requirements.",
        type: "technical",
        sampleAnswer: experienceLevel === "entry"
          ? "A good answer would explain that HTML provides structure, CSS handles styling, and JavaScript adds interactivity to web pages, with examples of how they work together."
          : experienceLevel === "mid"
            ? "A good answer would explain that the virtual DOM is an in-memory representation of the real DOM that frameworks like React use to improve performance by minimizing direct DOM manipulation. It would describe the diffing algorithm and reconciliation process."
            : "A good answer would discuss state management libraries like Redux or Context API, explain principles like immutability and unidirectional data flow, address concerns like performance optimization, and mention strategies for handling real-time updates."
      },
      {
        id: "q4",
        question: difficulty === "easy"
          ? "What are some ways to optimize the performance of a web application from the frontend perspective?"
          : difficulty === "medium"
            ? "Explain your approach to creating accessible and inclusive web interfaces. What standards and practices do you follow?"
            : "How would you architect a micro-frontend system that allows multiple teams to develop and deploy independently while maintaining a consistent user experience?",
        type: "technical",
        sampleAnswer: "A good answer would mention techniques relevant to experience level, such as code splitting, lazy loading, efficient rendering, proper asset optimization, caching strategies, and performance monitoring tools. For accessibility, WCAG guidelines, semantic HTML, keyboard navigation, and screen reader compatibility would be mentioned."
      },
      {
        id: "q5",
        question: difficulty === "easy"
          ? "How do you ensure your web designs are responsive and work well across different device sizes?"
          : difficulty === "medium"
            ? "Describe your experience with frontend testing. What types of tests do you write and what tools do you use?"
            : "How would you implement a design system that scales across multiple applications while ensuring consistency and developer efficiency?",
        type: "technical",
        sampleAnswer: "A good answer would discuss media queries, flexible layouts, mobile-first approach, and responsive frameworks for easy questions. For testing, unit tests, integration tests, and end-to-end tests would be mentioned along with tools like Jest, React Testing Library, or Cypress. For design systems, component libraries, documentation, style guides, and collaboration between design and development teams would be addressed."
      }
    ];
  }
  
  // Backend Developer Questions
  else if (normalizedRole.includes('backend') || normalizedRole.includes('back end') || normalizedRole.includes('server')) {
    return [
      {
        id: "q3",
        question: difficulty === "easy"
          ? "What is RESTful API architecture and what are its key principles?"
          : difficulty === "medium"
            ? "Explain the differences between horizontal and vertical scaling of backend systems. When would you choose one over the other?"
            : "How would you design a highly available distributed system that can handle millions of requests per minute while ensuring data consistency?",
        type: "technical",
        sampleAnswer: "A good answer would explain REST principles including statelessness, client-server architecture, cacheability, uniform interface, and resource-based routes for simple questions. For scaling questions, load balancing, database sharding, and service-oriented architecture would be discussed. Advanced answers would cover CAP theorem, eventual consistency, circuit breakers, and bulkhead patterns."
      },
      {
        id: "q4",
        question: difficulty === "easy"
          ? "What are some common approaches to handle database optimization and query performance?"
          : difficulty === "medium"
            ? "Explain your approach to error handling and logging in backend systems. How do you ensure issues can be diagnosed and fixed quickly?"
            : "Describe your experience implementing authentication and authorization systems. How would you design a secure system that scales to millions of users?",
        type: "technical",
        sampleAnswer: "A good answer would cover techniques like indexing, query optimization, normalization/denormalization, and caching for database questions. For error handling, structured logging, monitoring, alerting, and graceful degradation would be mentioned. Security answers would address JWT, OAuth, password hashing, rate limiting, and security best practices."
      },
      {
        id: "q5",
        question: difficulty === "easy"
          ? "What is database normalization and when might you choose to denormalize data?"
          : difficulty === "medium"
            ? "Describe your experience with message queues and asynchronous processing. What problems do they solve?"
            : "How would you implement a microservice architecture that ensures data consistency across services while maintaining system resilience?",
        type: "technical",
        sampleAnswer: "A good answer would explain normalization forms, redundancy reduction, and performance trade-offs for basic questions. For queuing, message brokers, event-driven architecture, and decoupling services would be discussed. Advanced microservice answers would cover saga patterns, distributed transactions, event sourcing, and CQRS."
      }
    ];
  }
  
  // Full Stack Developer Questions
  else if (normalizedRole.includes('full stack') || normalizedRole.includes('fullstack')) {
    return [
      {
        id: "q3",
        question: difficulty === "easy"
          ? "Explain your approach to building a complete web application from frontend to backend."
          : difficulty === "medium"
            ? "How do you handle state management across the frontend and backend in a full stack application?"
            : "Describe how you would architect a scalable application that handles high traffic and complex business logic.",
        type: "technical",
        sampleAnswer: "A good answer would cover technology selection, architecture decisions, data flow, and implementation strategy with examples from past projects. It would demonstrate end-to-end understanding from database design to UI/UX."
      },
      {
        id: "q4",
        question: difficulty === "easy"
          ? "How do you connect a frontend application with a backend API? What considerations are important?"
          : difficulty === "medium"
            ? "Describe how you would implement authentication and authorization in a full stack application."
            : "How would you architect a microservices-based application with different frontend clients while ensuring consistency and security?",
        type: "technical",
        sampleAnswer: "A good answer would discuss API design, error handling, state management, and security considerations. For authentication, it would cover JWT, sessions, OAuth flows, and protection against common attacks. Advanced answers would address API gateways, BFFs, and cross-cutting concerns."
      },
      {
        id: "q5",
        question: difficulty === "easy"
          ? "What strategies do you use for debugging issues that span both frontend and backend components?"
          : difficulty === "medium"
            ? "How do you approach database design and data modeling in a full stack application?"
            : "Describe your experience with deployment pipelines and DevOps practices for full stack applications.",
        type: "technical",
        sampleAnswer: "A good answer would mention logging, monitoring tools, browser dev tools, and systematic troubleshooting approaches. For data modeling, relationship design, ORM usage, and normalization considerations would be discussed. DevOps answers would cover CI/CD, containerization, infrastructure as code, and automated testing."
      }
    ];
  }
  
  // DevOps Engineer Questions
  else if (normalizedRole.includes('devops') || normalizedRole.includes('sre') || normalizedRole.includes('operations')) {
    return [
      {
        id: "q3",
        question: difficulty === "easy"
          ? "Explain the concept of CI/CD and its benefits in the software development lifecycle."
          : difficulty === "medium"
            ? "Describe your experience with containerization and orchestration technologies. What challenges have you encountered and how did you solve them?"
            : "How would you design a multi-environment deployment pipeline with automated testing, security scanning, and blue-green deployments?",
        type: "technical",
        sampleAnswer: "A good answer would explain continuous integration and delivery practices, automation benefits, and quality improvements. For containerization, Docker, Kubernetes, service discovery, and scaling strategies would be discussed. Advanced pipeline answers would address environment parity, security gates, and zero-downtime deployments."
      },
      {
        id: "q4",
        question: difficulty === "easy"
          ? "What monitoring and alerting tools have you worked with? How do you determine what to monitor?"
          : difficulty === "medium"
            ? "Explain your approach to infrastructure as code. What tools do you use and what are the advantages?"
            : "How would you implement a comprehensive observability strategy for a distributed microservices architecture?",
        type: "technical",
        sampleAnswer: "A good answer would mention specific monitoring tools, key metrics, and alert threshold strategies. For IaC, tools like Terraform, CloudFormation, or Ansible would be discussed along with version control and testing approaches. Advanced observability answers would cover the three pillars: metrics, logs, and traces."
      },
      {
        id: "q5",
        question: difficulty === "easy"
          ? "How do you approach security in a DevOps environment?"
          : difficulty === "medium"
            ? "Describe your experience with cloud services and architecture. How do you ensure cost optimization?"
            : "How would you design a self-healing infrastructure that automatically detects and resolves issues with minimal human intervention?",
        type: "technical",
        sampleAnswer: "A good answer would discuss security scanning, secret management, least privilege principles, and compliance automation. For cloud questions, specific services, architecture patterns, and cost management strategies would be addressed. Self-healing answers would cover auto-scaling, health checks, circuit breakers, and recovery automation."
      }
    ];
  }
  
  // Data Scientist Questions
  else if (normalizedRole.includes('data sci') || normalizedRole.includes('machine learning') || normalizedRole.includes('ml')) {
    return [
      {
        id: "q3",
        question: difficulty === "easy"
          ? "Explain the difference between supervised and unsupervised learning with examples."
          : difficulty === "medium"
            ? "Describe your approach to feature engineering and selection. How do you determine which features are most important?"
            : "How would you build and deploy a machine learning system that requires real-time predictions with high availability?",
        type: "technical",
        sampleAnswer: "A good answer would define each learning type, provide use cases, and explain when to use each approach. For feature engineering, techniques like normalization, encoding, and feature importance methods would be discussed. Advanced deployment answers would address model serving architectures, performance optimization, and monitoring."
      },
      {
        id: "q4",
        question: difficulty === "easy"
          ? "How do you evaluate the performance of a machine learning model? What metrics do you use?"
          : difficulty === "medium"
            ? "Explain how you handle imbalanced datasets and why it's important."
            : "Describe your experience with deep learning architectures. When would you choose deep learning over traditional machine learning approaches?",
        type: "technical",
        sampleAnswer: "A good answer would discuss appropriate metrics for different problem types (classification vs. regression), cross-validation, and overfitting concerns. For imbalanced data, sampling techniques, specialized metrics, and algorithmic approaches would be covered. Deep learning answers would address neural network architectures, use cases, and computational requirements."
      },
      {
        id: "q5",
        question: difficulty === "easy"
          ? "What steps do you take to clean and prepare data for analysis?"
          : difficulty === "medium"
            ? "How do you approach A/B testing and experimentation? What statistical considerations are important?"
            : "How would you design a recommendation system that scales to millions of users and items while maintaining personalization quality?",
        type: "technical",
        sampleAnswer: "A good answer would cover data cleaning techniques, outlier detection, missing value handling, and transformation methods. For A/B testing, experiment design, statistical significance, power analysis, and avoiding common pitfalls would be discussed. Recommendation system answers would address collaborative filtering, content-based methods, hybrid approaches, and cold-start problems."
      }
    ];
  }
  
  // Product Manager Questions
  else if (normalizedRole.includes('product') && normalizedRole.includes('manager')) {
    return [
      {
        id: "q3",
        question: difficulty === "easy"
          ? "What is your process for prioritizing features in a product roadmap?"
          : difficulty === "medium"
            ? "How do you balance stakeholder requests with user needs when they conflict?"
            : "Describe how you would lead a product strategy pivot when market conditions significantly change.",
        type: "technical",
        sampleAnswer: "A good answer would discuss prioritization frameworks, data-driven decision making, and business impact assessment methods. For stakeholder management, communication strategies, data presentation, and negotiation approaches would be covered. Strategic pivot answers would address market research, competitive analysis, and change management."
      },
      {
        id: "q4",
        question: difficulty === "easy"
          ? "How do you gather and incorporate user feedback into product development?"
          : difficulty === "medium"
            ? "Describe your experience working with engineering teams. How do you translate business requirements into technical specifications?"
            : "How would you approach launching a new product in a highly competitive market?",
        type: "technical",
        sampleAnswer: "A good answer would mention user research methods, feedback channels, and iterative improvement processes. For technical collaboration, requirement documentation, user stories, acceptance criteria, and technical constraints would be discussed. Market entry answers would cover competitive analysis, differentiation strategy, and go-to-market planning."
      },
      {
        id: "q5",
        question: difficulty === "easy"
          ? "What metrics do you use to measure product success?"
          : difficulty === "medium"
            ? "Describe a situation where you had to make a significant product decision with incomplete information."
            : "How would you build and manage a product team that consistently delivers innovative solutions?",
        type: "technical",
        sampleAnswer: "A good answer would discuss both business metrics (revenue, retention) and product metrics (engagement, conversion) with examples. For decision-making, approaches to risk assessment, validation, and course correction would be covered. Team building answers would address hiring strategies, innovation processes, and fostering a product culture."
      }
    ];
  }
  
  // QA Engineer Questions
  else if (normalizedRole.includes('qa') || normalizedRole.includes('test') || normalizedRole.includes('quality')) {
    return [
      {
        id: "q3",
        question: difficulty === "easy"
          ? "What is your approach to test planning and test case design?"
          : difficulty === "medium"
            ? "Explain the difference between various types of testing and when you would use each."
            : "How would you implement a comprehensive test automation strategy for a large application with both legacy and new components?",
        type: "technical",
        sampleAnswer: "A good answer would discuss test coverage, risk-based testing, and requirements traceability. For test types, unit, integration, system, and acceptance testing would be explained with appropriate use cases. Automation strategy answers would cover tool selection, framework design, and maintenance approaches."
      },
      {
        id: "q4",
        question: difficulty === "easy"
          ? "How do you ensure that your testing is thorough and catches critical issues?"
          : difficulty === "medium"
            ? "Describe your experience with test automation tools and frameworks."
            : "How would you implement continuous testing in a CI/CD pipeline while ensuring it doesn't become a bottleneck?",
        type: "technical",
        sampleAnswer: "A good answer would discuss boundary analysis, equivalence partitioning, and exploratory testing techniques. For automation tools, specific frameworks and languages would be mentioned with pros and cons. CI/CD integration answers would address parallel execution, selective testing, and failure handling strategies."
      },
      {
        id: "q5",
        question: difficulty === "easy"
          ? "How do you approach regression testing when a feature changes?"
          : difficulty === "medium"
            ? "Explain your approach to performance testing. What metrics do you focus on?"
            : "How would you build a QA strategy for a complex system with microservices, mobile apps, and third-party integrations?",
        type: "technical",
        sampleAnswer: "A good answer would cover impact analysis, test prioritization, and automation for regression testing. For performance testing, load profiles, bottleneck identification, and monitoring would be discussed. Complex system answers would address end-to-end testing challenges, service virtualization, and risk-based test coverage."
      }
    ];
  }
  
  // Mobile Developer Questions
  else if (normalizedRole.includes('mobile') || normalizedRole.includes('ios') || normalizedRole.includes('android')) {
    return [
      {
        id: "q3",
        question: difficulty === "easy"
          ? "Explain the app lifecycle and how you manage state across different app states."
          : difficulty === "medium"
            ? "How do you ensure your mobile applications perform well on a variety of devices and network conditions?"
            : "Describe your approach to architecting a complex mobile application with offline capabilities and real-time synchronization.",
        type: "technical",
        sampleAnswer: "A good answer would discuss app states, lifecycle methods, and state persistence approaches. For performance, memory management, rendering optimization, and network handling would be covered. Architecture answers would address local storage, conflict resolution, and synchronization patterns."
      },
      {
        id: "q4",
        question: difficulty === "easy"
          ? "What approaches do you use for handling user interface and responsive design in mobile apps?"
          : difficulty === "medium"
            ? "Explain your experience with native APIs and device capabilities. How do you handle platform differences?"
            : "How would you implement a secure mobile application that handles sensitive user data and communications?",
        type: "technical",
        sampleAnswer: "A good answer would cover layout systems, responsive design patterns, and UI component reuse. For platform differences, abstraction layers, feature detection, and graceful degradation would be discussed. Security answers would address encryption, secure storage, certificate pinning, and authentication."
      },
      {
        id: "q5",
        question: difficulty === "easy"
          ? "What is your approach to testing mobile applications?"
          : difficulty === "medium"
            ? "How do you handle app updates and backward compatibility?"
            : "Describe your experience with cross-platform development versus native development. What are the trade-offs?",
        type: "technical",
        sampleAnswer: "A good answer would mention device testing, emulators, UI automation, and beta testing approaches. For updates, versioning strategies, migration paths, and feature flagging would be covered. Cross-platform answers would discuss performance implications, native integration challenges, and development efficiency."
      }
    ];
  }
  
  // Software Engineer (General) Questions
  else {
    return [
      {
        id: "q3",
        question: difficulty === "easy"
          ? "What programming languages and frameworks are you most comfortable with, and why do you prefer them?"
          : difficulty === "medium"
            ? "Explain your approach to code quality and technical debt management."
            : "How would you design a scalable system architecture for a high-traffic application with complex business rules?",
        type: "technical",
        sampleAnswer: "A good answer would discuss language strengths, ecosystem benefits, and specific features that enhance productivity. For code quality, testing practices, code reviews, and refactoring strategies would be covered. Architecture answers would address scalability patterns, separation of concerns, and performance considerations."
      },
      {
        id: "q4",
        question: difficulty === "easy"
          ? "How do you approach debugging a complex issue in an application?"
          : difficulty === "medium"
            ? "Describe your experience with design patterns. When and how do you apply them?"
            : "How would you design and implement a system that needs to process large volumes of data in near real-time?",
        type: "technical",
        sampleAnswer: "A good answer would mention methodical troubleshooting, logging, monitoring tools, and root cause analysis. For design patterns, specific patterns, appropriate use cases, and implementation trade-offs would be discussed. Data processing answers would cover stream processing, partitioning strategies, and throughput optimization."
      },
      {
        id: "q5",
        question: difficulty === "easy"
          ? "How do you stay updated with the latest technologies and best practices in software development?"
          : difficulty === "medium"
            ? "Explain your approach to writing maintainable and testable code."
            : "Describe your experience with system optimization and performance tuning. How do you identify and resolve bottlenecks?",
        type: "technical",
        sampleAnswer: "A good answer would mention learning resources, community involvement, and practical application of new knowledge. For maintainable code, SOLID principles, clean code practices, and testing strategies would be covered. Performance tuning answers would discuss profiling tools, benchmarking, and systematic optimization approaches."
      }
    ];
  }
}

/**
 * Get technology-specific questions based on the provided tech stack
 */
function getTechStackQuestions(techStack, role, difficulty) {
  if (!techStack || techStack.length === 0) {
    return [];
  }
  
  // Get the primary technologies (up to 2)
  const primaryTechs = techStack.slice(0, 2);
  const questions = [];
  
  primaryTechs.forEach((tech, index) => {
    const normalizedTech = tech.toLowerCase();
    
    // JavaScript/TypeScript
    if (normalizedTech.includes('javascript') || normalizedTech.includes('typescript')) {
      questions.push({
        id: `q${index + 6}`, // Start from q6
        question: difficulty === "easy"
          ? "Explain the concepts of hoisting and closures in JavaScript."
          : difficulty === "medium"
            ? "Describe the advantages TypeScript offers over JavaScript and how you've used it to improve code quality."
            : "How would you optimize a complex JavaScript application with performance issues and memory leaks?",
        type: "technical",
        sampleAnswer: "A good answer would explain how variable and function declarations are hoisted to the top of their scope and how closures capture variables from parent scopes. For TypeScript, type safety, interface definitions, and tooling benefits would be mentioned. Performance optimization answers would discuss profiling, bundle analysis, memoization, and garbage collection patterns."
      });
    }
    
    // React
    else if (normalizedTech.includes('react')) {
      questions.push({
        id: `q${index + 6}`,
        question: difficulty === "easy"
          ? "Explain the component lifecycle in React and how you manage side effects."
          : difficulty === "medium"
            ? "Describe your experience with React hooks and how they've changed your approach to state management."
            : "How would you architect a large-scale React application with multiple user roles, complex state requirements, and high performance needs?",
        type: "technical",
        sampleAnswer: "A good answer would discuss component mounting, updating, and unmounting phases, and how useEffect manages side effects. For hooks, useState, useEffect, useMemo, useCallback usage patterns would be covered. Architecture answers would address state management solutions, code splitting, memoization, and performance optimization techniques."
      });
    }
    
    // Node.js
    else if (normalizedTech.includes('node')) {
      questions.push({
        id: `q${index + 6}`,
        question: difficulty === "easy"
          ? "Explain the event loop in Node.js and how asynchronous operations work."
          : difficulty === "medium"
            ? "Describe your approach to error handling and debugging in Node.js applications."
            : "How would you design a Node.js application that needs to handle thousands of concurrent connections with minimal latency?",
        type: "technical",
        sampleAnswer: "A good answer would explain the non-blocking I/O model, event loop phases, and callback patterns. For error handling, async/await patterns, try/catch blocks, and centralized error handling would be discussed. Scalability answers would address clustering, load balancing, and stream processing techniques."
      });
    }
    
    // Python
    else if (normalizedTech.includes('python')) {
      questions.push({
        id: `q${index + 6}`,
        question: difficulty === "easy"
          ? "What are the key features of Python that make it suitable for your work? Explain how you use them."
          : difficulty === "medium"
            ? "Explain your experience with Python's concurrency models (threads, asyncio, multiprocessing). When would you use each?"
            : "How would you optimize a Python application with performance bottlenecks? What tools and techniques would you use?",
        type: "technical",
        sampleAnswer: "A good answer would cover Python's readability, extensive libraries, duck typing, and generator expressions. For concurrency, the GIL limitations, asyncio for I/O-bound tasks, and multiprocessing for CPU-bound tasks would be discussed. Optimization answers would mention profiling tools, vectorization with NumPy, Cython compilation, and algorithm improvements."
      });
    }
    
    // Machine Learning
    else if (normalizedTech.includes('machine learning') || normalizedTech.includes('ml') || normalizedTech.includes('ai')) {
      questions.push({
        id: `q${index + 6}`,
        question: difficulty === "easy"
          ? "Explain the differences between classification, regression, and clustering with examples."
          : difficulty === "medium"
            ? "Describe your approach to preventing overfitting in machine learning models."
            : "How would you build and deploy a production machine learning system that requires continuous retraining and monitoring?",
        type: "technical",
        sampleAnswer: "A good answer would define each learning type with appropriate use cases and evaluation metrics. For overfitting prevention, regularization techniques, cross-validation, and appropriate data splitting would be covered. MLOps answers would address automated pipelines, feature stores, model monitoring, and deployment strategies."
      });
    }
    
    // AWS/Cloud
    else if (normalizedTech.includes('aws') || normalizedTech.includes('azure') || normalizedTech.includes('cloud')) {
      questions.push({
        id: `q${index + 6}`,
        question: difficulty === "easy"
          ? "Describe your experience with cloud services and how you've utilized them in your projects."
          : difficulty === "medium"
            ? "Explain your approach to designing cost-effective and scalable cloud architectures."
            : "How would you implement a multi-region, highly available system with disaster recovery capabilities?",
        type: "technical",
        sampleAnswer: "A good answer would mention specific services used (compute, storage, networking) and implementation details. For architecture, auto-scaling strategies, serverless approaches, and resource optimization would be discussed. High availability answers would cover region replication, failover mechanisms, and recovery point/time objectives."
      });
    }
    
    // SQL/Databases
    else if (normalizedTech.includes('sql') || normalizedTech.includes('database') || normalizedTech.includes('postgres')) {
      questions.push({
        id: `q${index + 6}`,
        question: difficulty === "easy"
          ? "Explain your approach to database design and schema optimization."
          : difficulty === "medium"
            ? "How do you ensure database performance when dealing with large datasets and complex queries?"
            : "Describe your experience with database sharding and partitioning strategies for high-scale applications.",
        type: "technical",
        sampleAnswer: "A good answer would cover normalization principles, indexing strategies, and relationship modeling. For performance, query optimization, execution plans, and caching would be discussed. Sharding answers would address partition keys, data distribution strategies, and handling cross-shard operations."
      });
    }
    
    // NoSQL
    else if (normalizedTech.includes('mongo') || normalizedTech.includes('nosql') || normalizedTech.includes('dynamodb')) {
      questions.push({
        id: `q${index + 6}`,
        question: difficulty === "easy"
          ? "Compare SQL and NoSQL databases. When would you choose one over the other?"
          : difficulty === "medium"
            ? "Explain your approach to data modeling in NoSQL databases like MongoDB or DynamoDB."
            : "How would you design a system that combines relational and NoSQL databases for different data access patterns?",
        type: "technical",
        sampleAnswer: "A good answer would discuss ACID properties, schema flexibility, and scaling characteristics. For data modeling, denormalization strategies, embedding vs. referencing, and query optimization would be covered. Hybrid system answers would address data consistency, synchronization patterns, and appropriate use cases for each database type."
      });
    }
    
    // Docker/Kubernetes
    else if (normalizedTech.includes('docker') || normalizedTech.includes('kubernetes') || normalizedTech.includes('container')) {
      questions.push({
        id: `q${index + 6}`,
        question: difficulty === "easy"
          ? "Explain containerization and its benefits in modern software development."
          : difficulty === "medium"
            ? "Describe your experience with Kubernetes and how you've used it to manage containerized applications."
            : "How would you design a Kubernetes-based platform for multiple development teams with different security and isolation requirements?",
        type: "technical",
        sampleAnswer: "A good answer would cover container isolation, portability, and consistent environments. For Kubernetes, deployment strategies, service discovery, and resource management would be discussed. Platform design answers would address namespaces, RBAC, network policies, and multi-tenancy considerations."
      });
    }
    
    // For any other technology, create a generic but effective question
    else {
      questions.push({
        id: `q${index + 6}`,
        question: difficulty === "easy"
          ? `Describe your experience with ${tech} and how you've applied it in your projects.`
          : difficulty === "medium"
            ? `What are the strengths and limitations of ${tech}? How have you overcome its challenges in your work?`
            : `How would you architect a complex system utilizing ${tech} for optimal performance, security, and maintainability?`,
        type: "technical",
        sampleAnswer: `A good answer would demonstrate hands-on experience with ${tech}, including specific projects, technical challenges faced, and solutions implemented. It should show depth of understanding appropriate to the claimed experience level and an awareness of best practices in the technology.`
      });
    }
  });
  
  return questions.slice(0, 2); // Limit to max 2 tech-specific questions
}

/**
 * Get a problem-solving question based on role and difficulty
 */
function getProblemSolvingQuestion(role, difficulty, experienceLevel) {
  const normalizedRole = role.toLowerCase();
  
  // Frontend specific problem-solving
  if (normalizedRole.includes('frontend') || normalizedRole.includes('ui')) {
    return {
      id: "problem-solving-1",
      question: difficulty === "easy"
        ? "How would you debug a UI issue where elements are not appearing correctly in a specific browser?"
        : difficulty === "medium"
          ? "Describe how you would approach refactoring a large legacy frontend codebase with minimal documentation."
          : "How would you architect a solution for a web application that needs to work offline and sync data when connectivity is restored?",
      type: "problem-solving",
      sampleAnswer: "A good answer would demonstrate a methodical approach to problem-solving, including isolation techniques, browser dev tools, and cross-browser testing for simple issues. For refactoring, incremental approaches, test coverage, and documentation strategies would be discussed. Complex offline solutions would address local storage, conflict resolution, and progressive enhancement."
    };
  }
  
  // Backend specific problem-solving
  else if (normalizedRole.includes('backend') || normalizedRole.includes('server')) {
    return {
      id: "problem-solving-1",
      question: difficulty === "easy"
        ? "How would you diagnose and fix a performance issue in a backend API?"
        : difficulty === "medium"
          ? "Describe how you would refactor a monolithic application into microservices."
          : "How would you design a system that needs to process millions of events per minute with guaranteed delivery and processing?",
      type: "problem-solving",
      sampleAnswer: "A good answer would mention profiling tools, database query optimization, and caching strategies for performance issues. For microservices, domain-driven design, service boundaries, and migration approaches would be discussed. High-throughput systems would address messaging patterns, backpressure handling, and exactly-once processing guarantees."
    };
  }
  
  // Data Science specific problem-solving
  else if (normalizedRole.includes('data sci') || normalizedRole.includes('machine learning')) {
    return {
      id: "problem-solving-1",
      question: difficulty === "easy"
        ? "How would you approach a classification problem with highly imbalanced data?"
        : difficulty === "medium"
          ? "Describe how you would handle a situation where you have limited labeled data for your machine learning task."
          : "How would you design a system that needs to provide real-time predictions while continuously improving its model with new data?",
      type: "problem-solving",
      sampleAnswer: "A good answer would discuss sampling techniques, class weighting, and appropriate evaluation metrics for imbalanced data. For limited data scenarios, transfer learning, data augmentation, and semi-supervised approaches would be covered. Real-time systems would address model serving architectures, feature stores, and online learning approaches."
    };
  }
  
  // DevOps specific problem-solving
  else if (normalizedRole.includes('devops') || normalizedRole.includes('sre')) {
    return {
      id: "problem-solving-1",
      question: difficulty === "easy"
        ? "How would you troubleshoot a failed deployment in a CI/CD pipeline?"
        : difficulty === "medium"
          ? "Describe how you would implement automated disaster recovery procedures for critical systems."
          : "How would you design a self-healing infrastructure that can detect and automatically remediate common failure scenarios?",
      type: "problem-solving",
      sampleAnswer: "A good answer would mention log analysis, rollback procedures, and pipeline structure for deployment issues. For disaster recovery, backup strategies, recovery testing, and automation scripts would be discussed. Self-healing infrastructure would address health checks, circuit breakers, and automatic remediation actions."
    };
  }
  
  // Generic problem-solving question based on difficulty
  else {
    return {
      id: "problem-solving-1",
      question: difficulty === "easy"
        ? "Describe your approach to debugging a complex technical issue in a system you're not familiar with."
        : difficulty === "medium"
          ? "How would you approach refactoring or modernizing a legacy system with minimal documentation?"
          : "Describe how you would design a solution for a system with conflicting requirements of high performance, strong consistency, and global availability.",
      type: "problem-solving",
      sampleAnswer: "A good answer would demonstrate a methodical approach to problem-solving with attention to detail, systematic troubleshooting, and root cause analysis. For complex system design, trade-off analysis, architectural patterns, and iterative implementation approaches would be covered."
    };
  }
}

/**
 * Get a scenario question based on role, difficulty, and experience level
 */
function getScenarioQuestion(role, difficulty, experienceLevel) {
  // Experience-based scenarios
  const seniorScenarios = [
    "Tell me about a time when you had to lead a project that was failing. How did you turn it around?",
    "Describe a situation where you had to make a difficult technical decision with significant trade-offs. How did you approach it?",
    "Tell me about a time when you had to mentor junior team members while dealing with tight deadlines. How did you balance these responsibilities?"
  ];
  
  const midLevelScenarios = [
    "Describe a situation where you had to work with a difficult team member. How did you handle it?",
    "Tell me about a time when you received critical feedback on your work. How did you respond?",
    "Describe a situation where you had to adapt to a significant change in project requirements or technology."
  ];
  
  const entryLevelScenarios = [
    "Tell me about a time when you faced a challenging deadline. How did you manage it?",
    "Describe a situation where you had to learn a new technology or concept quickly. What was your approach?",
    "Tell me about a time when you made a mistake. How did you handle it and what did you learn?"
  ];
  
  // Select a scenario based on experience level
  let scenarioPool;
  if (experienceLevel === 'senior') {
    scenarioPool = seniorScenarios;
  } else if (experienceLevel === 'mid') {
    scenarioPool = midLevelScenarios;
  } else {
    scenarioPool = entryLevelScenarios;
  }
  
  // Add a role-specific element to the scenario if possible
  const normalizedRole = role.toLowerCase();
  let roleSpecificElement = "";
  
  if (normalizedRole.includes('front')) {
    roleSpecificElement = "in front-end development";
  } else if (normalizedRole.includes('back')) {
    roleSpecificElement = "in back-end development";
  } else if (normalizedRole.includes('full')) {
    roleSpecificElement = "in full-stack development";
  } else if (normalizedRole.includes('data')) {
    roleSpecificElement = "in data science or analytics";
  } else if (normalizedRole.includes('devops')) {
    roleSpecificElement = "in a DevOps environment";
  } else if (normalizedRole.includes('product')) {
    roleSpecificElement = "as a product manager";
  }
  
  // Select a random scenario
  const baseScenario = scenarioPool[Math.floor(Math.random() * scenarioPool.length)];
  
  // If we have a role-specific element, insert it into the scenario at an appropriate point
  let question = baseScenario;
  if (roleSpecificElement && !question.includes(roleSpecificElement)) {
    if (question.includes("Tell me about a time when")) {
      question = question.replace("Tell me about a time when", `Tell me about a time when, ${roleSpecificElement},`);
    } else if (question.includes("Describe a situation where")) {
      question = question.replace("Describe a situation where", `Describe a situation where, ${roleSpecificElement},`);
    }
  }
  
  return {
    id: "scenario-1",
    question: question,
    type: "scenario",
    sampleAnswer: `A good answer would demonstrate interpersonal skills, problem-solving abilities, and professional maturity appropriate for a ${experienceLevel}-level ${role}. It should include a specific situation, the actions taken, and the results achieved, showing reflection and learning from the experience.`
  };
}

module.exports = {
  generateInterviewQuestions: exports.generateInterviewQuestions,
  generateFallbackQuestions
};