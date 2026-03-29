import { onRequest } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini AI SDK (It automatically grabs the key from your .env file)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const getAiMove = onRequest({ cors: true }, async (req, res) => {
    // 1. Ensure it's a POST request
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }

    try {
        // 2. Extract the FEN string (board state) and the AI's color from the frontend request
        const fen = req.body.fen;
        const aiColor = req.body.aiColor || "black"; // Defaults to black

        if (!fen) {
            res.status(400).json({ error: "Missing FEN string in request." });
            return;
        }

        console.log(`Calculating move for ${aiColor}. FEN: ${fen}`);

        // 3. Connect to the Gemini 1.5 Flash model (fastest for this use case)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 4. The "Prompt Engineering" step!
        // We tell Gemini exactly how to behave and restrict its output format.
        const prompt = `
      You are a grandmaster-level chess engine playing as ${aiColor}.
      The current board state in FEN notation is: "${fen}".
      Calculate the best next move. 
      Respond strictly with ONLY the move in Standard Algebraic Notation (SAN) (e.g., e5, Nf3, O-O, cxd4). 
      Do not include any explanation, markdown, or punctuation. Just the move.
    `;

        // 5. Ask Gemini and get the text response
        const result = await model.generateContent(prompt);
        const aiMove = result.response.text().trim(); // Trim removes any accidental spaces/newlines

        console.log(`Gemini decided to play: ${aiMove}`);

        // 6. Send the move back to the Angular frontend
        res.status(200).json({ move: aiMove });

    } catch (error) {
        console.error("Error generating AI move:", error);
        res.status(500).json({ error: "Failed to generate AI move." });
    }
});