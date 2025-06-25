from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
from bson import ObjectId, json_util

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Gemini API Setup
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# System prompt for MedAgent
SYSTEM_PROMPT = """Sei MedAgent, assistente sanitario AI specializzato:
- NON formulare diagnosi mediche specifiche
- Mantieni approccio empatico e non allarmistico  
- Raccomanda 118 per emergenze (dolore toracico, difficoltà respiratorie, perdita coscienza, etc.)
- Fornisci educazione sanitaria accessibile
- Classifica urgenza: low/medium/high basata sui sintomi
- Suggerisci 2-3 domande follow-up pertinenti per approfondire
- Risposta sempre in italiano, linguaggio semplice e comprensibile
- Per sintomi gravi o preoccupanti, raccomanda sempre consultazione medica
- Includi sempre disclaimer che non sostituisci parere medico professionale"""

# Models
class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    eta: Optional[str] = None
    genere: Optional[str] = None
    sintomo_principale: Optional[str] = None
    durata: Optional[str] = None
    intensita: Optional[int] = None
    sintomi_associati: List[str] = []
    condizioni_note: List[str] = []
    familiarita: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_profile_id: Optional[str] = None
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    message_count: int = 0
    current_urgency_level: str = "low"
    status: str = "active"  # active, completed, closed
    context_summary: Optional[str] = None

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    message_type: str  # user, assistant
    content: str
    urgency_level: Optional[str] = None
    next_questions: List[str] = []
    metadata: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ProfileUpdateRequest(BaseModel):
    eta: Optional[str] = None
    genere: Optional[str] = None
    sintomo_principale: Optional[str] = None
    durata: Optional[str] = None
    intensita: Optional[int] = None
    sintomi_associati: List[str] = []
    condizioni_note: List[str] = []
    familiarita: Optional[str] = None

# API Routes
@api_router.get("/")
async def root():
    return {"message": "MedAgent API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    try:
        # Check database connection
        await db.list_collection_names()
        
        # Check AI service (basic check)
        ai_status = "ok" if GEMINI_API_KEY else "no_key"
        
        return {
            "status": "healthy",
            "database": "connected",
            "ai_service": ai_status,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")

@api_router.post("/chat/session")
async def create_session():
    session_id = str(uuid.uuid4())
    
    session = ChatSession(session_id=session_id)
    await db.chat_sessions.insert_one(session.dict())
    
    return {"session_id": session_id, "status": "created"}

@api_router.get("/chat/session/{session_id}")
async def get_session(session_id: str):
    session = await db.chat_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get profile if exists
    profile = await db.user_profiles.find_one({"session_id": session_id})
    
    # Convert MongoDB objects to JSON serializable format
    session = json.loads(json_util.dumps(session))
    if profile:
        profile = json.loads(json_util.dumps(profile))
    
    return {
        "session": session,
        "profile": profile
    }

@api_router.post("/chat/profile/{session_id}")
async def create_or_update_profile(session_id: str, profile_data: ProfileUpdateRequest):
    # Check if profile exists
    existing_profile = await db.user_profiles.find_one({"session_id": session_id})
    
    if existing_profile:
        # Update existing profile
        update_data = profile_data.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        await db.user_profiles.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        updated_profile = await db.user_profiles.find_one({"session_id": session_id})
        return {"status": "updated", "profile": updated_profile}
    else:
        # Create new profile
        profile = UserProfile(session_id=session_id, **profile_data.dict(exclude_unset=True))
        await db.user_profiles.insert_one(profile.dict())
        
        # Update session with profile ID
        await db.chat_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"user_profile_id": profile.id}}
        )
        
        return {"status": "created", "profile": profile.dict()}

@api_router.get("/chat/profile/{session_id}")
async def get_profile(session_id: str):
    profile = await db.user_profiles.find_one({"session_id": session_id})
    if not profile:
        return {"profile": None}
    
    # Convert MongoDB object to JSON serializable format
    profile = json.loads(json_util.dumps(profile))
    
    return {"profile": profile}

@api_router.post("/chat/welcome/{session_id}")
async def generate_welcome_message(session_id: str):
    # Get user profile
    profile = await db.user_profiles.find_one({"session_id": session_id})
    
    if not profile:
        welcome_msg = "Ciao! Sono MedAgent, il tuo assistente sanitario digitale. Come posso aiutarti oggi?"
    else:
        # Personalized welcome based on profile
        eta = profile.get('eta', '')
        sintomo = profile.get('sintomo_principale', '')
        
        if sintomo:
            welcome_msg = f"Ciao! Ho visto che hai menzionato '{sintomo}'. Sono qui per aiutarti a capire meglio come stai. Puoi raccontarmi di più su quello che stai vivendo?"
        elif eta:
            welcome_msg = f"Ciao! Sono MedAgent, il tuo assistente sanitario digitale. Sono qui per aiutarti con le tue domande sulla salute. Cosa ti preoccupa oggi?"
        else:
            welcome_msg = "Ciao! Sono MedAgent, il tuo assistente sanitario digitale. Come posso aiutarti oggi?"
    
    # Save welcome message
    message = Message(
        session_id=session_id,
        message_type="assistant",
        content=welcome_msg,
        next_questions=[
            "Puoi descrivermi il sintomo che ti preoccupa?",
            "Da quando hai notato questo problema?",
            "C'è qualcos'altro che ti fa stare male?"
        ]
    )
    
    await db.messages.insert_one(message.dict())
    
    return {
        "message": welcome_msg,
        "next_questions": message.next_questions,
        "urgency_level": "low"
    }

@api_router.post("/chat/message")
async def send_message(request: ChatRequest):
    try:
        session_id = request.session_id
        user_message = request.message
        
        # Save user message
        user_msg = Message(
            session_id=session_id,
            message_type="user",
            content=user_message
        )
        await db.messages.insert_one(user_msg.dict())
        
        # Get conversation history (last 6 messages for context)
        history = await db.messages.find(
            {"session_id": session_id}
        ).sort("timestamp", -1).limit(6).to_list(length=None)
        
        history.reverse()  # Chronological order
        
        # Get user profile for context
        profile = await db.user_profiles.find_one({"session_id": session_id})
        
        # Build context for AI
        context_parts = []
        if profile:
            context_parts.append(f"Profilo utente: Età: {profile.get('eta', 'Non specificato')}, Genere: {profile.get('genere', 'Non specificato')}")
            if profile.get('sintomo_principale'):
                context_parts.append(f"Sintomo principale: {profile['sintomo_principale']}")
            if profile.get('condizioni_note'):
                context_parts.append(f"Condizioni note: {', '.join(profile['condizioni_note'])}")
        
        conversation_context = "\n".join([
            f"{'Utente' if msg['message_type'] == 'user' else 'Assistente'}: {msg['content']}"
            for msg in history[-4:]  # Last 4 messages for context
        ])
        
        context = "\n".join(filter(None, context_parts + [f"\nConversazione recente:\n{conversation_context}"]))
        
        # Initialize Gemini chat
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=session_id,
            system_message=SYSTEM_PROMPT
        ).with_model("gemini", "gemini-2.0-flash").with_max_tokens(1500)
        
        # Create user message with context
        full_message = f"{context}\n\nNuovo messaggio utente: {user_message}"
        user_msg_obj = UserMessage(text=full_message)
        
        # Get AI response
        ai_response = await chat.send_message(user_msg_obj)
        
        # Determine urgency level based on keywords
        urgency_keywords = {
            "high": ["dolore toracico", "difficoltà respiratorie", "perdita coscienza", "emorragia", "trauma", "avvelenamento", "118"],
            "medium": ["febbre alta", "dolore intenso", "vomito persistente", "difficoltà", "preoccupante"],
            "low": ["lieve", "normale", "comune", "non preoccupante"]
        }
        
        urgency_level = "low"
        response_lower = ai_response.lower()
        
        for level, keywords in urgency_keywords.items():
            if any(keyword in response_lower for keyword in keywords):
                urgency_level = level
                break
        
        # Generate follow-up questions based on response
        if "dolore" in user_message.lower():
            next_questions = [
                "Il dolore è costante o intermittente?",
                "Su una scala da 1 a 10, quanto è intenso?",
                "Hai preso qualche farmaco per il dolore?"
            ]
        elif "febbre" in user_message.lower():
            next_questions = [
                "Hai misurato la temperatura?",
                "Da quanto tempo hai la febbre?",
                "Hai altri sintomi come mal di testa o debolezza?"
            ]
        else:
            next_questions = [
                "Puoi dirmi di più su questo sintomo?",
                "È la prima volta che ti succede?",
                "C'è qualcos'altro che ti preoccupa?"
            ]
        
        # Save AI response
        ai_msg = Message(
            session_id=session_id,
            message_type="assistant",
            content=ai_response,
            urgency_level=urgency_level,
            next_questions=next_questions,
            metadata={"context_used": bool(context)}
        )
        
        await db.messages.insert_one(ai_msg.dict())
        
        # Update session
        await db.chat_sessions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "current_urgency_level": urgency_level,
                    "message_count": {"$inc": 1}
                }
            }
        )
        
        return {
            "response": ai_response,
            "urgency_level": urgency_level,
            "next_questions": next_questions,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logging.error(f"Error in send_message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    messages = await db.messages.find(
        {"session_id": session_id}
    ).sort("timestamp", 1).to_list(length=None)
    
    return {"messages": messages}

@api_router.get("/chat/summary/{session_id}")
async def get_session_summary(session_id: str):
    # Get session
    session = await db.chat_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get profile
    profile = await db.user_profiles.find_one({"session_id": session_id})
    
    # Get messages
    messages = await db.messages.find(
        {"session_id": session_id}
    ).sort("timestamp", 1).to_list(length=None)
    
    # Count messages by type
    user_messages = len([m for m in messages if m["message_type"] == "user"])
    assistant_messages = len([m for m in messages if m["message_type"] == "assistant"])
    
    # Get urgency levels mentioned
    urgency_levels = [m.get("urgency_level") for m in messages if m.get("urgency_level")]
    max_urgency = "high" if "high" in urgency_levels else "medium" if "medium" in urgency_levels else "low"
    
    return {
        "session_info": {
            "session_id": session_id,
            "start_time": session["start_time"],
            "duration_minutes": (datetime.utcnow() - session["start_time"]).total_seconds() / 60,
            "status": session["status"]
        },
        "conversation_stats": {
            "total_messages": len(messages),
            "user_messages": user_messages,
            "assistant_messages": assistant_messages,
            "max_urgency_level": max_urgency
        },
        "profile_summary": profile,
        "recommendations": {
            "urgency_level": max_urgency,
            "next_steps": "Consulta il tuo medico se i sintomi persistono o peggiorano" if max_urgency != "low" else "Monitora i sintomi e cerca assistenza se necessario"
        }
    }

@api_router.post("/chat/close/{session_id}")
async def close_session(session_id: str):
    await db.chat_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "status": "closed",
                "end_time": datetime.utcnow()
            }
        }
    )
    
    return {"status": "closed", "session_id": session_id}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()