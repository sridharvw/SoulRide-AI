

🏍️ SoulRide AI

An Intelligent, Context-Aware Vehicle Companion Ecosystem

SoulRide AI is a mobile-first Progressive Web Application (PWA) designed to transition vehicle management from a manual, reactive chore into a proactive, intelligent experience. By unifying financial tracking, document digitization, and context-aware AI assistance, SoulRide AI acts as a dedicated digital co-pilot for motorcycle and car enthusiasts.

🚀 Core Features

🧠 Context-Injected AI Assistant: A voice-enabled chatbot powered by the Google Gemini API. It analyzes your specific vehicle's logged data (make, model, odometer, service history) to provide highly personalized maintenance and troubleshooting advice.

📸 Localized OCR Document Scanner: Uses device cameras and Tesseract.js (WebAssembly) to extract text from physical fuel receipts and service bills securely on the client side, archiving them into a Digital Locker.

💰 Expense & Fuel Analytics: Tracks and categorizes vehicle expenditures. Utilizes Chart.js to render interactive data visualizations for running costs and fuel efficiency trends.

🚨 Emergency SOS Module: A high-stress-optimized UI featuring a one-tap emergency dialer (112) and a statically rendered Medical ID (blood group, allergies) for rapid access by first responders.

🗺️ Proximity Mapping: Integrates native Geolocation and Leaflet.js to map out nearby points of interest, including petrol pumps, service centers, and EV charging stations.

🎨 Premium Automotive UI: A distraction-free, glassmorphism-based "Dark Mode" aesthetic engineered to mimic high-end modern vehicle cockpits.

🛠️ Technology Stack

Frontend Architecture:

Markup & Styling: HTML, Custom CSS (CSS Grid, Flexbox, CSS Variables)

Logic & State: Vanilla JavaScript (ES6+ Modules, Promises, Async/Await)

Icons & UI: BoxIcons SVG Library

Web APIs & Integrations:

Generative AI: AI API (REST API)

Computer Vision: Tesseract.js (Client-side OCR)

Data Visualization: Chart.js

Interactive Mapping: Leaflet.js

Native Browser APIs: Web Speech API (STT/TTS), Navigator Geolocation API, LocalStorage (Offline State Persistence)

⚙️ System Architecture

SoulRide AI utilizes a decoupled, edge-heavy architecture. Heavy computational tasks, such as Optical Character Recognition (OCR), are executed locally on the user's device via WebAssembly to ensure data privacy.

The core innovation is Context Injection Prompting:

The user inputs a query (e.g., "Why are my brakes squeaking?").

The JS State Manager intercepts the query and fetches the user's specific vehicle data (e.g., "Honda CB350, 25,000km, last brake service: 2 years ago").

This context is hidden inside a "System Prompt" and sent to the Gemini API.

Gemini responds with a highly specific, mechanic-level diagnosis tailored to the user's actual vehicle state.

💻 Getting Started (Local Development)

Because SoulRide AI utilizes a lightweight frontend architecture without heavy frameworks, running it locally is incredibly fast.

Prerequisites

Visual Studio Code (VS Code)

Live Server Extension (for VS Code)

A valid Google Gemini API Key

Installation

Sridhar S

Bachelor of Science in Computer Science

Presidency College (Autonomous), Bangalore

Batch: 2024 - 2027

Developed as a partial fulfillment of the Mini Project requirement.
