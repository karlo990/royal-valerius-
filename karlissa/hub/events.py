"""Live feed for the dashboard (server-sent events). Safe to publish from any thread."""
from __future__ import annotations

import asyncio
import json
from collections import deque

from . import db


class Broker:
    def __init__(self):
        self.subs: set[asyncio.Queue] = set()
        self.loop: asyncio.AbstractEventLoop | None = None
        self.recent: deque = deque(maxlen=60)

    def bind(self, loop: asyncio.AbstractEventLoop) -> None:
        self.loop = loop

    def publish(self, ev: dict) -> None:
        ev = {"at": db.now_iso(), **ev}
        self.recent.appendleft(ev)
        if not self.loop:
            return
        for q in list(self.subs):
            try:
                self.loop.call_soon_threadsafe(q.put_nowait, ev)
            except RuntimeError:
                pass

    async def stream(self):
        q: asyncio.Queue = asyncio.Queue(maxsize=500)
        self.subs.add(q)
        try:
            yield "retry: 3000\n\n"
            yield f"event: hello\ndata: {json.dumps({'data_version': db.data_version(), 'recent': list(self.recent)[:20]})}\n\n"
            while True:
                try:
                    ev = await asyncio.wait_for(q.get(), timeout=15)
                    yield f"data: {json.dumps(ev, default=str)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            self.subs.discard(q)


BROKER = Broker()
db.on_write(BROKER.publish)
