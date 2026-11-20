"""Models for events, members, roles and access. Mirror docs/CONTRACT.md."""
from typing import Literal

from pydantic import BaseModel, Field

from .models import Goal, Lang, Match, Profile, ProfileIn

SystemRole = Literal["admin", "organizer", "member"]
EventStatus = Literal["open", "closed"]


class EventIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    date: str = ""
    venue: str = ""
    code: str | None = Field(default=None, min_length=4, max_length=12)  # generated when omitted
    organizer_ids: list[str] = Field(default_factory=list)


class EventPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    date: str | None = None
    venue: str | None = None
    status: EventStatus | None = None
    organizer_ids: list[str] | None = None


class Event(BaseModel):
    id: str
    code: str
    title: str
    date: str
    venue: str
    status: EventStatus
    organizer_ids: list[str]
    created_at: str
    attendee_count: int
    join_path: str  # "/#/join/<code>", the hash route the frontend serves
    join_url: str  # PUBLIC_URL + join_path, what the QR code encodes


class LoginRequest(BaseModel):
    code: str


class LoginResponse(BaseModel):
    token: str


class JoinRequest(BaseModel):
    # Required for a new member. Omit it when the request carries a valid X-Member-Token.
    profile: ProfileIn | None = None
    # Optional contact (for example a Telegram handle). Shown only after a mutual "want to meet".
    contact: str | None = Field(default=None, max_length=80)
    lang: Lang = "ru"


class JoinResponse(BaseModel):
    member_id: str
    token: str
    event: Event
    took_ms: int
    matches: list[Match]


class Attendee(BaseModel):
    profile: Profile
    system_role: SystemRole


class MemberOut(Attendee):
    events: list[str]  # event ids


class AttendeeIn(BaseModel):
    member_id: str | None = None  # add an existing member
    profile: ProfileIn | None = None  # or create a new one


class RoleRequest(BaseModel):
    role: SystemRole


class MeetRequest(BaseModel):
    target_id: str


class MeetResponse(BaseModel):
    mutual: bool
    contact: str | None = None  # only when mutual and the other person left one


class MutualOut(BaseModel):
    profile: Profile
    contact: str | None = None


class MeOut(BaseModel):
    profile: Profile
    system_role: SystemRole
    events: list[Event]


class GoalCount(BaseModel):
    goal: Goal
    count: int


class Hint(BaseModel):
    code: Literal["scarce_supply"]
    scarce: Goal
    plenty: Goal
    scarce_count: int
    plenty_count: int


class Stats(BaseModel):
    attendees: int
    by_goal: list[GoalCount]
    hints: list[Hint]
