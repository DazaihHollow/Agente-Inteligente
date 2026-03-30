import asyncio
from src.shared.database import SessionLocal
from src.modules.intelligence.processor import ContentProcessor

async def wipe_queue():
    async with SessionLocal() as db:
        processor = ContentProcessor()
        processed = await processor.process_batch(db, limit=100)
        print(f"Processed {processed} stuck records from RawData!")

if __name__ == "__main__":
    asyncio.run(wipe_queue())
