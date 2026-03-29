# AI-Human-Chess-Game
A single-player chess game with a basic UI, hosted on Google Cloud. The user plays as either White or Black, while the Gemini LLM acts as the opponent's 'brain' to generate moves.

# Define
### Updated Phase 1: Define & Requirements

#### 1. UI Flow & Welcome Screen
* **Welcome Screen:** The initial view when a user loads the app.
    * **Player Name:** An input field to capture the user's name.
    * **Color Selection:** A toggle or buttons allowing the user to choose to play as White or Black pieces.
    * **Start Button:** Initiates the game, locks in the settings, and transitions to the game board.
* **Game Over Popup:** A modal that appears when the game ends, displaying the player's name, the outcome, and perhaps a "Play Again" button that routes back to the Welcome screen.

#### 2. Database & State Tracking
Since you want to store results but *not* persist the live board state, here is how we will handle it:
* **The Database:** Since we are deploying on GCP, **Firestore** (Google's NoSQL document database) is the perfect, lightweight choice.
* **Game Record:** When a user clicks "Start", we create a record in the database.
* **Status ENUM:** You suggested `IN_PROGRESS`, `WIN`, and `LOSE`. 
    * *Candid Reality Check:* Because this is chess, we absolutely need to add **`DRAW`** to this ENUM to account for stalemates, insufficient material, or the 50-move rule.
* **Refresh Behavior:** As you specified, the board state is strictly maintained in the frontend Angular application. If the user refreshes the page, the state is wiped, and they are sent back to the Welcome screen. (The previous database record will simply remain stuck as `IN_PROGRESS`, which is standard for lightweight games).

#### 3. Game Logic & Validation
* **Move Validation:** The frontend will strictly validate all moves before allowing them or sending them to the AI. This includes castling, en passant, and pawn promotion. (Using `chess.js` handles all of this automatically).
* **AI First Move:** If the user selects Black on the welcome screen, the frontend must immediately trigger the AI to make the first move as White before the user can interact with the board.

#### 4. Updated Technology Stack
* **Frontend:** Angular, `chess.js` (validation), `ngx-chess-board` (UI).
* **Backend / Serverless:** Google Cloud Functions (to hide the Gemini API key and talk to the DB).
* **Database:** **Firestore** (to store Player Name, Color, and Game Status).
* **Hosting:** Firebase Hosting or Google Cloud Storage + Cloud CDN.

