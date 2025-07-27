# Vocalis AI - Sales Simulation Platform

Vocalis AI is an advanced, AI-powered sales training platform designed to simulate realistic sales conversations. It leverages generative voice AI to create dynamic role-playing scenarios between an AI sales agent and an AI consumer, providing a powerful tool for training and performance analysis. Users can also engage in live training sessions, where they act as the sales agent against a sophisticated AI consumer.

## Key Features

- **AI vs. AI Simulation:** Run automated sales conversations between two AI agents with customizable personalities, goals, and knowledge bases.
- **Live Training Mode:** Practice your sales skills by talking directly to an AI consumer that responds in real-time.
- **Generative Voice Modulation:** Experience lifelike conversations with generative voice technology from Google.
- **Performance Analysis:** Receive detailed feedback and a performance score on your sales conversations based on predefined metrics.
- **Session Management:** Save, name, and review past training sessions to track your progress.
- **Containerized Deployment:** A Dockerfile is included for easy, replicable deployment in any environment.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **AI/Generative:** [Google AI (Gemini) & Genkit](https://firebase.google.com/docs/genkit)
- **Speech-to-Text:** [Deepgram](https://deepgram.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)

---

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Docker](https://www.docker.com/products/docker-desktop/) (optional, for containerized deployment)
- A Google AI API key with the Gemini API enabled.
- A Deepgram API key for speech-to-text functionality.

### 1. Environment Setup

First, you need to configure your environment variables. Create a new file named `.env` in the root of the project.

```bash
touch .env
```

Now, open the `.env` file and add your API keys.

```env
# .env

# Your Google AI API key for Gemini models
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Your Deepgram API key for speech-to-text
DEEPGRAM_API_KEY="YOUR_DEEPGRAM_API_KEY"
```

**Important:** The Genkit AI tools run in a separate server process. Ensure these environment variables are also available in your shell environment or loaded by your IDE for the Genkit server to access them.

### 2. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

### 3. Running the Application

This project consists of two main parts: the Next.js web application and the Genkit AI flows. You'll need to run both for the application to function correctly.

**To run the Next.js development server:**

```bash
npm run dev
```

This will start the web application, typically on `http://localhost:9002`.

**To run the Genkit development server:**

In a separate terminal, run the following command to start the Genkit flows. This server handles all the AI-related tasks.

```bash
npm run genkit:dev
```

This will start the Genkit development server, and you can inspect the flows at `http://localhost:3100`.

### 4. Running with Docker

You can also build and run the application using Docker for a more isolated and reproducible environment.

**Build the Docker image:**

```bash
docker build -t vocalis-ai .
```

**Run the Docker container:**

Make sure your `.env` file is present in the project root.

```bash
docker run -p 9002:9002 --env-file ./.env vocalis-ai
```

The application will be accessible at `http://localhost:9002`. The Docker setup handles running both the Next.js and Genkit services concurrently.

---

## Project Structure

Here's a brief overview of the key directories in the project:

- `src/app/`: Contains the main application pages and layouts, following the Next.js App Router structure.
- `src/ai/`: Home to all Genkit-related code, including AI flows, prompts, and tool definitions.
- `src/components/`: Contains all the reusable React components, including UI elements from ShadCN.
- `src/hooks/`: Custom React hooks, such as the `useSessionStore` for managing session state.
- `src/lib/`: Utility functions and library configurations.
- `src/types/`: TypeScript type definitions used across the application.
- `public/`: Static assets like images and fonts.
- `Dockerfile`: Configuration for building the production Docker image.
# Initialize a new Git repository
git init -b main

# Add all the files to the staging area
git add .

# Create your first commit
git commit -m "Initial commit of Vocalis AI project"

# Add your GitHub repository as the remote origin
git remote add origin https://github.com/RyoK3N/Agent-train.git

# Push your code to the main branch on GitHub
git push -u origin main