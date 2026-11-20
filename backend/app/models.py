"""Pydantic models. Mirror docs/CONTRACT.md. Change the contract first."""
from typing import Literal

from pydantic import BaseModel, Field

Goal = Literal[
    "find_job",
    "hire",
    "find_mentor",
    "be_mentor",
    "find_cofounder",
    "exchange_experience",
]
Lang = Literal["kk", "ru", "en"]

# Who should be shown to whom (reciprocity of goals).
RECIPROCAL: dict[str, str] = {
    "find_job": "hire",
    "hire": "find_job",
    "find_mentor": "be_mentor",
    "be_mentor": "find_mentor",
    "find_cofounder": "find_cofounder",
    "exchange_experience": "exchange_experience",
}


class ProfileIn(BaseModel):
    name: str
    role: str
    stack: list[str] = Field(default_factory=list)
    experience_years: int = 0
    interests: list[str] = Field(default_factory=list)
    about: str = ""
    goal: Goal
    lang: Lang = "ru"


class Profile(ProfileIn):
    id: str


class Match(BaseModel):
    profile: Profile
    score: float
    shared_tags: list[str]
    you_give: str
    they_give: str
    explanation: str
    icebreaker: str


class RecommendRequest(BaseModel):
    profile: ProfileIn
    lang: Lang = "ru"


class RecommendResponse(BaseModel):
    took_ms: int
    matches: list[Match]


class FeedbackRequest(BaseModel):
    viewer_id: str
    target_id: str
    verdict: Literal["met", "not_fit"]


class GraphNode(BaseModel):
    id: str
    name: str
    goal: Goal
    cluster: int
    x: float
    y: float


class GraphEdge(BaseModel):
    from_: str = Field(alias="from")
    to: str
    score: float

    model_config = {"populate_by_name": True}


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge] = Field(default_factory=list)
